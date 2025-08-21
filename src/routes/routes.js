import { Router } from "express";

export function createRoutesRouter({ routeController }){
    const routesRouter = Router()
    routesRouter.get('/', routeController.getAll)
    return routesRouter
}