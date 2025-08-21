export class RouteExecutionController{
    constructor({
        routeExecutionModel,
        validateInitRouteExecution,
        validateEndRouteExecution,
        routeExecutionPointModel,
        routeService,
        geoAggregationService
    }){
        this.routeExecutionModel = routeExecutionModel
        this.validateInitRouteExecution = validateInitRouteExecution
        this.validateEndRouteExecution = validateEndRouteExecution
        this.routeExecutionPointModel = routeExecutionPointModel,
        this.routeService = routeService
        this.geoAggregationService = geoAggregationService
    }

    getAllByRouteId = async (req, res) => {
        const { routeId } = req.params
        const executions = await this.routeExecutionModel.getAllByRouteId({ routeId })
        for(let i in executions){
            const execution = executions[i]
            const points = await this.routeExecutionPointModel.getAllByRouteExecutionId({ routeExecutionId: execution.id })
            execution.points = points
        }
        res.json(executions)
    }

    create = async (req, res) => {
        const { routeId } = req.params
        const result = this.validateInitRouteExecution(req.body)
        if(result.error){
            return res.status(400).json({
                error: result.error
            })
        }
        const createdRouteExecution = await this.routeExecutionModel.create({
            input: result.data,
            routeId
        })
        if(createdRouteExecution){
            res.status(201).json(createdRouteExecution)
        }else{
            res.status(500).json({
                message: 'No se pudo crear el elemento'
            })
        }
    }
    
    delete = async (req, res) => {
        const { id } = req.params
        const wasDeleted = await this.routeExecutionModel.delete({ id })
        if(!wasDeleted){
            return res.status(404).json({
                message: 'No se pudo eliminar el elemento'
            })
        }
        res.json({
            message: 'Se ha eliminado el elemento'
        })
    }

    update = async (req, res) => {
        const { id } = req.params
        const { routeId } = req.body
        const result = this.validateEndRouteExecution(req.body)
        if(result.error){
            return res.status(400).json({
                error: JSON.parse(result.error.message)
            })
        }
        const { points, endTime } = result.data
        const updatedExecution = await this.routeExecutionModel.update({
            input: { endTime },
            id
        })
        const createdPoints = await this.routeExecutionPointModel.createList({
            inputs: points,
            routeExecutionId: id
        })
        if(!updatedExecution || !createdPoints){
            return res.status(500).json({
                message: 'No se pudo actualizar el elemento'
            })
        }
        await this.updateRoute({ routeId, points })        
        return res.status(201).json({
            ...updatedExecution,
            points: createdPoints
        })
    }

    updateRoute = async ({ routeId, points }) => {
        const route = await this.routeService.getRouteById({ id: routeId })
        await this.geoAggregationService.insertPointsInToRoute({ points, route })
        // Invalidar cache y guardar
        route.polylineCache = null;
        route.version = (route.version || 0) + 1;
        route.updatedAt = new Date().toISOString();
        await this.routeService.updateRoute({
            input: route,
            id: routeId
        })
    }
}