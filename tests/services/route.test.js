import { beforeEach, describe, jest } from '@jest/globals'
import { RouteService } from '../../src/services/route.js'

describe('RouteService', () => {
    let routeService
    let routeModel
    let wayModel
    let wayCoordModel
    let routeWayModel
    let routeWayExecutionUnionSegmentModel

    beforeEach(() => {
        routeModel = {
            getById: jest.fn(),
            update: jest.fn()
        }
        wayModel = {
            getById: jest.fn(),
            create: jest.fn()
        }
        wayCoordModel = {
            getAllByWayId: jest.fn(),
            create: jest.fn()
        }
        routeWayModel = {
            getAllByRouteId: jest.fn(),
            create: jest.fn(),
            update: jest.fn()
        }
        routeWayExecutionUnionSegmentModel = {
            getByRouteIdAndWayId: jest.fn(),
            removeAllByRouteIdAndWayId: jest.fn(),
            create: jest.fn()
        }
        routeService = new RouteService({
            routeModel,
            wayModel,
            wayCoordModel,
            routeWayModel,
            routeWayExecutionUnionSegmentModel
        })
    })

    describe('createWay', () => {
        let wayId
        let way

        beforeEach(() => {
            wayId = 1
        })

        it('Debe crear el way y cada una de sus coordenadas', async () => {
            way = {
                name: 'way name',
                highway: 'street',
                maxSpeedKmh: 35,
                coords: [[0.1, 0.01], [0.012, 0.015]]
            }
            await routeService.createWay({ wayId, way })
            expect(wayModel.create).toHaveBeenNthCalledWith(
                1,
                {
                    input: way,
                    id: wayId
                }
            )
            expect(wayCoordModel.create).toHaveBeenNthCalledWith(
                1,
                {
                    input: {
                        lon: way.coords[0][0],
                        lat: way.coords[0][1]
                    },
                    wayId
                }
            )
            expect(wayCoordModel.create).toHaveBeenNthCalledWith(
                2,
                {
                    input: {
                        lon: way.coords[1][0],
                        lat: way.coords[1][1]
                    },
                    wayId
                }
            )
        })
    })

    describe('updateUnion', () => {
        let input
        let routeId
        let wayId

        beforeEach(() => {
            routeId = 10
            wayId = 100
        })

        it('Cuando el input no tiene union del wayId', async () => {
            input = {
                union: {
                    101: [[0.1, 0.2]]
                }
            }
            await routeService.updateUnion({
                input,
                routeId,
                wayId
            })
            expect(routeWayExecutionUnionSegmentModel.removeAllByRouteIdAndWayId).not.toHaveBeenCalled()
            expect(routeWayExecutionUnionSegmentModel.create).not.toHaveBeenCalled()
        })

        it('Cuando el input sí tiene union del wayId', async () => {
            input = {
                union: {
                    100: [[0.1, 0.2], [0.21, 0.23]]
                }
            }
            await routeService.updateUnion({
                input,
                routeId,
                wayId
            })
            expect(routeWayExecutionUnionSegmentModel.removeAllByRouteIdAndWayId)
                .toHaveBeenNthCalledWith(
                    1,
                    {
                        routeId,
                        wayId
                    }
                )
            expect(routeWayExecutionUnionSegmentModel.create)
                .toHaveBeenNthCalledWith(
                    1,
                    {
                        input: {
                            p1: input.union[100][0][0],
                            p2: input.union[100][0][1]
                        },
                        routeId,
                        wayId
                    }
                )
            expect(routeWayExecutionUnionSegmentModel.create)
                .toHaveBeenNthCalledWith(
                    2,
                    {
                        input: {
                            p1: input.union[100][1][0],
                            p2: input.union[100][1][1]
                        },
                        routeId,
                        wayId
                    }
                )
        })
    })

    describe('Update local order', () => {
        let input
        let routeId
        let wayId
        let localOrder
        beforeEach(() => {
            routeId = 10
            wayId = 100
        })

        it('Cuando el wayId no se encuentra en el orderedWayIds del input', async () => {
            localOrder = [90, wayId, 101]
            input = {
                orderedWayIds: [90, 91, 101, 103]
            }
        })

        it('Cuando el way aparece en el localOrder y conserva el mismo orden', async () => {
            localOrder = [90, wayId, 101]
            input = {
                orderedWayIds: [90, wayId, 101, 103]
            }
            await routeService.updateLocalOrder({
                input,
                routeId,
                wayId,
                localOrder
            })
            expect(routeWayModel.update).not.toHaveBeenCalled()
            expect(routeWayModel.create).not.toHaveBeenCalled()
        })

        it('Cuando el way aparece en el localOrder y tiene un orden distinto', async () => {
            localOrder = [90, wayId, 101]
            input = {
                orderedWayIds: [90, 91, wayId, 101, 103]
            }
            await routeService.updateLocalOrder({
                input,
                routeId,
                wayId,
                localOrder
            })
            expect(routeWayModel.update).toHaveBeenNthCalledWith(
                1,
                {
                    input: {
                        orderedPosition: 2
                    },
                    routeId,
                    wayId
                }
            )
            expect(routeWayModel.create).not.toHaveBeenCalled()
        })

        it('Cuando el way no aparece en el localOrder', async () => {
            localOrder = [90, 91, 101]
            input = {
                orderedWayIds: [90, 91, wayId, 101, 103]
            }
            await routeService.updateLocalOrder({
                input,
                routeId,
                wayId,
                localOrder
            })
            expect(routeWayModel.update).not.toHaveBeenCalled()
            expect(routeWayModel.create).toHaveBeenNthCalledWith(
                1,
                {
                    input: {
                        orderedPosition: 2
                    },
                    routeId,
                    wayId
                }
            )
        })
    })

    describe('updateByWay', () => {
        let input
        let routeId
        let wayId
        let way
        let localOrder

        beforeEach(() => {
            routeService.createWay = jest.fn()
            routeService.updateUnion = jest.fn()
            routeService.updateLocalOrder = jest.fn()
            input = {}
            routeId = 1
            wayId = 10
            way = {}
            localOrder = []
        })

        it('Cuando el way existe en la base de datos', async () => {
            wayModel.getById.mockResolvedValue(null)
            await routeService.updateByWay({
                input,
                routeId,
                wayId,
                way,
                localOrder
            })
            expect(routeService.createWay).toHaveBeenNthCalledWith(
                1,
                {
                    wayId,
                    way
                }
            )
            expect(routeService.updateUnion).toHaveBeenNthCalledWith(
                1,
                {
                    input,
                    routeId,
                    wayId
                }
            )
            expect(routeService.updateLocalOrder).toHaveBeenNthCalledWith(
                1,
                {
                    input,
                    routeId,
                    wayId,
                    localOrder
                }
            )
        })

        it('Cuando el way aún no existe en la base de datos', async () => {
            wayModel.getById.mockResolvedValue({})
            await routeService.updateByWay({
                input,
                routeId,
                wayId,
                way,
                localOrder
            })
            expect(routeService.createWay).not.toHaveBeenCalled()
            expect(routeService.updateUnion).toHaveBeenNthCalledWith(
                1,
                {
                    input,
                    routeId,
                    wayId
                }
            )
            expect(routeService.updateLocalOrder).toHaveBeenNthCalledWith(
                1,
                {
                    input,
                    routeId,
                    wayId,
                    localOrder
                }
            )
        })
    })

    describe('updateRoute', () => {
        let input
        let id

        beforeEach(() => {
            id = 1
            routeService.updateByWay = jest.fn()
        })

        it('Debe ejecutar los métodos requeridos por el route y por cada uno de los ways', async () => {
            input = {
                bbox: [1, 2, 3, 4],
                ways: {
                    1: {
                        name: 'w1',
                        highway: 'street',
                        maxSpeedKmh: 20,
                        coords: [
                            [0, 0],
                            [1, 2]
                        ]
                    },
                    2: {
                        name: 'w2',
                        highway: 'street',
                        maxSpeedKmh: 15,
                        coords: [[1, 1]]
                    }
                },
                union: {
                    1: [[0.01, 0.05], [0.075, 0.12]],
                    2: [[0.8, 0.92], [0.12, 0.13]]
                },
                orderedWayIds: [2,1]
            }
            const localOrder = [2, 1]
            routeWayModel.getAllByRouteId.mockResolvedValue(localOrder)
            await routeService.updateRoute({
                input,
                id
            })
            expect(routeModel.update).toHaveBeenNthCalledWith(
                1,
                {
                    input: {
                        minLon: input.bbox[0],
                        minLat: input.bbox[1],
                        maxLon: input.bbox[2],
                        maxLat: input.bbox[3]
                    },
                    id
                }
            )
            expect(routeService.updateByWay).toHaveBeenNthCalledWith(
                1,
                {
                    input,
                    routeId: id,
                    wayId: 1,
                    way: input.ways[1],
                    localOrder
                }
            )
            expect(routeService.updateByWay).toHaveBeenNthCalledWith(
                2,
                {
                    input,
                    routeId: id,
                    wayId: 2,
                    way: input.ways[2],
                    localOrder
                }
            )
        })
    })

    describe('formatDataForWay', () => {
        let routeId
        let routeWay
        let orderedWayIds
        let ways
        let union        
        it('Debe formatear los valores requeridos', async () => {
            routeId = 1
            routeWay = {
                wayId: 101,
                orderedPosition: 1
            }
            orderedWayIds = []
            ways = {}
            union = {}
            const way = {
                id: 101,
                name: 'way 1',
                highway: 'street',
                maxSpeedKmh: 20
            }
            wayModel.getById.mockResolvedValue(way)
            const wayCoords = [
                {lat: 10, lon: 10},
                {lat: 11, lon: 11}
            ]
            wayCoordModel.getAllByWayId.mockResolvedValue(wayCoords)
            const wayUnion = [
                {p1: 0.1, p2: 0.2},
                {p1: 0.21, p2: 0.23}
            ]
            routeWayExecutionUnionSegmentModel.getByRouteIdAndWayId.mockResolvedValueOnce(wayUnion)
            await routeService.formatDataForWay({
                routeId,
                routeWay,
                orderedWayIds,
                ways,
                union
            })
            expect(wayModel.getById).toHaveBeenNthCalledWith(
                1,
                {
                    id: 101
                }
            )
            expect(wayCoordModel.getAllByWayId).toHaveBeenNthCalledWith(
                1,
                {
                    wayId: 101
                }
            )
            expect(routeWayExecutionUnionSegmentModel.getByRouteIdAndWayId).toHaveBeenNthCalledWith(
                1,
                {
                    routeId,
                    wayId: 101
                }
            )
            expect(orderedWayIds).toStrictEqual([101])
            expect(ways).toStrictEqual({
                101: {
                    ...way,
                    coords: [
                        [wayCoords[0].lon, wayCoords[0].lat],
                        [wayCoords[1].lon, wayCoords[1].lat]
                    ]
                }
            })
            expect(union).toStrictEqual({
                101: [
                    [wayUnion[0].p1, wayUnion[0].p2],
                    [wayUnion[1].p1, wayUnion[1].p2]
                ]
            })

        })
    })

    describe('getRouteById', () => {
        it('Debe retornar el valor con los campos requeridos', async () => {
            routeService.formatDataForWay = jest.fn()
            const route = {
                id: 1,
                name: 'r1',
                description: 'this is the r1',
                minLat: 1,
                minLon: 2,
                maxLat: 3,
                maxLon: 4
            }
            routeModel.getById.mockResolvedValue(route)
            routeWayModel.getAllByRouteId.mockResolvedValue([
                {
                    wayId: 102,
                    orderedPosition: 1
                },
                {
                    wayId: 101,
                    orderedPosition: 0
                },
                {
                    wayId: 103,
                    orderedPosition: 2
                }
            ])
            const formattedWays = {
                101: {
                    id: 101,
                    name: 'way 1',
                    highway: 'street',
                    maxSpeedKmh: 20,
                    coords: [
                        [1, 1],
                        [0.5, 0.6]
                    ]
                },
                102: {
                    id: 102,
                    name: 'way 2',
                    highway: 'street',
                    maxSpeedKmh: 25,
                    coords: [
                        [0.4, 0.3]
                    ]
                },
                103: {
                    id: 103,
                    name: 'way 3',
                    highway: 'street',
                    maxSpeedKmh: 30,
                    coords: [
                        [0.1, 0.11],
                        [0.12, 0.14]
                    ]
                }
            }
            const formattedOrderedWayIds = [101, 102, 103]
            const formattedUnion = {
                101: [
                    [0.01, 0.03],
                    [0.04, 0.06]
                ],
                102: [
                    [0.02, 0.03],
                    [0.05, 0.06]
                ],
                103: [
                    [0.03, 0.04],
                    [0.05, 0.06]
                ]
            }
            jest.spyOn(routeService, 'formatDataForWay')
                .mockImplementationOnce(({ routeId, routeWay, orderedWayIds, ways, union }) => {
                    orderedWayIds.push(101)
                    ways[101] = formattedWays[101]
                    union[101] = formattedUnion[101]
                })
                .mockImplementationOnce(({ routeId, routeWay, orderedWayIds, ways, union }) => {
                    orderedWayIds.push(102)
                    ways[102] = formattedWays[102]
                    union[102] = formattedUnion[102]
                })
                .mockImplementationOnce(({ routeId, routeWay, orderedWayIds, ways, union }) => {
                    orderedWayIds.push(103)
                    ways[103] = formattedWays[103]
                    union[103] = formattedUnion[103]
                })
            const result = await routeService.getRouteById({id: 1})
            expect(result).toStrictEqual({
                ...route,
                bbox: [2, 1, 4, 3],
                ways: formattedWays,
                union: formattedUnion,
                orderedWayIds: formattedOrderedWayIds
            })
        })
    })
 })