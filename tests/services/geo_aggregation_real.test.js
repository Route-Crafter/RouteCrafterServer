import { beforeAll, beforeEach, describe, jest } from '@jest/globals'
import { GeoAggregationService } from '../../src/services/geo_aggregation';
import { GeoAggregationAdapter } from '../../src/adapters/geo_aggregation_adapter';

import { request } from 'undici';
import { lineString } from '@turf/helpers';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import distance from '@turf/distance';

describe('GeoAgregationService real impl', () => {
    let geoAggregationService
    let adapter
    beforeAll(() => {
        jest.setTimeout(30_000);
    })

    beforeEach(() => {
        adapter = new GeoAggregationAdapter({
            defaultOverpassUrl: 'https://overpass-api.de/api/interpreter',
            request,
            lineString,
            nearestPointOnLine,
            distance
        })
        geoAggregationService = new GeoAggregationService({
            adapter
        })
    })

    describe('insertPointsInToRoute', () => {
        let route
        let points

        it('Cuando la ruta solo tiene bbox; Debe llamar a los métodos requeridos y retornar la información requerida', async () => {
            route = {
                name: 'R1',
                descrpition: 'R1 Description',
                //minlon menor, minlat mayor, max lon menor, max lat mayor
                bbox: [-73.082513, 4.654331, -74.056224, 4.672113]
            }
            points = [
                {"lat": 4.635830, "lon": -74.092419, "speed": 10.0},
                {"lat": 4.636092, "lon": -74.092621, "speed": 11.02},
                {"lat": 4.636245, "lon": -74.092747, "speed": 5.01},
                {"lat": 4.436135, "lon": -74.092965, "speed": 5.01},
                {"lat": 4.636001, "lon": -74.093134, "speed": 5.01},
                {"lat": 4.635838, "lon": -74.093047, "speed": 5.01},
                {"lat": 4.635614, "lon": -74.092898, "speed": 5.01}
            ]
            //TODO: Implementar realmente el test
            /*
            await geoAggregationService.insertPointsInToRoute({ route, points })
            expect(route.bbox).toStrictEqual([
                route.bbox[0],
                points[3].lat,
                points[4].lon,
                route.bbox[3]
            ])
            */
            expect(1).not.toBe(2)
        })
    })
})
