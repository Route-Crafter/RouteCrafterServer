import { beforeEach, describe, jest } from '@jest/globals'
import { CountryController } from "../../src/controllers/country.js";

 describe('CountryController', () => {
    let countryModelMock
    let validateCountryMock
    let controller
    let req, res

    beforeEach(() => {
        jest.clearAllMocks()
        countryModelMock = {
            getAll: jest.fn(),
            create: jest.fn(),
            delete: jest.fn()
        }
        validateCountryMock = jest.fn()
        controller = new CountryController({
            countryModel: countryModelMock,
            validateCountry: validateCountryMock
        })
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        }
        req = {}
    })

    describe('getAll', () => {
        it('Debe pasar la lista de elementos obtenidos al res en formato json', async () => {
            const countries = [
                {id: 1, name: 'Colombia', iso: 'COL'},
                {id: 2, name: 'Argentina', iso: 'ARG'}
            ]
            countryModelMock.getAll.mockResolvedValue(countries)
            await controller.getAll(req, res)
            expect(countryModelMock.getAll)
                .toHaveBeenCalled()
            expect(res.json)
                .toHaveBeenCalledWith(countries)
        })
    })

    describe('create', () => {
        it('Cuando ocurre un error en el validador', async () => {
            const errorMessage = {
                field: 'invalid'
            }
            const error = {
                error: {
                    message: JSON.stringify(errorMessage)
                }
            }
            validateCountryMock
                .mockReturnValue(error)
            req.body = {iso_code: 'Farmacia'}
            await controller.create(req, res)
            expect(validateCountryMock).toHaveBeenCalledWith(req.body)
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                error: errorMessage
            })
        })

        it('Cuando todo sale bien', async () => {
            const inserted = {
                name: 'Colombia',
                iso: 'COL'
            }
            validateCountryMock
                .mockReturnValue({
                    data: inserted
                })
            const created = {
                ...inserted,
                id: 100
            }
            countryModelMock.create
                .mockResolvedValue(created)
            req.body = inserted
            await controller.create(req, res)
            expect(validateCountryMock).toHaveBeenCalledWith(req.body)
            expect(countryModelMock.create)
                .toHaveBeenCalledWith({
                    input: inserted
                })
            expect(res.status)
                .toHaveBeenCalledWith(201)
            expect(res.json)
                .toHaveBeenCalledWith(created)
            
        })
    })
 })