import {beforeEach, jest} from '@jest/globals'
import { CityModel } from '../../../src/models/my_sql/city.js'

describe('City Model Unit Test', function(){
    let mockDB
    let cityModel

    beforeEach(() => {
        mockDB = {query: jest.fn()}
        cityModel = new CityModel({connection: mockDB})
    })

    it('Debería retornar todas las ciudades dado el id del estado', async function() {
        const cities = [
            {id: 1, name: 'The City X'},
            {id: 2, name: 'The City Y'}
        ]
        const stateId = 100
        mockDB.query.mockResolvedValue([cities])
        const result = await cityModel.getAllByStateId({stateId})
        expect(mockDB.query).toHaveBeenCalledWith(
            expect.stringMatching(/SELECT \* FROM cities[\s\S]*WHERE state_id = \?[\s\S]*/i),
            [stateId]
        )
        expect(result).toHaveLength(cities.length)
        expect(result[0].name).toBe(cities[0].name)
    })

    it('Debería llamar al query de creación y obtención del elemento y retornar el elemento creado cuando todo sale bien', async function () {
        const newItem = {
            'name': 'city X'
        }
        const newItemId = 100
        const stateId = 1
        const returnedCity = {
            ...newItem,
            id: newItemId,
            state_id: stateId
        }
        mockDB.query.
            mockResolvedValueOnce({})
            .mockResolvedValueOnce([[returnedCity]])
        const result = await cityModel.create({input: newItem, stateId: stateId})
        expect(mockDB.query).toHaveBeenNthCalledWith(
            1,
            expect.stringMatching(/INSERT INTO cities \(name, state_id\)[\s\S]*VALUES \(\?, \?\)[\s\S]*/i),
            [newItem.name, stateId]
        )
        expect(mockDB.query).toHaveBeenNthCalledWith(
            2,
            expect.stringMatching(/SELECT \* FROM cities[\s\S]*WHERE name = \? AND state_id = \?[\s\S]*/i),
            [newItem.name, stateId]
        )
        expect(result).toBe(returnedCity)
    })
})