export class GeoAggregationService {
    constructor({ adapter }){
        this.adapter = adapter
    }

    insertPointsInToRoute = async ({ route, points }) => {
        // 1. asegurar ways (OSM) para bbox combinada
        const waysPack = await this.adapter.ensureWaysForRoute(route, points)
        route.ways = waysPack.dict
        route.bbox = waysPack.bbox
        // 2. snap + consolidar
        const annotated =  this.adapter.annotatePoints(points, waysPack.list, 50)
        const segs = this.adapter.consolidateByWayWithS(annotated)
        // 3. fusionar union incremental
        route.union = this.adapter.mergeUnion(route.union, segs)
        //4. inicializar/actualizar orden (si no existe, toma orden del primer ingest)
        if(!route.orderedWayIds || route.orderedWayIds.length === 0) {
            const ids = []
            for (const s of segs) if (!ids.includes(s.wayId)) ids.push(s.wayId);
            route.orderedWayIds = ids;
        }
    }

    getCoordsFromUnion = ({ union, waysDict, orderedWayIds }) => {
        const rawCoords = this.adapter.buildPolylineFromUnion(union, waysDict, orderedWayIds)
        const coords = []
        for(let c of rawCoords) {
            coords.push({
                lon: c[0],
                lat: c[1]
            })
        }
        return coords
    }
}