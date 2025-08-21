import { beforeEach, describe, jest } from '@jest/globals'
import { StateController } from '../../src/controllers/state.js'

describe('StateController', () => {
    let stateModelMock
    let validateStateMock
    let controller
    let req, res
    beforeEach(() => {
        jest.clearAllMocks()
        stateModelMock = {
            getAllByCountryId: jest.fn(),
            create: jest.fn(),
            delete: jest.fn()
        }
        validateStateMock = jest.fn()
        controller = new StateController({
            stateModel: stateModelMock,
            validateState: validateStateMock
        })
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        }
        req = {}
    })

    describe('getAllByCountryId', () => {
        it('Debe pasar la lista de elementos obtenidos al res en formato json', async () => {
            const states = [
                {id: 1, name: 'Tolima'},
                {id: 2, name: 'Cundinamarca'}
            ]
            stateModelMock.getAllByCountryId.mockResolvedValue(states)
            const countryId = 10
            req.params = {countryId}
            await controller.getAllByCountryId(req, res)
            expect(stateModelMock.getAllByCountryId)
                .toHaveBeenCalledWith({countryId})
            expect(res.json)
                .toHaveBeenCalledWith(states)
        })
    })

    describe('create', () => {
        it('Cuando todo sale bien ', async () => {
            const inserted = {
                name: 'Amazonas'
            }
            const countryId = 1001
            validateStateMock.mockReturnValue({
                data: inserted
            })
            const created = {
                ...inserted,
                id: 100
            }
            stateModelMock.create
                .mockResolvedValue(created)
            req.body = inserted
            req.params = { countryId }
            await controller.create(req, res)
            expect(validateStateMock).toHaveBeenCalledWith(req.body)
            expect(stateModelMock.create)
                .toHaveBeenCalledWith({
                    input: inserted,
                    countryId
                })
            expect(res.status)
                .toHaveBeenCalledWith(201)
            expect(res.json)
                .toHaveBeenCalledWith(created)
        })
    })

    
})