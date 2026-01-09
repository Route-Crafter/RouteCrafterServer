import mysql from 'mysql2/promise'
import { createApp } from './src/app.js'
import { CountryModel, StateModel, CityModel, RouteModel, RouteExecutionModel, RouteExecutionPointModel } from './src/models/my_sql/models_export.js'
import { validateCountry, validateState, validateCity, validateRoute, validateInitRouteExecution, validateEndRouteExecution } from './src/schemas/schemas_export.js'
import { CountryController, StateController, CityController, RouteController, RouteExecutionController } from './src/controllers/controllers_export.js'

const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    database: 'routecrafterdb',
    password: '',
    port: 3306
})
const countryModel = new CountryModel({connection})
const stateModel = new StateModel({connection})
const cityModel = new CityModel({connection})
const routeModel = new RouteModel({connection})
const routeExecutionModel = new RouteExecutionModel({connection})
const routeExecutionPointModel = new RouteExecutionPointModel({connection})

const countryController = new CountryController({ countryModel, validateCountry })
const stateController = new StateController({ stateModel, validateState })
const cityController = new CityController({ cityModel, validateCity })

const routeController = new RouteController({
    countryModel,
    stateModel,
    cityModel,
    routeModel,
    validateRoute
})
const routeExecutionController = new RouteExecutionController({
    routeExecutionModel,
    validateInitRouteExecution,
    validateEndRouteExecution,
    routeExecutionPointModel
})

createApp({
    countryController,
    stateController,
    cityController,
    routeController,
    routeExecutionController
})