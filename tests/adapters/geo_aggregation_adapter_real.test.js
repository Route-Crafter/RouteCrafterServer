import { beforeAll, beforeEach, describe, jest } from '@jest/globals'
import { GeoAggregationAdapter } from '../../src/adapters/geo_aggregation_adapter.js'
import { request } from 'undici';
import { lineString } from '@turf/helpers';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import distance from '@turf/distance';

import testWays from './fake_ways.json' with { type: 'json' };

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
        jest.setTimeout(30_000)
    })

    describe('ensureWaysForRoute', () => {
        let route
        let points

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
            console.log(`list length: ${result.list.length}`)
            console.log(JSON.stringify(result.list[0]))
            
            //console.log(printedValue)
            expect(result.bbox).not.toBe(undefined)
            expect(result.dict).not.toBe(undefined)
            expect(result.list).not.toBe(undefined)
            expect(result.list.length).toBeLessThan(30)
        })
    })

    describe('lineString', () => {
        let coords
        beforeEach(() => {
            coords = [
                [-74.0922769,4.6369101],
                [-74.0922331,4.6369523],
                [-74.0921173,4.6370797],
                [-74.0916482,4.6375751],
                [-74.0915866,4.6376367],
                [-74.0915099,4.637716],
                [-74.0914573,4.6377722],
                [-74.0914051,4.6378232],
                [-74.0911582,4.6381005],
                [-74.090653,4.6386358],
                [-74.0903385,4.6389505],
                [-74.0902347,4.6390363],
                [-74.0896753,4.6394082],
                [-74.0894964,4.6395252],
                [-74.0892019,4.6396991],
                [-74.0890789,4.6397735]
            ]
        })

        it('llamado real de la función', () => {
            const result = lineString(coords);
            console.log('************** Line String ****************')
            console.log(result.type)
            console.log(result.geometry.coordinates.length)
            console.log(JSON.stringify(result))
            expect(result.geometry.coordinates.length).toBe(coords.length)
        })
    })

    describe('nearestPointOnLine', () => {
        let point
        let lineString
        beforeAll(() => {
            point = {"lat": 4.635830, "lon": -74.092419, "speed": 10.0}
            lineString = {
                "type":"Feature",
                "properties":{},
                "geometry":{
                    "type":"LineString",
                    "coordinates":[
                        [-74.0922769,4.6369101],
                        [-74.0922331,4.6369523],
                        [-74.0921173,4.6370797],
                        [-74.0916482,4.6375751],
                        [-74.0915866,4.6376367],
                        [-74.0915099,4.637716],
                        [-74.0914573,4.6377722],
                        [-74.0914051,4.6378232],
                        [-74.0911582,4.6381005],
                        [-74.090653,4.6386358],
                        [-74.0903385,4.6389505],
                        [-74.0902347,4.6390363],
                        [-74.0896753,4.6394082],
                        [-74.0894964,4.6395252],
                        [-74.0892019,4.6396991],
                        [-74.0890789,4.6397735]
                    ]
                }
            }
        })

        it('Llamado real', () => {
            console.log('************************** Nearest Point On Line ****************************')
            const result = nearestPointOnLine(
                lineString,
                [point.lon, point.lat],
                { units: 'kilometers' }
            )
            console.log(JSON.stringify(result))
            expect(result.geometry.coordinates).not.toBe(undefined)
            expect(result.geometry.coordinates).not.toBe(null)
        })
    })

    describe('distance', () => {
        let point
        let nearestPoint

        beforeAll(() => {
            point = [-74.092419, 4.635830 ]
            nearestPoint = [-74.0922769,4.6369101]
        })

        it('Llamado real', () => {
            console.log('****************************** Distance ******************************')
            const result = distance(point, nearestPoint, { units: 'meters' })
            console.log(JSON.stringify(result))
        })
    })

    describe('annotate points', () => {
        let points
        let ways
        beforeAll(() => {
            points = [
                {"lat": 4.635830, "lon": -74.092419, "speed": 10.0},
                {"lat": 4.636092, "lon": -74.092621, "speed": 11.02},
                {"lat": 4.636245, "lon": -74.092747, "speed": 5.01},
                {"lat": 4.636135, "lon": -74.092965, "speed": 5.01},
                {"lat": 4.636001, "lon": -74.093134, "speed": 5.01},
                {"lat": 4.635838, "lon": -74.093047, "speed": 5.01},
                {"lat": 4.635614, "lon": -74.092898, "speed": 5.01}
            ]
            ways = testWays
        })

        it('llamado real', () => {
            const result = geoAggregationAdapter.annotatePoints(points, ways)
            console.log('****************************** Annotate Points ******************************')
            console.log(JSON.stringify(result))
            expect(result.isNotEmpty)
        })
    })
})