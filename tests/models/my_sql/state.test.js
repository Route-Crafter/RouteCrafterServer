import {beforeEach, jest} from '@jest/globals'
import { StateModel } from '../../../src/models/my_sql/state.js'

describe('State Model Unit Tests', function(){
    let mockDB
    let stateModel

    beforeEach(() => {
        mockDB = {query: jest.fn()}
        stateModel = new StateModel({connection: mockDB})
    })

    it('Debería retornar todos los estados dado el id del país', async function() {
        const states = [
            {id: 1, name: "state1"},
            {id: 2, name: 'state2'}
        ]
        const countryId = 1
        mockDB.query.mockResolvedValue([states])
        const result = await stateModel.getAllByCountryId({countryId})
        expect(mockDB.query).toHaveBeenCalledWith(
            expect.stringMatching(/SELECT id, name[\s\S]*FROM states[\s\S]*WHERE country_id = \?[\s\S]*/),
            [countryId]
        )
        expect(result).toHaveLength(states.length)
        expect(result[0].name).toBe(states[0].name)
    })

    it('Debería llamar el query de creación del elemento y retornar el elemento creado cuando todo sale bien', async function() {
        const newItem = {
            'name': 'state X'
        }
        const newItemId = 100
        const countryId = 1
        const returnedState = {
            ...newItem,
            id: newItemId,
            country_id: countryId
        }
        mockDB.query.
            mockResolvedValueOnce({})
            .mockResolvedValueOnce([[returnedState]])
        const result = await stateModel.create({input: newItem, countryId})
        expect(mockDB.query).toHaveBeenNthCalledWith(
            1,
            expect.stringMatching(/INSERT INTO states \(name, country_id\)[\s\S]*VALUES \(\?, \?\)[\s\S]*/i),
            [newItem.name, countryId]
        )
        expect(mockDB.query).toHaveBeenNthCalledWith(
            2,
            expect.stringMatching(/SELECT \* FROM states[\s\S]*WHERE name = \? AND country_id = \?[\s\S]*/i),
            [newItem.name, countryId]
        )
        expect(result).toBe(returnedState)
    })
    
    //TODO: Esperar a que el método esté completo (eliminar estados y ciudades)
    it('Debe ejecutar el query para eliminar el state y retornar true si todo sale bien', async function(){
        const id = 1
        mockDB.query.mockResolvedValue([{affectedRows: 1}])
        const result = await stateModel.delete({ id })
        expect(mockDB.query).toHaveBeenCalledWith(
            expect.stringMatching(/DELETE FROM states[\s\S]*WHERE id = \?/i),
            [id]
        )
        expect(result).toBe(true)
    })
})