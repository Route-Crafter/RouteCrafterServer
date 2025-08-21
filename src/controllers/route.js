export class RouteController{
    constructor({countryModel, stateModel, cityModel, routeModel, validateRoute}){
        this.countryModel = countryModel
        this.stateModel = stateModel
        this.cityModel = cityModel
        this.routeModel = routeModel
        this.validateRoute = validateRoute
    }

    getAll = async (req, res) => {
        const { countryIso, stateName, cityName } = req.query
        if(countryIso == undefined || stateName == undefined || cityName == undefined) {
            return res.status(404)
                .json({
                    message: `No hay información de rutas sobre esa localización geográfica`
                })
        }
        const country = await this.countryModel.getByIso({iso: countryIso})
        if(country == undefined){
            return res.status(404)
                .json({
                    message: `No se encontró un país con el código ISO ${countryIso}`
                })
        }
        const state = await this.stateModel.getByNameAndCountryId({ name: stateName, countryId: country.id})
        if(state == undefined){
            return res.status(404)
                .json({
                    message: `No se encontró un Estado con el nombre ${stateName}`
                })
        }
        const city = await this.cityModel.getByNameAndStateId({ name: cityName, stateId: state.id})
        if(city == undefined){
            return res.status(404)
                .json({
                        message: `No se encontró una ciudad con el nombre ${cityName}`
                })
        }
        const routes = await this.routeModel.getAllByCityId({ cityId: city.id })
        res.json(routes)
    }

    getAllByCityId = async (req, res) => {
        const { cityId } = req.params
        const routes = await this.routeModel.getAllByCityId({ cityId })
        res.json(routes) 
    }

    create = async (req, res) => {
        const { cityId } = req.params
        const result = this.validateRoute(req.body)
        if(result.error){
            res.status(400).json({
                error: JSON.parse(result.error.message)
            })
        }
        const newRoute = await this.routeModel.create({
            input: result.data,
            cityId
        })
        if(newRoute){
            res.status(201).json(newRoute)
        }else{
            res.status(500).json({
                error: 'No se pudo crear el elemento'
            })
        }
    }

    delete = async (req, res) => {
        const { routeId } = req.params
        const wasDeleted = await this.routeModel.delete({ id: routeId })
        if(!wasDeleted){
            return res.status(404).json({
                message: 'No se pudo borrar el elemento'
            })
        }
        res.json({
            message: 'Se ha borrado el elemento'
        })
    }
}