import { beforeEach, describe, jest } from '@jest/globals'
import { RouteExecutionController } from '../../src/controllers/route_execution'

describe('RouteExecutionController', () => {
    let routeExecutionModelMock
    let validateInitRouteExecutionMock
    let validateEndRouteExecutionMock
    let routeExecutionPointModelMock
    let geoAggregationServiceMock
    let routeServiceMock
    let routeExecutionController

    beforeEach(() => {
        jest.clearAllMocks()
        routeExecutionModelMock = {
            getAllByRouteId: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            update: jest.fn()
        }
        validateInitRouteExecutionMock = jest.fn()
        validateEndRouteExecutionMock = jest.fn()
        routeExecutionPointModelMock = {
            getAllByRouteExecutionId: jest.fn(),
            createList: jest.fn()
        }
        geoAggregationServiceMock = {
            insertPointsInToRoute: jest.fn()
        }
        routeServiceMock = {
            getRouteById: jest.fn(),
            updateRoute: jest.fn()
        }
        routeExecutionController = new RouteExecutionController({
            routeExecutionModel: routeExecutionModelMock,
            validateInitRouteExecution: validateInitRouteExecutionMock,
            validateEndRouteExecution: validateEndRouteExecutionMock,
            routeExecutionPointModel: routeExecutionPointModelMock,
            routeService: routeServiceMock,
            geoAggregationService: geoAggregationServiceMock
        })
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        }
        req = {}
    })

    describe('get all by route id', () => {
        it('Cuando todo sale bien', async () => {
            const rawRouteExecutions = [
                {id: 1, license_plate: 'aaa111', init_time: '2025-02-01 20:25', las_time: null},
                {id: 2, license_plate: 'aaa112', init_time: '2025-02-05 20:25', las_time: '2025-02-05 20:30'}
            ]
            const executionsWayPoints = [
                [],
                [{lat: 20.5, lon: -1.22, vel: 10.1}, {lat: 20.6, lon: -1.2, vel: 11.1}]
            ]
            const returnedRouteExecutions = [
                {...rawRouteExecutions[0], points: executionsWayPoints[0]},
                {...rawRouteExecutions[1], points: executionsWayPoints[1]}
            ]
            const routeId = 'abc123'
            req.params = {routeId}
            routeExecutionModelMock.getAllByRouteId.mockResolvedValue(rawRouteExecutions)
            routeExecutionPointModelMock.getAllByRouteExecutionId
                .mockResolvedValueOnce(executionsWayPoints[0])
                .mockResolvedValueOnce(executionsWayPoints[1])
            await routeExecutionController.getAllByRouteId(req, res)
            expect(routeExecutionModelMock.getAllByRouteId)
                .toHaveBeenCalledWith({routeId})
            expect(routeExecutionPointModelMock.getAllByRouteExecutionId)
                .toHaveBeenNthCalledWith(
                    1,
                    {routeExecutionId: rawRouteExecutions[0].id}
                )
            expect(routeExecutionPointModelMock.getAllByRouteExecutionId)
                .toHaveBeenNthCalledWith(
                    2,
                    {routeExecutionId: rawRouteExecutions[1].id}
                )
            expect(res.json(returnedRouteExecutions))
        })
    })

    describe('updateRoute', () => {
        let routeId
        let points

        beforeEach(() => {
            routeId = 1
            points = [
                {lat: 1, lon: 1},
                {lat: 2, lon: 2},
                {lat: 3, lon: 3}
            ]
        })

        it('Debe llamar los métodos requeridos', async () => {
            const initialRoute = {
                name: 'r1',
                description: 'the r1',
                bbox: [1, 2, 3, 4],
                polylineCache: 'the cache',
                version: 1
            }
            routeServiceMock.getRouteById.mockResolvedValue(initialRoute)
            const updatedRoute = {
                ...initialRoute,
                version: 2,
                ways: { 1: {name: 'way1'}},
                union: { 1: [[1, 2], [3, 4]] }
            }
            jest.spyOn(geoAggregationServiceMock, 'insertPointsInToRoute')
                .mockImplementationOnce(({ points, route }) => {
                    route.ways = updatedRoute.ways
                    route.union = updatedRoute.union
                })
            await routeExecutionController.updateRoute({ routeId, points })
            expect(routeServiceMock.getRouteById).toHaveBeenNthCalledWith(
                1,
                {
                    id: routeId
                }
            )
            expect(geoAggregationServiceMock.insertPointsInToRoute).toHaveBeenNthCalledWith(
                1,
                {
                    points,
                    route: initialRoute
                }
            )
            expect(routeServiceMock.updateRoute).toHaveBeenNthCalledWith(
                1,
                {
                    input: expect.objectContaining({
                        name: updatedRoute.name,
                        description: updatedRoute.description,
                        bbox: updatedRoute.bbox,
                        polylineCache: null,
                        version: updatedRoute.version,
                        ways: updatedRoute.ways,
                        union: updatedRoute.union
                    }),
                    id: routeId
                }
            )

        })
    })

    describe('update', () => {

        let routeId

        beforeEach(() => {
            routeId = 101
        })

        it('Cuando la validación de la información sale mal', async () => {
            req.params = {
                id: 100
            }
            req.query = {
                routeId
            }
            req.body = {controller: []}
            const errorMessage = {
                reason: 'Hubo un mal problema'
            }
            validateEndRouteExecutionMock.mockReturnValue({
                error: {
                    message: JSON.stringify(errorMessage)
                }
            })
            await routeExecutionController.update(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                error: errorMessage
            })
        })

        it('Cuando la execution no se actualizó', async () => {
            const id = 100
            req.params = {
                id
            }
            req.query = {
                routeId
            }
            const updatedExecution = {endTime: '2025-05-01 12:25', wayPoints: []}
            req.body = updatedExecution
            validateEndRouteExecutionMock.mockReturnValue({
                data: updatedExecution
            })
            routeExecutionModelMock.update.mockResolvedValue(false)
            routeExecutionPointModelMock.createList.mockResolvedValue([{id: 1, name: '1'}])
            routeExecutionController.updateRoute = jest.fn()
            await routeExecutionController.update(req, res)
            expect(routeExecutionModelMock.update).toHaveBeenCalledWith({
                input: {endTime: updatedExecution.endTime},
                id
            })
            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                message: 'No se pudo actualizar el elemento'
            })
        })

        it('Cuando los points no se actualizaron', async () => {
            const id = 100
            req.params = {
                id
            }
            req.query = {
                routeId
            }
            const points = [{id: 1, lat: 100, lon: 200}]
            const updatedExecution = {endTime: '2025-05-01 12:25', points}
            req.body = updatedExecution
            validateEndRouteExecutionMock.mockReturnValue({
                data: updatedExecution
            })
            const returnedUpdatedExecution = {
                id: 1001,
                ...updatedExecution
            }
            
            routeExecutionModelMock.update.mockResolvedValue(returnedUpdatedExecution)
            routeExecutionPointModelMock.createList.mockResolvedValue(false)
            routeExecutionController.updateRoute = jest.fn()
            await routeExecutionController.update(req, res)
            expect(routeExecutionModelMock.update).toHaveBeenCalledWith({
                input: {endTime: updatedExecution.endTime},
                id
            })
            expect(routeExecutionPointModelMock.createList).toHaveBeenCalledWith({
                inputs: points,
                routeExecutionId: id
            })
            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                message: 'No se pudo actualizar el elemento'
            })
        })

        it('Cuando los points sí se actualizaron', async () => {
            routeExecutionController.updateRoute = jest.fn()
            const id = 100
            req.params = {
                id
            }
            req.query = {
                routeId
            }
            const points = [{id: 1, lat: 100, lon: 200}]
            const updatedExecution = {
                endTime: '2025-05-01 12:25',
                points,
                routeId: 1
            }
            req.body = updatedExecution
            validateEndRouteExecutionMock.mockReturnValue({
                data: updatedExecution
            })
            const returnedUpdatedExecution = {
                id: 1001,
                ...updatedExecution
            }
            routeExecutionModelMock.update.mockResolvedValue(returnedUpdatedExecution)
            routeExecutionPointModelMock.createList.mockResolvedValue(points)
            routeExecutionController.updateRoute = jest.fn()
            await routeExecutionController.update(req, res)
            expect(routeExecutionModelMock.update).toHaveBeenCalledWith({
                input: {endTime: updatedExecution.endTime},
                id
            })
            expect(routeExecutionPointModelMock.createList).toHaveBeenCalledWith({
                inputs: points,
                routeExecutionId: id
            })
            expect(routeExecutionController.updateRoute).toHaveBeenCalledWith({
                routeId,
                points
            })
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({
                ...returnedUpdatedExecution,
                points 
            })
        })
        
    })
})