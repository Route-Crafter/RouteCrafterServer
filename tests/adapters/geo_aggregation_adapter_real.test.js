import { beforeAll, beforeEach, describe, jest } from '@jest/globals'
import { GeoAggregationAdapter } from '../../src/adapters/geo_aggregation_adapter.js'
import { request } from 'undici';
import { lineString } from '@turf/helpers';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import distance from '@turf/distance';

describe('GeoAggregationAdapter real impl', () => {
    let geoAggregationAdapter
    beforeEach(() => {
        geoAggregationAdapter = new GeoAggregationAdapter({
            defaultOverpassUrl: 'https://overpass-api.de/api/interpreter',
            request,
            lineString,
            nearestPointOnLine,
            distance
        })
    })

    describe('ensureWaysForRoute', () => {
        let route
        let points

        beforeAll(() => {
            jest.setTimeout(30_000)
        })

        beforeEach(() => {
            points = [
                {"lat": 4.635830, "lon": -74.092419, "speed": 10.0},
                {"lat": 4.636092, "lon": -74.092621, "speed": 11.02},
                {"lat": 4.636245, "lon": -74.092747, "speed": 5.01},
                {"lat": 4.636135, "lon": -74.092965, "speed": 5.01},
                {"lat": 4.636001, "lon": -74.093134, "speed": 5.01},
                {"lat": 4.635838, "lon": -74.093047, "speed": 5.01},
                {"lat": 4.635614, "lon": -74.092898, "speed": 5.01}
            ]
        })

        it('Cuando el route ya tiene bbox; debe llamar y retornar lo requerido', async () => {
            route = {
                name: 'Route1',
                description: 'Route 1 description'
            }
            console.log('*********************** Ensure Ways For Route *************************')
            const init = new Date()
            const result = await geoAggregationAdapter.ensureWaysForRoute(route, points)
            const end = new Date()
            console.log(`-------------------> time: ${end - init}`)
            console.log(JSON.stringify(result.bbox))
            console.log('++++++++++ ways')
            let printedValue = ``
            for(let w of result.list){
                printedValue += `${w.name} - ${w.coords.length}\n`
            }
            console.log(`list length: ${result.list.length}`)
            console.log('++++++++++ ways dict')
            printedValue = ``
            for(let [wayId, way] of Object.entries(result.dict)) {
                printedValue += `${wayId} - ${way.name} - ${way.highway} - ${way.maxSpeedKmh}\n`
            }
            //console.log(printedValue)
            expect(result.bbox).not.toBe(undefined)
            expect(result.dict).not.toBe(undefined)
            expect(result.list).not.toBe(undefined)
        })
    })
})