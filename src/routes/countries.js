import { Router } from 'express'

export function createCountriesRouter({countryController, stateController}){
    const countriesRouter = Router()
    countriesRouter.get('/', countryController.getAll)
    countriesRouter.post('/', countryController.create)
    countriesRouter.use('/:countryId', function (){
        const countryDetailRouter = Router({mergeParams: true})
        countryDetailRouter.delete('/', countryController.delete)
        countryDetailRouter.get('/states', stateController.getAllByCountryId)
        countryDetailRouter.post('/states', stateController.create)
        return countryDetailRouter
    }())
    return countriesRouter
}