import {describe, jest} from '@jest/globals'
import { RouteExecutionPointModel } from '../../../src/models/my_sql/route_execution_point.js'

describe('WayPoint Model Unit Tests', function () {
    let mockDB
    let routeExecutionPointModel

    beforeEach(() => {
        mockDB = {query: jest.fn()}
        routeExecutionPointModel = new RouteExecutionPointModel({connection: mockDB})
    })

    it('getAllByRouteExecutionId; Debe ejecutar el query necesario y retornar la lista de points retornados por la db', async function() {
        const points = [
            {id: 1, lat: 20.0, lon: -1.2, speed: 20.5},
            {id: 2, lat: 12.0, lon: -11.2, speed: 20.5},
            {id: 3, lat: 31.0, lon: -13.2, speed: 20.5}
        ]
        const routeExecutionId = 100
        mockDB.query.mockResolvedValue([points])
        const result = await routeExecutionPointModel.getAllByRouteExecutionId({routeExecutionId})
        expect(mockDB.query).toHaveBeenCalledWith(
            expect.stringMatching(/SELECT \* FROM route_execution_points[\s\S]*WHERE route_execution_id = \?[\s\S]*/i),
            [routeExecutionId]
        )
        expect(result).toHaveLength(points.length)
        expect(result[0].id).toBe(points[0].id)
    })

    it('createList; Debe ejecutar los queries de creación y obtención del elemento creado, y retornarlo', async function() {
        const insertedPoints = [
            {lat: 20.0, lon: -1.2, speed: 20.5},
            {lat: 12.0, lon: -11.2, speed: 20.5},
            {lat: 31.0, lon: -13.2, speed: 20.5}
        ]
        const returnedPoints = [
            {...insertedPoints[0], id: 1},
            {...insertedPoints[1], id: 2},
            {...insertedPoints[2], id: 3}
        ]
        mockDB.query
            .mockResolvedValueOnce([{}])
            .mockResolvedValueOnce([{}])
            .mockResolvedValueOnce([{}])
            .mockResolvedValueOnce([returnedPoints])
        const routeExecutionId = 100
        const result = await routeExecutionPointModel.createList({inputs: insertedPoints, routeExecutionId})
        const query = /INSERT INTO route_execution_points \(lat, lon, speed, route_execution_id\)[\s\S]*VALUES \(\?, \?, \?, \?\)[\s\S]*/i
        expect(mockDB.query)
            .toHaveBeenNthCalledWith(
                1,
                expect.stringMatching(query),
                [insertedPoints[0].lat, insertedPoints[0].lon, insertedPoints[0].speed, routeExecutionId]
            )
        expect(mockDB.query)
            .toHaveBeenNthCalledWith(
                2,
                expect.stringMatching(query),
                [insertedPoints[1].lat, insertedPoints[1].lon, insertedPoints[1].speed, routeExecutionId]
            )
        expect(mockDB.query)
            .toHaveBeenNthCalledWith(
                3,
                expect.stringMatching(query),
                [insertedPoints[2].lat, insertedPoints[2].lon, insertedPoints[2].speed, routeExecutionId]
            )
        expect(mockDB.query)
            .toHaveBeenNthCalledWith(
                4,
                expect.stringMatching(/SELECT \* FROM route_execution_points[\s\S]*WHERE route_execution_id = \?[\s\S]*/i),
                [routeExecutionId]
            )

    })
})