import {describe, jest} from '@jest/globals'
import { RouteModel } from '../../../src/models/my_sql/route.js'

describe('Route Model Unit Test', function () {
    let mockDB
    let routeModel

    beforeEach(() => {
        mockDB = {query: jest.fn()}
        routeModel = new RouteModel({connection: mockDB})
    })

    it('Debería ejecutar el query para recuperar las rutas dado el city_id y retornar las rutas obtenidas', async function () {
        const routes = [
            {id: 'pas2n23kj234', name: 'Route X', description: 'Route X Description'},
            {id: 'masl23k2n25n', name: 'Route Y', description: 'Route Y description'}
        ]
        const cityId = 100
        mockDB.query.mockResolvedValue([routes])
        const result = await routeModel.getAllByCityId({cityId})
        expect(mockDB.query).toHaveBeenCalledWith(
            expect.stringMatching(/SELECT[\s\S]*BIN_TO_UUID\(id\) as id,[\s\S]*name,[\s\S]*description[\s\S]*FROM routes[\s\S]*WHERE city_id = \?[\s\S]*/i),
            [cityId]
        )
        expect(result).toHaveLength(routes.length)
        expect(result[0].name).toBe(routes[0].name)
    })

    it('Debería ejecutar los queries para get por id y retornar el valor obtenido de la db', async function () {
        const routeId = 100
        const route = {id: routeId, name: 'New Route', description: 'New Route Description'}
        mockDB.query
            .mockResolvedValueOnce([[route]])
        const result = await routeModel.getById({id: routeId})
        expect(mockDB.query).toHaveBeenCalledWith(
            expect.stringMatching(/SELECT[\s\S]*BIN_TO_UUID\(id\) as id,[\s\S]*name,[\s\S]*description[\s\S]*city_id[\s\S]*FROM routes[\s\S]*WHERE BIN_TO_UUID\(id\) = \?[\s\S]*/i),
            [routeId]
        )
        expect(result).toBe(route)
    })

    it('Debería ejecutar los queries para crear el elemento y retornar el elemento obtenido de la db', async function () {
        const newRoute = {name: 'New Route', description: 'New Route Description'}
        const cityId = 100
        const newRouteId = 1000
        const createdRoute = {
            ...newRoute,
            id: newRouteId,
            city_id: cityId
        }
        mockDB.query
            .mockResolvedValueOnce([{}])
            .mockResolvedValueOnce([[createdRoute]])
        const result = await routeModel.create({input: newRoute, cityId})
        expect(mockDB.query).toHaveBeenNthCalledWith(
            1,
            expect.stringMatching(/INSERT INTO routes \(id, name, description, city_id\)[\s\S]*VALUES \(UUID_TO_BIN\([\s\S]*\), \?, \?, \?\)[\s\S]*/i),
            [newRoute.name, newRoute.description, cityId]
        )
        expect(mockDB.query).toHaveBeenNthCalledWith(
            2,
            expect.stringMatching(/SELECT[\s\S]*BIN_TO_UUID\(id\) as id,[\s\S]*name,[\s\S]*description[\s\S]*city_id[\s\S]*FROM routes[\s\S]*WHERE BIN_TO_UUID\([\s\S]*\) = [\s\S]*/i),
            [newRoute.name, cityId]
        )
        expect(result).toBe(createdRoute)
    })
})