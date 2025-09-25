import 'dotenv/config';
import mysql from 'mysql2/promise'
import { request } from 'undici';
import { lineString } from '@turf/helpers';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import distance from '@turf/distance';
import { createApp } from './src/app.js'
import { CountryModel, StateModel, CityModel, RouteModel, RouteExecutionModel, RouteExecutionPointModel, WayModel, WayCoordModel, RouteWayModel, RouteWayExecutionUnionSegmentModel } from './src/models/my_sql/models_export.js'
import { validateCountry, validateState, validateCity, validateRoute, validateInitRouteExecution, validateEndRouteExecution } from './src/schemas/schemas_export.js'
import { CountryController, StateController, CityController, RouteController, RouteExecutionController } from './src/controllers/controllers_export.js'
import { GeoAggregationAdapter } from './src/adapters/geo_aggregation_adapter.js'
import { GeoAggregationService } from './src/services/geo_aggregation.js'
import { RouteService } from './src/services/route.js'

console.log(`************************ sql connection: ${JSON.stringify(process.env)}`)

const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})
const countryModel = new CountryModel({connection})
const stateModel = new StateModel({connection})
const cityModel = new CityModel({connection})
const routeModel = new RouteModel({connection})
const routeExecutionModel = new RouteExecutionModel({connection})
const routeExecutionPointModel = new RouteExecutionPointModel({connection})
const wayModel = new WayModel({connection})
const wayCoordModel = new WayCoordModel({connection})
const routeWayModel = new RouteWayModel({connection})
const routeWayExecutionUnionSegmentModel = new RouteWayExecutionUnionSegmentModel({connection})

const countryController = new CountryController({ countryModel, validateCountry })
const stateController = new StateController({ stateModel, validateState })
const cityController = new CityController({ cityModel, validateCity })

const routeService = new RouteService({
    routeModel,
    wayModel,
    wayCoordModel,
    routeWayModel,
    routeWayExecutionUnionSegmentModel
})
const geoAggregationAdapter = new GeoAggregationAdapter({
    defaultOverpassUrl: 'https://overpass-api.de/api/interpreter',
    request,
    lineString,
    nearestPointOnLine,
    distance
})
const geoAggregationService = new GeoAggregationService({
    adapter: geoAggregationAdapter
})
const routeController = new RouteController({
    countryModel,
    stateModel,
    cityModel,
    routeModel,
    routeService,
    geoAggregationService,
    validateRoute
})
const routeExecutionController = new RouteExecutionController({
    routeExecutionModel,
    validateInitRouteExecution,
    validateEndRouteExecution,
    routeExecutionPointModel,
    routeService,
    geoAggregationService
})

createApp({
    countryController,
    stateController,
    cityController,
    routeController,
    routeExecutionController
})