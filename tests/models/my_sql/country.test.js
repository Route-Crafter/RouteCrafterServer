import { jest } from '@jest/globals'
import { CountryModel } from '../../../src/models/my_sql/country.js'


describe('Country Model Unit Tests', function(){
    let mockDB
    let countryModel
    
    beforeEach(() => {
        mockDB = {query: jest.fn()}
        countryModel = new CountryModel({ connection: mockDB })
    })

    it('Debería retornar todos los países', async function () {
        const countries = [
            {id: 1, name: 'Africa', iso: 'AFR'},
            {id: 2, name: 'Argentina', iso: 'AR'},
            {id: 3, name: 'México', iso: 'MEX'}
        ]
        //Simulamos la respuesta de la base de datos
        mockDB.query.mockResolvedValue([countries])
        const result = await countryModel.getAll()
        expect(mockDB.query).toHaveBeenCalledWith('SELECT * FROM countries')
        expect(result).toHaveLength(3)
        expect(result[0].iso).toBe('AFR')
    })

    it('Debe ejecutar los queries necesarias para crear el país y retornarlo cuando todo sale bien', async function () {
        const newCountry = {name: "CountryX", iso: "CX"}
        const returnerCountry = {
            ...newCountry,
            id: 10
        }
        mockDB.query
            .mockResolvedValueOnce([{}])
            .mockResolvedValueOnce([[returnerCountry]])
        const result = await countryModel.create({ input: newCountry })
        expect(mockDB.query).toHaveBeenNthCalledWith(
            1,
            expect.stringMatching(/INSERT INTO countries \(name, iso\)[\s\S]*VALUES \(\?, \?\)[\s\S]*/i),
            [newCountry.name, newCountry.iso]
        )
        expect(mockDB.query).toHaveBeenNthCalledWith(
            2,
            expect.stringMatching(/SELECT[\s\S]*id,[\s\S]*name,[\s\S]*iso[\s\S]*FROM countries[\s\S]*WHERE iso = \?[\s\S]*/i),
            [newCountry.iso]
        )
        expect(result).toBe(returnerCountry)
        
    })

    it('Debe retornar true cuando se elimina el país exitosamente', async function() {
        mockDB.query
            .mockResolvedValue([{affectedRows: 1}])
        const id = 1
        const result = await countryModel.delete({id})
        expect(mockDB.query).toHaveBeenCalledWith(
            expect.stringMatching(/DELETE FROM countries[\s\S]*WHERE id = \?[\s\S]*/i),
            [id]
        )
        expect(result).toBe(true)
    })

    //TODO: Esperar a que el método esté completo (eliminar estados y ciudades)
    it('Debe retornar false cuando no se elimina el país', async function() {
        mockDB.query
            .mockResolvedValue([{affectedRows: 0}])
        const id = 1
        const result = await countryModel.delete({id})
        expect(mockDB.query).toHaveBeenCalledWith(
            expect.stringMatching(/DELETE FROM countries[\s\S]*WHERE id = \?[\s\S]*/i),
            [id]
        )
        expect(result).toBe(false)
    })
    
})