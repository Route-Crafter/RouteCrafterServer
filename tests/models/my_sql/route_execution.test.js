import {describe, jest} from '@jest/globals'
import { RouteExecutionModel } from '../../../src/models/my_sql/route_execution.js'

describe('RouteExecution Model Unit Test', function () {
    let mockDB
    let routeExecutionModel

    beforeEach(() => {
        mockDB = {query: jest.fn()}
        routeExecutionModel = new RouteExecutionModel({connection: mockDB})
    })

    it('Debería ejecutar el query para obtener las ejecuciones dado el route_id y retornar las ejecuciones obtenidas', async function () {
        const executions = [
            {id: 1, license_plate: 'AXD', init_time: '2025-03-25 10:20'},
            {id: 2, license_plate: 'SDV', init_time: '2025-04-29 11:21'}
        ]
        const routeId = 100
        mockDB.query.mockResolvedValue([executions])
        const result = await routeExecutionModel.getAllByRouteId({routeId})
        expect(mockDB.query).toHaveBeenCalledWith(
            expect.stringMatching(/SELECT[\s\S]*id,[\s\S]*license_plate as licensePlate,[\s\S]*init_time as initTime,[\s\S]*end_time as endTime[\s\S]*FROM route_executions[\s\S]*WHERE route_id = UUID_TO_BIN\(\?\)[\s\S]*/i),
            [routeId]
        )
        expect(result).toHaveLength(executions.length)
        expect(result[0].license_plate).toBe(executions[0].license_plate)
    })

    it('Debería ejecutar los queries correspondientes a la creación del elemento y retornar el elemento obtenido en el segundo query', async function () {
        const newExecution = {licensePlate: 'SCX', initTime: '2024-03-01 22:10'}
        const routeId = 'parangaricutirimicuaro234'
        const newExecutionId = 1
        const createdExecution = {
            ...newExecution,
            id: newExecutionId,
            route_id: routeId
        }
        mockDB.beginTransaction = jest.fn()
        mockDB.commit = jest.fn()
        mockDB.rollback = jest.fn()
        mockDB.query
            .mockResolvedValueOnce([{}])
            .mockResolvedValueOnce([[createdExecution]])
        const result = await routeExecutionModel.create({input: newExecution, routeId})
        expect(mockDB.query).toHaveBeenNthCalledWith(
            1,
            expect.stringMatching(/INSERT INTO route_executions \(license_plate, init_time, route_id\)[\s\S]*VALUES \(\?, \?, UUID_TO_BIN\(\?\)\)[\s\S]*/i),
            [newExecution.licensePlate, newExecution.initTime, routeId]
        )
        expect(mockDB.query).toHaveBeenNthCalledWith(
            2,
            expect.stringMatching(/SELECT[\s\S]*id,[\s\S]*license_plate as licensePlate,[\s\S]*init_time as initTime,[\s\S]*BIN_TO_UUID\(route_id\) as routeId[\s\S]*FROM route_executions[\s\S]*WHERE id = \(SELECT LAST_INSERT_ID\(\)\)[\s\S]*/i)
        )
        expect(result).toBe(createdExecution)
    })

    it('Debería ejecutar los queries correspondientes a la creación del elemento, ejecutar rollback y retornar false cuando las cosas salen mal', async function () {
        const newExecution = {licensePlate: 'SCX', initTime: '2024-03-01 22:10'}
        const routeId = 'parangaricutirimicuaro234'
        const newExecutionId = 1
        mockDB.beginTransaction = jest.fn()
        mockDB.commit = jest.fn()
        mockDB.rollback = jest.fn()
        mockDB.query
            .mockResolvedValueOnce([{}])
            .mockResolvedValueOnce([{}])
        const result = await routeExecutionModel.create({input: newExecution, routeId})
        expect(mockDB.query).toHaveBeenNthCalledWith(
            1,
            expect.stringMatching(/INSERT INTO route_executions \(license_plate, init_time, route_id\)[\s\S]*VALUES \(\?, \?, UUID_TO_BIN\(\?\)\)[\s\S]*/i),
            [newExecution.licensePlate, newExecution.initTime, routeId]
        )
        expect(mockDB.query).toHaveBeenNthCalledWith(
            2,
            expect.stringMatching(/SELECT[\s\S]*id,[\s\S]*license_plate as licensePlate,[\s\S]*init_time as initTime,[\s\S]*BIN_TO_UUID\(route_id\) as routeId[\s\S]*FROM route_executions[\s\S]*WHERE id = \(SELECT LAST_INSERT_ID\(\)\)[\s\S]*/i)
        )
        
        expect(result).toBe(false)
    })
})