import { Router } from "express";

export function createRouteDetailRouter({ routeController, routeExecutionController }){
    const routeDetailRouter = Router({mergeParams: true})
    routeDetailRouter.delete('/', routeController.delete)
    routeDetailRouter.get('/executions', routeExecutionController.getAllByRouteId)
    routeDetailRouter.post('/executions', routeExecutionController.create)
    return routeDetailRouter
}