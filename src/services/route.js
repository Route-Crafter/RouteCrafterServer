export class RouteService {
    constructor({
        routeModel,
        wayModel,
        wayCoordModel,
        routeWayModel,
        routeWayExecutionUnionSegmentModel
    }){
        this.routeModel = routeModel
        this.wayModel = wayModel
        this.wayCoordModel = wayCoordModel
        this.routeWayModel = routeWayModel
        this.routeWayExecutionUnionSegmentModel = routeWayExecutionUnionSegmentModel
    }

    createRoute = async ({ input, cityId }) => {
        return await this.routeModel.create({input, cityId})
    }

    updateRoute = async ({ input, id }) => {
        const bbox = {
            minLon: input.bbox[0],
            minLat: input.bbox[1],
            maxLon: input.bbox[2],
            maxLat: input.bbox[3]
        }
        await this.routeModel.update({
            input: bbox,
            id
        })
        const localOrder = await this.routeWayModel.getAllByRouteId({
            routeId: id
        })
        for(let [wayId, way] of Object.entries(input.ways)){
            wayId = Number(wayId)
            this.updateByWay({
                input,
                routeId: id,
                wayId,
                way,
                localOrder
            })
        }
    }

    updateByWay = async ({ input, routeId, wayId, way, localOrder }) => {
        const localWay = await this.wayModel.getById(wayId)
        if(!localWay){
            await this.createWay({
                wayId,
                way
            })
        }
        await this.updateUnion({
            input,
            routeId,
            wayId
        })
        await this.updateLocalOrder({
            input,
            routeId,
            wayId,
            localOrder
        })
        
    }

    createWay = async ({ wayId, way }) => {
        await this.wayModel.create({
            input: way,
            id: wayId
        })
        for(let c of way.coords){
            const points = {
                lon: c[0],
                lat: c[1]
            }
            await this.wayCoordModel.create({
                input: points,
                wayId
            })
        }
    }

    updateUnion = async ({ input, routeId, wayId }) => {
        const union = input.union[wayId]
        if(union){
            await this.routeWayExecutionUnionSegmentModel.removeAllByRouteIdAndWayId({
                routeId,
                wayId
            })
            for(let uP of union) {
                await this.routeWayExecutionUnionSegmentModel.create({
                    input: {
                        p1: uP[0],
                        p2: uP[1]
                    },
                    routeId,
                    wayId
                })
            }
        }
    }

    updateLocalOrder = async ({ input, routeId, wayId, localOrder }) => {
        const wayLocalOrder = localOrder.indexOf(wayId)
        const wayOrder = input.orderedWayIds.indexOf(wayId)
        if(wayOrder != -1){
            if(wayLocalOrder != -1){
                if(wayLocalOrder !== wayOrder){
                    await this.routeWayModel.update(
                        {
                            input: {
                                orderedPosition: wayOrder
                            },
                            routeId,
                            wayId
                        }
                    )
                }
            } else {
                await this.routeWayModel.create({
                    input: {
                        orderedPosition: wayOrder
                    },
                    routeId,
                    wayId
                })
            }
        }
        
    }

    getRouteById = async ({ id }) => {
        const route = await this.routeModel.getById({ id })
        let routeWays = await this.routeWayModel.getAllByRouteId({ routeId: id })
        routeWays = routeWays.sort(
            (r1, r2) => r1.orderedPosition - r2.orderedPosition
        )
        const orderedWayIds = []
        const ways = {}
        const union = {}
        for(let rWay of routeWays) {
            await this.formatDataForWay({
                routeId: id,
                routeWay: rWay,
                orderedWayIds,
                ways,
                union
            })
        }
        const allRoute = {
            ...route,
            ways,
            union,
            orderedWayIds
        }
        if(allRoute.minLon && allRoute.maxLon && allRoute.minLat && allRoute.maxLat){
            allRoute.bbox = [
                route.minLon,
                route.minLat,
                route.maxLon,
                route.maxLat
            ]
        }
        return allRoute
    }

    formatDataForWay = async ({ routeId, routeWay, orderedWayIds, ways, union }) => {
        const wayId = routeWay.wayId
        orderedWayIds.push(wayId)
        const way = await this.wayModel.getById({ id: wayId })
        const coords = await this.wayCoordModel.getAllByWayId({ wayId })
        way.coords = coords.map(
            c => { return [c.lon, c.lat] }
        )
        ways[wayId] = way
        const wayUnion = await this.routeWayExecutionUnionSegmentModel.getByRouteIdAndWayId({
            routeId,
            wayId
        })
        union[wayId] = wayUnion.map(
            u => { return [u.p1, u.p2] }
        )
    } 
}