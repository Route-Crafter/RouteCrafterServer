const DEFAULTS_KMH = {
  motorway: 100,
  trunk: 80,
  primary: 60,
  secondary: 60,
  tertiary: 50,
  residential: 30,
  living_street: 20,
  service: 20
};

export class GeoAggregationAdapter {

  constructor({
    defaultOverpassUrl,
    request,
    lineString,
    nearestPointOnLine,
    distance
  }){
    this.defaultOverpassUrl = defaultOverpassUrl
    this.request = request
    this.lineString = lineString
    this.nearestPointOnLine = nearestPointOnLine
    this.distance = distance
  }

  // -------------------- Utils Overpass / BBox --------------------

  ensureWaysForRoute = async (route, points) => {
      // Trae ways OSM (Overpass) para una bbox que cubra la ruta y/o la nueva traza, y
      // devuelve { list: Way[], dict: { [wayId]: { coords, name, highway } }, bbox }
      // Puedes mezclar con route.ways existentes (merge) para no perder datos.
      const bboxFromPoints = this.computeBBox(points, 180);
      const bbox = route?.bbox ? this.mergeBBoxes(route.bbox, bboxFromPoints) : bboxFromPoints;
      const overpassUrl = process.env.OVERPASS_URL || this.defaultOverpassUrl;
      const ways = await this.fetchOverpassWays(bbox, overpassUrl);
      const dict = {};
      for (const w of ways) {
        const maxSpeedKmh = this.parseMaxspeedToKmh(w.maxspeed, w.highway);
        dict[w.id] = {
          coords: w.coords,
          name: w.name,
          highway: w.highway,
          maxSpeedKmh
        };
        w[maxSpeedKmh] = maxSpeedKmh
      } 
      return { list: ways, dict, bbox };
  }

  computeBBox = (points, bufferMeters) => {
      let minLat =  90, minLon =  180, maxLat = -90, maxLon = -180;
      for (const p of points) {
          if (p.lat < minLat) minLat = p.lat;
          if (p.lat > maxLat) maxLat = p.lat;
          if (p.lon < minLon) minLon = p.lon;
          if (p.lon > maxLon) maxLon = p.lon;
      }
      const latBufferDeg = bufferMeters / 111000;
      const centerLat = (minLat + maxLat) / 2;
      let lonMeterPerDeg = 111000 * Math.cos(centerLat * Math.PI / 180);
      if (lonMeterPerDeg < 1) lonMeterPerDeg = 1;
      const lonBufferDeg = bufferMeters / lonMeterPerDeg;
      return [minLon - lonBufferDeg, minLat - latBufferDeg, maxLon + lonBufferDeg, maxLat + latBufferDeg];
  }

  mergeBBoxes = (a, b) => {
    return [
      Math.min(a[0], b[0]),
      Math.min(a[1], b[1]),
      Math.max(a[2], b[2]),
      Math.max(a[3], b[3])
    ];
  }

  fetchOverpassWays = async (bbox, overpassUrl) => {
    const body = this.buildOverpassQL(bbox);
    const res = await this.request(overpassUrl, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const json = await res.body.json();
    const ways = [];
    if (json && json.elements) {
      for (const e of json.elements) {
        if (e.type === 'way' && e.geometry && e.geometry.length > 1) {
          const coords = e.geometry.map(g => [g.lon, g.lat]);
          ways.push({
            id: e.id,
            name: e.tags?.name ?? null,
            maxspeed: e.tags?.maxspeed ?? null,
            highway: e.tags?.highway ?? null,
            tags: e.tags || {},
            coords
          });
        }
      }
    }
    return ways;
  }

  buildOverpassQL = (bbox) => {
      return `
      [out:json][timeout:180];
      (
        way
          ["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street)$"]
          ["area"!="yes"]
          ["construction"!~".*"]
          ["proposed"!~".*"]
          (${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]});
      );
      out tags geom;
      `;
  }

  parseMaxspeedToKmh = (s, highway, defaultsKmh = DEFAULTS_KMH) => {
    if (!s) return defaultsKmh[highway] ?? null;
    const t = String(s).toLowerCase().trim();
    const num = parseFloat(t);
    if (!Number.isNaN(num)) return num;
    if (t.includes('km/h')) {
      const n = parseFloat(t.replace('km/h', '').trim());
      if (!Number.isNaN(n)) return n;
    }
    return defaultsKmh[highway] ?? null;
  }

  // -------------------- Snapping / Segmentación / Unión --------------------

  annotatePoints = (points, ways, snapMaxDistMeters = 50) => {
    const annotated = [];
    for (const p of points) {
      const hit = this.snapPointToWaysWithS(p, ways);
      if (!hit) {
        annotated.push({
          ...p,
          snappedLon: null,
          snappedLat: null,
          street: null,
          wayId: null,
          highway: null,
          maxSpeedKmh: null,
          speed_kmh: p.speed_mps ? p.speed_mps * 3.6 : null,
          s: null,
          wayCoords: null,
          note: 'no_way_found' 
        });
      } else if (hit.distMeters > snapMaxDistMeters) {
        annotated.push({
          ...p,
          snappedLon: null,
          snappedLat: null,
          street: null,
          wayId: null,
          highway: null,
          maxSpeedKmh: null,
          speed_kmh: p.speed_mps ? p.speed_mps * 3.6 : null,
          s: null,
          wayCoords: null,
          note: 'far_from_road'
        });
      } else {
        annotated.push({
          ...p,
          snappedLon: hit.snapped.lon,
          snappedLat: hit.snapped.lat,
          street: hit.way.name,
          wayId: hit.way.id,
          highway: hit.way.highway,
          speed_kmh: p.speed_mps ? p.speed_mps * 3.6 : null,
          maxSpeedKmh: hit.way.maxSpeedKmh,
          s: hit.s,
          wayCoords: hit.way.coords,
          note: null
        });
      }
    }
    return annotated;
  }

  snapPointToWaysWithS = (p, ways) => {
    let best = null;
    let bestDist = Infinity;
    for (const w of ways) {
      const ls = this.lineString(w.coords);
      // location en km si units='kilometers'
      const np = this.nearestPointOnLine(ls, [p.lon, p.lat], { units: 'kilometers' });
      const snapped = { lon: np.geometry.coordinates[0], lat: np.geometry.coordinates[1] };
      const d = this.distance([p.lon, p.lat], [snapped.lon, snapped.lat], { units: 'meters' });
      if (d < bestDist) {
        //sMeters: la distancia del punto con el inicio de la línea (la distancia recorrida)
        //np.properties.location está en kms porque así se pidió en this.nearestPointOnLine(...)
        const sMeters = np.properties?.location != null ? np.properties.location * 1000 : null;
        bestDist = d;
        best = {
          way: w,
          snapped,
          distMeters: d,
          s: sMeters
        };
      }
    }
    return best;
  }

  consolidateByWayWithS = (pointsWithAttrs) => {
    const out = [];
    if (!pointsWithAttrs?.length) return out;

    let i = 0;
    while (i < pointsWithAttrs.length && pointsWithAttrs[i].wayId == null) i++;
    if (i >= pointsWithAttrs.length) return out;

    let current = {
      wayId: pointsWithAttrs[i].wayId,
      name: pointsWithAttrs[i].street,
      highway: pointsWithAttrs[i].highway,
      maxSpeedKmh: pointsWithAttrs[i].maxSpeedKmh,
      sStart: pointsWithAttrs[i].s,
      sEnd: pointsWithAttrs[i].s,
      coords: pointsWithAttrs[i].wayCoords
    };
    i++;

    for (; i < pointsWithAttrs.length; i++) {
      const p = pointsWithAttrs[i];
      if (p?.wayId === current.wayId && p.s != null) {
        current.sEnd = p.s;
      } else {
        out.push({ ...current });
        if (p?.wayId != null) {
          current = {
            wayId: p.wayId,
            name: p.street,
            highway: p.highway,
            maxSpeedKmh: p.maxSpeedKmh,
            sStart: p.s,
            sEnd: p.s,
            coords: p.wayCoords
          };
        } else {
          // busca siguiente válido
          let j = i + 1, found = false;
          for (; j < pointsWithAttrs.length; j++) {
            const q = pointsWithAttrs[j];
            if (q?.wayId != null) {
              current = {
                wayId: q.wayId,
                name: q.street,
                highway: q.highway,
                maxSpeedKmh: q.maxSpeedKmh,
                sStart: q.s,
                sEnd: q.s,
                coords: q.wayCoords
              };
              i = j;
              found = true;
              break;
            }
          }
          if (!found) break;
        }
      }
    }
    out.push({ ...current });
    return out;
  }

  mergeUnion = (existingUnion, newSegments) => {
    const union = existingUnion ? { ...existingUnion } : {};
    for (const seg of newSegments) {
      if (seg.wayId == null || seg.sStart == null || seg.sEnd == null) continue;
      const list = union[seg.wayId] || [];
      union[seg.wayId] = this.addInterval(list, seg.sStart, seg.sEnd);
    }
    return union;
  }

  addInterval = (unionForWay, sA, sB) => {
    const a = Math.min(sA, sB), b = Math.max(sA, sB);
    if (!unionForWay?.length) return [[a, b]];
    const out = [];
    let inserted = false;
    let curA = a, curB = b;

    for (const [uA, uB] of unionForWay) {
      if (uB < curA) out.push([uA, uB]);
      else if (curB < uA) {
        if (!inserted) {
          out.push([curA, curB])
          inserted = true
        }
        out.push([uA, uB]);
      } else {
        curA = Math.min(curA, uA);
        curB = Math.max(curB, uB);
      }
    }
    if (!inserted) out.push([curA, curB]);
    out.sort((x, y) => x[0] - y[0]);
    return out;
  }

}