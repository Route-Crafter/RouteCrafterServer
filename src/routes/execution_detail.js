import { Router } from "express";

export function createExecutionDetailRouter({ routeExecutionController }){
    const executionDetailRouter = Router({mergeParams: true})
    executionDetailRouter.patch('/', routeExecutionController.update)
    executionDetailRouter.delete('/', routeExecutionController.delete)
    return executionDetailRouter
}