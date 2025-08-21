// routes.js
import express from 'express';
import { request } from 'undici';
import { lineString } from '@turf/helpers';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import distance from '@turf/distance';

// -------------------- Dependencias externas al modelo --------------------
// Implementa estas funciones contra tu modelo/DB.
async function loadRoute(routeId) {
  // TODO: trae { bbox, ways, union, orderedWayIds, polylineCache, version, updatedAt } desde tu DB
  throw new Error('loadRoute(routeId) no implementado');
}
async function saveRoute(routeId, route) {
  // TODO: actualiza la entidad en DB
  throw new Error('saveRoute(routeId, route) no implementado');
}
async function saveTraceSummary(routeId, segments) {
  // (opcional) guarda resumen de la traza en DB
}
async function ensureWaysForRoute(route, points) {
  // Trae ways OSM (Overpass) para una bbox que cubra la ruta y/o la nueva traza, y
  // devuelve { list: Way[], dict: { [wayId]: { coords, name, highway } }, bbox }
  // Puedes mezclar con route.ways existentes (merge) para no perder datos.
  const bboxFromPoints = computeBBox(points, 180);
  const bbox = route?.bbox ? mergeBBoxes(route.bbox, bboxFromPoints) : bboxFromPoints;
  const overpassUrl = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
  const ways = await fetchOverpassWays(bbox, overpassUrl);
  const dict = {};
  for (const w of ways) dict[w.id] = {
    coords: w.coords,
    name: w.name,
    highway: w.highway,
    maxspeed: w.maxspeed
  };
  return { list: ways, dict, bbox };
}

// -------------------- Utils Overpass / BBox --------------------
function computeBBox(points, bufferMeters) {
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

function mergeBBoxes(a, b) {
  return [
    Math.min(a[0], b[0]),
    Math.min(a[1], b[1]),
    Math.max(a[2], b[2]),
    Math.max(a[3], b[3])
];
}

function buildOverpassQL(bbox) {
  return `
  [out:json][timeout:180];
  way["highway"](${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]});
  out tags geom;
  `;
}

async function fetchOverpassWays(bbox, overpassUrl) {
  const body = buildOverpassQL(bbox);
  const res = await request(overpassUrl, {
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

// -------------------- Snapping / Segmentación / Unión --------------------
const DEFAULTS_KMH = {
  motorway: 100, trunk: 80, primary: 60, secondary: 60,
  tertiary: 50, residential: 30, living_street: 20, service: 20
};

function snapPointToWaysWithS(p, ways) {
  let best = null;
  let bestDist = Infinity;
  for (const w of ways) {
    const ls = lineString(w.coords);
    // location en km si units='kilometers'
    const np = nearestPointOnLine(ls, [p.lon, p.lat], { units: 'kilometers' });
    const snapped = { lon: np.geometry.coordinates[0], lat: np.geometry.coordinates[1] };
    const d = distance([p.lon, p.lat], [snapped.lon, snapped.lat], { units: 'meters' });
    if (d < bestDist) {
      const sMeters = np.properties?.location != null ? np.properties.location * 1000 : null;
      bestDist = d;
      best = { way: w, snapped, distMeters: d, s: sMeters };
    }
  }
  return best;
}

function parseMaxspeedToKmh(s, highway, defaultsKmh = DEFAULTS_KMH) {
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

function annotatePoints(points, ways, snapMaxDistMeters = 50) {
  const annotated = [];
  for (const p of points) {
    const hit = snapPointToWaysWithS(p, ways);
    if (!hit) {
      annotated.push({ ...p, snappedLon: null, snappedLat: null, street: null, wayId: null, highway: null, maxSpeedKmh: null, speed_kmh: p.speed_mps ? p.speed_mps * 3.6 : null, s: null, wayCoords: null, note: 'no_way_found' });
    } else if (hit.distMeters > snapMaxDistMeters) {
      annotated.push({ ...p, snappedLon: null, snappedLat: null, street: null, wayId: null, highway: null, maxSpeedKmh: null, speed_kmh: p.speed_mps ? p.speed_mps * 3.6 : null, s: null, wayCoords: null, note: 'far_from_road' });
    } else {
      const maxSpeedKmh = parseMaxspeedToKmh(hit.way.maxspeed, hit.way.highway);
      annotated.push({
        ...p,
        snappedLon: hit.snapped.lon,
        snappedLat: hit.snapped.lat,
        street: hit.way.name,
        wayId: hit.way.id,
        highway: hit.way.highway,
        maxSpeedKmh,
        speed_kmh: p.speed_mps ? p.speed_mps * 3.6 : null,
        s: hit.s,
        wayCoords: hit.way.coords,
        note: null
      });
    }
  }
  return annotated;
}

function consolidateByWayWithS(pointsWithAttrs) {
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
              wayId: q.wayId, name: q.street, highway: q.highway,
              maxSpeedKmh: q.maxSpeedKmh, sStart: q.s, sEnd: q.s, coords: q.wayCoords
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

function addInterval(unionForWay, sA, sB) {
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

function mergeUnion(existingUnion, newSegments) {
  const union = existingUnion ? { ...existingUnion } : {};
  for (const seg of newSegments) {
    if (seg.wayId == null || seg.sStart == null || seg.sEnd == null) continue;
    const list = union[seg.wayId] || [];
    union[seg.wayId] = addInterval(list, seg.sStart, seg.sEnd);
  }
  return union;
}

// -------------------- Polilínea desde union --------------------
function cumulativeLengthsMeters(coords) {
  const L = [];
  let acc = 0;
  for (let i = 0; i < coords.length; i++) {
    if (i === 0) L.push(0);
    else {
      acc += distance(coords[i - 1], coords[i], { units: 'meters' });
      L.push(acc);
    }
  }
  return L;
}

function interpolatePointByS(coords, L, s) {
  if (s <= 0){
    return [coords[0][0], coords[0][1]]
  }
  const total = L[L.length - 1];
  if (s >= total){
    return [coords[coords.length - 1][0], coords[coords.length - 1][1]]
  }
  let i = 1;
  while (i < L.length && L[i] < s) i++;
  const s0 = L[i - 1], s1 = L[i];
  const t = (s - s0) / (s1 - s0);
  const x = coords[i - 1][0] + t * (coords[i][0] - coords[i - 1][0]);
  const y = coords[i - 1][1] + t * (coords[i][1] - coords[i - 1][1]);
  return [x, y];
}

function cutLineByS(coords, sA, sB) {
  if (!coords || coords.length < 2) return [];
  const L = cumulativeLengthsMeters(coords);
  const total = L[L.length - 1];
  let from = sA, to = sB, reverse = false;
  if (to < from) { const t = from; from = to; to = t; reverse = true; }
  if (to < 0 || from > total) return [];
  if (from < 0) from = 0;
  if (to > total) to = total;

  const startPt = interpolatePointByS(coords, L, from);
  const endPt = interpolatePointByS(coords, L, to);

  const out = [startPt];
  for (let i = 1; i < coords.length; i++) {
    const sHere = L[i];
    if (sHere > from && sHere < to) out.push([coords[i][0], coords[i][1]]);
  }
  out.push(endPt);
  if (reverse) out.reverse();
  return out;
}

function buildPolylineFromUnion(union, waysDict, orderedWayIds) {
  const coords = [];
  const order = orderedWayIds?.length ? orderedWayIds : Object.keys(union);
  for (const wayId of order) {
    const intervals = union[wayId];
    const way = waysDict[wayId];
    if (!intervals || !way?.coords || way.coords.length < 2) continue;

    for (const [sA, sB] of intervals) {
      const sub = cutLineByS(way.coords, sA, sB);
      if (!sub.length) continue;

      if (coords.length) {
        const last = coords[coords.length - 1];
        const first = sub[0];
        const dup = Math.abs(last[0] - first[0]) < 1e-12 && Math.abs(last[1] - first[1]) < 1e-12;
        if (dup) for (let i = 1; i < sub.length; i++) coords.push(sub[i]);
        else for (let i = 0; i < sub.length; i++) coords.push(sub[i]);
      } else {
        for (let i = 0; i < sub.length; i++) coords.push(sub[i]);
      }
    }
  }
  return coords; // [[lon,lat]...]
}

// (opcional) codificador polyline de Google: usa tu lib favorita
function encodeGooglePolyline(coords) {
  // Puedes reemplazar esto por 'google-polyline' o similar.
  // Aquí devolvemos crudo (array) para simplicidad.
  return coords;
}

// -------------------- Router Express (solo handlers) --------------------
export function registerRouteApi(app) {
  const router = express.Router();

  // POST /routes/:id/ingest  -> ingesta incremental
  router.post('/:id/ingest', async (req, res) => {
    try {
      const routeId = req.params.id;
      const { points } = req.body || {};
      if (!Array.isArray(points) || points.length === 0) {
        res.status(400).json({ error: 'points vacío' });
        return;
      }

      // 1) cargar/crear route
      const route = await loadRoute(routeId);

      // 2) asegurar ways (OSM) para bbox combinada
      const waysPack = await ensureWaysForRoute(route, points);
      route.ways = waysPack.dict;
      route.bbox = waysPack.bbox;

      // 3) snap + consolidar
      const annotated = annotatePoints(points, waysPack.list, 50);
      const segs = consolidateByWayWithS(annotated);

      // 4) fusionar union incremental
      route.union = mergeUnion(route.union, segs);

      // 5) inicializar/actualizar orden (si no existe, toma orden del primer ingest)
      if (!route.orderedWayIds || route.orderedWayIds.length === 0) {
        const ids = [];
        for (const s of segs) if (!ids.includes(s.wayId)) ids.push(s.wayId);
        route.orderedWayIds = ids;
      }

      // 6) invalidar cache y guardar
      route.polylineCache = null;
      route.version = (route.version || 0) + 1;
      route.updatedAt = new Date().toISOString();

      await saveRoute(routeId, route);
      await saveTraceSummary(routeId, segs); // opcional

      res.json({
        ok: true,
        addedSegments: segs.length,
        version: route.version
      });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  // GET /routes/:id  -> devuelve polyline cacheada o la reconstruye desde union
  router.get('/:id', async (req, res) => {
    try {
      const routeId = req.params.id;
      const route = await loadRoute(routeId);
      if (!route) {
        res.status(404).json({ error: 'route not found' });
        return;
      }

      if (route.polylineCache) {
        return res.json({
          id: routeId,
          polyline: route.polylineCache,
          version: route.version,
          updatedAt: route.updatedAt
        });
      }

      const coords = buildPolylineFromUnion(
        route.union || {},
        route.ways || {},
        route.orderedWayIds || []
      );
      const encoded = encodeGooglePolyline(coords);
      route.polylineCache = encoded;
      route.updatedAt = new Date().toISOString();
      await saveRoute(routeId, route);
      res.json({
        id: routeId,
        polyline: encoded,
        version: route.version,
        updatedAt: route.updatedAt
      });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.use('/routes', router);
}
