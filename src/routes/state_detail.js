import { Router } from "express";

export function createStateDetailRouter({ stateController, cityController }){
    const stateDetailRouter = Router({mergeParams: true})
    stateDetailRouter.delete('/', stateController.delete)
    stateDetailRouter.get('/cities', cityController.getAllByStateId)
    stateDetailRouter.post('/cities', cityController.create)
    return stateDetailRouter
}