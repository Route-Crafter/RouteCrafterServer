import express, { json } from 'express'
import { createCountriesRouter } from './routes/countries.js'
import { createStateDetailRouter } from './routes/state_detail.js'
import { createCityDetailRouter } from './routes/city_detail.js'
import { createRoutesRouter } from './routes/routes.js'
import { createRouteDetailRouter } from './routes/route_detail.js'
import { createExecutionDetailRouter } from './routes/execution_detail.js'
import { corsMiddleware } from './middlewares/cors.js'

export const createApp = ({
    countryController,
    stateController,
    cityController,
    routeController,
    routeExecutionController
}) => {
    const app = express()
    app.use(json())
    app.use(corsMiddleware())
    app.disable('x-powered-by')

    app.get('/', (req, res) => {
        res.json({message: 'Bienvenido a Routes'})
    })

    app.use('/countries', createCountriesRouter({countryController, stateController}))
    app.use('/states/:stateId', createStateDetailRouter({stateController, cityController}))
    app.use('/cities/:cityId', createCityDetailRouter({cityController, routeController}))
    app.use('/routes', createRoutesRouter({ routeController }))
    app.use('/routes/:routeId', createRouteDetailRouter({routeController, routeExecutionController}))
    app.use('/executions/:id', createExecutionDetailRouter({routeExecutionController}))

    const PORT = process.env.PORT ?? 1234
    app.listen(PORT, () => {
        console.log(`Server listening on ${(process.env.BASE_URL ?? 'localhost://')+PORT}`)
    })
}