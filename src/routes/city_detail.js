import { Router } from "express";

export function createCityDetailRouter({ cityController, routeController }){
    const cityDetailRouter = Router({mergeParams: true})
    cityDetailRouter.delete('/', cityController.delete)
    cityDetailRouter.get('/routes', routeController.getAllByCityId)
    cityDetailRouter.post('/routes', routeController.create)
    return cityDetailRouter
}