import { beforeEach, describe, jest } from '@jest/globals'
import { GeoAggregationAdapter } from '../../src/adapters/geo_aggregation_adapter.js'

describe('GeoLocalizationUtil', () => {
    const overpassUrl = 'https://overpass-api.de/api/interpreter'
    let geoAggregationAdapter
    let mockRequest
    let mockLineString
    let mockNearestPointOnLine
    let mockDistance

    beforeEach(() => {
        mockRequest = jest.fn()
        mockLineString = jest.fn()
        mockNearestPointOnLine = jest.fn()
        mockDistance = jest.fn()
        geoAggregationAdapter = new GeoAggregationAdapter({
            defaultOverpassUrl: overpassUrl,
            request: mockRequest,
            lineString: mockLineString,
            nearestPointOnLine: mockNearestPointOnLine,
            distance: mockDistance
        })
    })

    describe('ComputeBBox', () => {
        it('Cuando todo sale bien - caso normal', () => {
            const points = [
                {lon: -3, lat: 0},
                {lon: -2, lat: -1},
                {lon: -2, lat: -2},
                {lon: -1, lat: -1},
                {lon: -1, lat: 0},
                {lon: 0, lat: 2},
                {lon: 1, lat: 2},
                {lon: 2, lat: 1}
            ]
            const bufferMetters = 55500
            const bbox = geoAggregationAdapter.computeBBox(points, bufferMetters)
            expect(bbox[0]).toBe(-3.5)
            expect(bbox[1]).toBe(-2.5)
            expect(bbox[2]).toBe(2.5)
            expect(bbox[3]).toBe(2.5)
        })

        it('Cuando todo sale bien - centerLat cercano a 90', () => {
            const points = [
                {lon: -3, lat: 179.9998},
                {lon: -2, lat: 2.1},
                {lon: -2, lat: 3.2},
                {lon: -1, lat: 1.5},
                {lon: -1, lat: 0},
                {lon: 0, lat: 2},
                {lon: 1, lat: 2},
                {lon: 2, lat: 1}
            ]
            const bufferMetters = 55500
            const bbox = geoAggregationAdapter.computeBBox(points, bufferMetters)
            expect(bbox[0]).toBe(-55503)
            expect(bbox[1]).toBe(-0.5)
            expect(bbox[2]).toBe(55502)
            expect(bbox[3]).toBe(179.9998 + 0.5)
        })
    })

    describe('fetchOverpassWays', () => {
        it('Cuando todo sale bien', async () => {
            const resBody = {
                "elements": [
                    {
                        "type": "way",
                        "id": 123456789,
                        "nodes": [ 111111, 222222, 333333 ],
                        "tags": {
                            "highway": "residential",
                            "name": "Calle 45",
                            "maxspeed": "30"
                        },
                        "geometry": [
                            { "lat": 4.6523, "lon": -74.0581 },
                            { "lat": 4.6525, "lon": -74.0585 },
                            { "lat": 4.6528, "lon": -74.0590 }
                        ]
                    },
                    {
                        "type": "way",
                        "id": 123456791,
                        "nodes": [ 111112, 222223, 333334 ],
                        "tags": {
                            "highway": "residential",
                            "name": "Carrera 13",
                            "maxspeed": "50"
                        },
                        "geometry": [
                            { "lat": 4.6524, "lon": -74.0581 },
                            { "lat": 4.6528, "lon": -74.0586 },
                            { "lat": 4.6527, "lon": -74.0591 }
                        ]
                    },
                    {
                        "type": "node",
                        "id": 111111,
                        "lat": 4.6523,
                        "lon": -74.0581
                    }
                ]
            }
            const expectedResult = [
                {
                    id: 123456789,
                    name: 'Calle 45',
                    maxspeed: '30',
                    highway: 'residential',
                    tags: {
                        "highway": "residential",
                        "name": "Calle 45",
                        "maxspeed": "30"
                    },
                    coords: [
                        [-74.0581, 4.6523],
                        [-74.0585, 4.6525],
                        [-74.0590, 4.6528]
                    ]
                },
                {
                    id: 123456791,
                    name: 'Carrera 13',
                    maxspeed: '50',
                    highway: 'residential',
                    tags: {
                        "highway": "residential",
                        "name": "Carrera 13",
                        "maxspeed": "50"
                    },
                    coords: [
                        [-74.0581, 4.6524],
                        [-74.0586, 4.6528],
                        [-74.0591, 4.6527]
                    ]
                }
            ]
            const bbox = [1, 2, 3, 4]
            const overpassUrl = 'overpass_url'
            const mockJson = jest.fn()
            mockRequest.mockResolvedValue({
                body: {
                    json: mockJson
                }
            })
            mockJson.mockResolvedValue(resBody)
            const result = await geoAggregationAdapter.fetchOverpassWays(bbox, overpassUrl)
            expect(mockRequest).toHaveBeenCalledWith(
                overpassUrl,
                {
                    method: 'POST',
                    body: any,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }
            )
            expect(mockJson).toHaveBeenCalled()
            expect(result).toStrictEqual(expectedResult)
        })
    })

    describe('ensureWaysForRoute', () => {
        let route
        let points
        beforeEach(() => {
            geoAggregationAdapter.computeBBox = jest.fn()
            geoAggregationAdapter.fetchOverpassWays = jest.fn()
        })

        it('Cuando la ruta no tiene bbox', async () => {
            route = {}
            points = [
                {lon: -3, lat: 0},
                {lon: -2, lat: -1},
                {lon: -2, lat: -2},
                {lon: -1, lat: -1},
                {lon: -1, lat: 0},
                {lon: 0, lat: 2},
                {lon: 1, lat: 2},
                {lon: 2, lat: 1}
            ]
            const computedBBox = [10, 11, 12, 13]
            const overpassWays = [
                {
                    id: 123456789,
                    name: 'Calle 45',
                    maxspeed: '30',
                    highway: 'residential',
                    tags: {
                        "highway": "residential",
                        "name": "Calle 45",
                        "maxspeed": "30"
                    },
                    coords: [
                        [-74.0581, 4.6523],
                        [-74.0585, 4.6525],
                        [-74.0590, 4.6528]
                    ]
                },
                {
                    id: 123456791,
                    name: 'Carrera 13',
                    maxspeed: '50',
                    highway: 'residential',
                    tags: {
                        "highway": "residential",
                        "name": "Carrera 13",
                        "maxspeed": "50"
                    },
                    coords: [
                        [-74.0581, 4.6524],
                        [-74.0586, 4.6528],
                        [-74.0591, 4.6527]
                    ]
                }
            ]
            const expectedResult = {
                list: overpassWays,
                dict: {
                    123456789: {
                        coords: overpassWays[0].coords,
                        name: overpassWays[0].name,
                        highway: overpassWays[0].highway,
                        maxSpeedKmh: 30
                    },
                    123456791: {
                        coords: overpassWays[1].coords,
                        name: overpassWays[1].name,
                        highway: overpassWays[1].highway,
                        maxSpeedKmh: 50
                    }
                },
                bbox: computedBBox
            }
            geoAggregationAdapter.computeBBox.mockReturnValue(computedBBox)
            geoAggregationAdapter.fetchOverpassWays.mockResolvedValue(overpassWays)
            const result = await geoAggregationAdapter.ensureWaysForRoute(route, points)
            expect(geoAggregationAdapter.computeBBox).toHaveBeenCalledWith(
                points,
                180
            )
            expect(geoAggregationAdapter.fetchOverpassWays).toHaveBeenCalledWith(
                computedBBox,
                overpassUrl
            )
            expect(result).toStrictEqual(expectedResult)
        })
    })

    describe('annotatePoints', () => {
        let points
        let ways
        beforeEach(() => {
            points = [
                {lat: 1.01, lon: -1.01, speed_mps: 5},
                {lat: 1.02, lon: -1.02, speed_mps: 10},
                {lat: 1.03, lon: -1.03, speed_mps: 20}
            ]
            ways = [
                {
                    id: 123456789,
                    name: 'Calle 45',
                    maxspeed: '30',
                    maxSpeedKmh: 30,
                    highway: 'residential',
                    tags: {
                        "highway": "residential",
                        "name": "Calle 45",
                        "maxspeed": "30"
                    },
                    coords: [
                        [-74.0581, 4.6523],
                        [-74.0585, 4.6525],
                        [-74.0590, 4.6528]
                    ]
                },
                {
                    id: 123456791,
                    name: 'Carrera 13',
                    maxspeed: '50',
                    maxSpeedKmh: 50,
                    highway: 'residential',
                    tags: {
                        "highway": "residential",
                        "name": "Carrera 13",
                        "maxspeed": "50"
                    },
                    coords: [
                        [-74.0581, 4.6524],
                        [-74.0586, 4.6528],
                        [-74.0591, 4.6527]
                    ]
                }
            ]
            geoAggregationAdapter.snapPointToWaysWithS = jest.fn()
        })

        it('Cuando todo sale bien; no se inyecta snapMaxDistMeters', () => {
            geoAggregationAdapter.snapPointToWaysWithS.mockReturnValueOnce(null)
            geoAggregationAdapter.snapPointToWaysWithS.mockReturnValueOnce({
                way: ways[0],
                snapped: {
                    lon: 1,
                    lat: 2
                },
                distMeters: 51,
                s: 100
            })
            geoAggregationAdapter.snapPointToWaysWithS.mockReturnValueOnce({
                way: ways[0],
                snapped: {
                    lon: 2,
                    lat: 3
                },
                distMeters: 50,
                s: 55
            })
            const result = geoAggregationAdapter.annotatePoints(points, ways)
            expect(geoAggregationAdapter.snapPointToWaysWithS).toHaveBeenNthCalledWith(
                1,
                points[0],
                ways
            )
            expect(geoAggregationAdapter.snapPointToWaysWithS).toHaveBeenNthCalledWith(
                2,
                points[1],
                ways
            )
            expect(geoAggregationAdapter.snapPointToWaysWithS).toHaveBeenNthCalledWith(
                3,
                points[2],
                ways
            )
            expect(result).toStrictEqual([
                {
                    ...points[0],
                    snappedLon: null,
                    snappedLat: null,
                    street: null,
                    wayId: null,
                    highway: null,
                    maxSpeedKmh: null,
                    speed_kmh: 5 * 3.6,
                    s: null,
                    wayCoords: null,
                    note: 'no_way_found'
                },
                {
                    ...points[1],
                    snappedLon: null,
                    snappedLat: null,
                    street: null,
                    wayId: null,
                    highway: null,
                    maxSpeedKmh: null,
                    speed_kmh: 10 * 3.6,
                    s: null,
                    wayCoords: null,
                    note: 'far_from_road'
                },
                {
                    ...points[2],
                    snappedLon: 2,
                    snappedLat: 3,
                    street: ways[0].name,
                    wayId: ways[0].id,
                    highway: ways[0].highway,
                    maxSpeedKmh: 30,
                    speed_kmh: 20 * 3.6,
                    s: 55,
                    wayCoords: ways[0].coords,
                    note: null
                }
            ])
        })

        it('Cuando todo sale bien; sí se inyecta snapMaxDistMeters', () => {
            geoAggregationAdapter.snapPointToWaysWithS.mockReturnValueOnce(null)
            geoAggregationAdapter.snapPointToWaysWithS.mockReturnValueOnce({
                way: ways[0],
                snapped: {
                    lon: 1,
                    lat: 2
                },
                distMeters: 36,
                s: 100
            })
            geoAggregationAdapter.snapPointToWaysWithS.mockReturnValueOnce({
                way: ways[0],
                snapped: {
                    lon: 2,
                    lat: 3
                },
                distMeters: 35,
                s: 55
            })
            const result = geoAggregationAdapter.annotatePoints(points, ways, 35)
            expect(geoAggregationAdapter.snapPointToWaysWithS).toHaveBeenNthCalledWith(
                1,
                points[0],
                ways
            )
            expect(geoAggregationAdapter.snapPointToWaysWithS).toHaveBeenNthCalledWith(
                2,
                points[1],
                ways
            )
            expect(geoAggregationAdapter.snapPointToWaysWithS).toHaveBeenNthCalledWith(
                3,
                points[2],
                ways
            )
            expect(result).toStrictEqual([
                {
                    ...points[0],
                    snappedLon: null,
                    snappedLat: null,
                    street: null,
                    wayId: null,
                    highway: null,
                    maxSpeedKmh: null,
                    speed_kmh: 5 * 3.6,
                    s: null,
                    wayCoords: null,
                    note: 'no_way_found'
                },
                {
                    ...points[1],
                    snappedLon: null,
                    snappedLat: null,
                    street: null,
                    wayId: null,
                    highway: null,
                    maxSpeedKmh: null,
                    speed_kmh: 10 * 3.6,
                    s: null,
                    wayCoords: null,
                    note: 'far_from_road'
                },
                {
                    ...points[2],
                    snappedLon: 2,
                    snappedLat: 3,
                    street: ways[0].name,
                    wayId: ways[0].id,
                    highway: ways[0].highway,
                    maxSpeedKmh: 30,
                    speed_kmh: 20 * 3.6,
                    s: 55,
                    wayCoords: ways[0].coords,
                    note: null
                }
            ])
        })
    })


    describe('snapPointToWaysWithS',  () => {
        let point
        let ways

        beforeEach(() => {
            point = {lat: 1.01, lon: -1.01}
            ways = [
                {
                    id: 123456789,
                    name: 'Calle 45',
                    maxspeed: '30',
                    highway: 'residential',
                    tags: {
                        "highway": "residential",
                        "name": "Calle 45",
                        "maxspeed": "30"
                    },
                    coords: [
                        [-74.0581, 4.6523],
                        [-74.0585, 4.6525],
                        [-74.0590, 4.6528]
                    ]
                },
                {
                    id: 123456791,
                    name: 'Carrera 13',
                    maxspeed: '50',
                    highway: 'residential',
                    tags: {
                        "highway": "residential",
                        "name": "Carrera 13",
                        "maxspeed": "50"
                    },
                    coords: [
                        [-74.0581, 4.6524],
                        [-74.0586, 4.6528],
                        [-74.0591, 4.6527]
                    ]
                }
            ]
        })

        it('Cuando todo sale bien; la segunda way tiene un punto más cercano que la primera', () => {
            const lineStrings = [
                'line_string_1',
                'line_string_2'
            ]
            const nearestPoints = [
                {
                    geometry : {
                        coordinates: [0, 1]
                    },
                    properties: {
                        location: 125
                    }
                },
                {
                    geometry : {
                        coordinates: [1, 2]
                    },
                    properties: {
                        location: 110
                    }
                }
            ]
            const distances = [
                20000,
                150
            ]
            mockLineString.mockReturnValueOnce(lineStrings[0])
            mockLineString.mockReturnValueOnce(lineStrings[1])
            mockNearestPointOnLine.mockReturnValueOnce(nearestPoints[0])
            mockNearestPointOnLine.mockReturnValueOnce(nearestPoints[1])
            mockDistance.mockReturnValueOnce(distances[0])
            mockDistance.mockReturnValueOnce(distances[1])
            const result = geoAggregationAdapter.snapPointToWaysWithS(point, ways)
            expect(mockLineString).toHaveBeenNthCalledWith(
                1,
                ways[0].coords
            )
            expect(mockLineString).toHaveBeenNthCalledWith(
                2,
                ways[1].coords
            )
            expect(mockNearestPointOnLine).toHaveBeenNthCalledWith(
                1,
                lineStrings[0],
                [point.lon, point.lat],
                { units: 'kilometers' }
            )
            expect(mockNearestPointOnLine).toHaveBeenNthCalledWith(
                2,
                lineStrings[1],
                [point.lon, point.lat],
                { units: 'kilometers' }
            )
            expect(mockDistance).toHaveBeenNthCalledWith(
                1,
                [point.lon, point.lat],
                [nearestPoints[0].geometry.coordinates[0], nearestPoints[0].geometry.coordinates[1]],
                { units: 'meters' }
            )
            expect(mockDistance).toHaveBeenNthCalledWith(
                2,
                [point.lon, point.lat],
                [nearestPoints[1].geometry.coordinates[0], nearestPoints[1].geometry.coordinates[1]],
                { units: 'meters' }
            )
            expect(result).toStrictEqual({
                way: ways[1],
                snapped: {
                    lon: nearestPoints[1].geometry.coordinates[0],
                    lat: nearestPoints[1].geometry.coordinates[1]
                },
                distMeters: distances[1],
                s: nearestPoints[1].properties.location * 1000
            })
        })
    })

    describe('consolidateByWayWithS', () => {
        let pointsWithAttrs

        it('Cuando todo sale bien; todos los pointsWithAttrs tienen wayId', () => {
            const ways = [
                {
                    id: 123456789,
                    street: 'Calle 45',
                    maxSpeedKmh: '30',
                    highway: 'residential',
                    tags: {
                        "highway": "residential",
                        "name": "Calle 45",
                        "maxspeed": "30"
                    },
                    coords: [
                        [-74.0581, 4.6523],
                        [-74.0585, 4.6525],
                        [-74.0590, 4.6528]
                    ]
                },
                {
                    id: 123456791,
                    street: 'Carrera 13',
                    maxSpeedKmh: '50',
                    highway: 'residential',
                    tags: {
                        "highway": "residential",
                        "name": "Carrera 13",
                        "maxspeed": "50"
                    },
                    coords: [
                        [-74.0581, 4.6524],
                        [-74.0586, 4.6528],
                        [-74.0591, 4.6527]
                    ]
                }
            ]
            pointsWithAttrs = [
                {
                    p: {lat: 1.01, lon: -1.01, speed_mps: 5},
                    snappedLon: -74.0581,
                    snappedLat: 4.6523,
                    street: ways[0].street,
                    wayId: ways[0].id,
                    highway: ways[0].highway,
                    maxSpeedKmh: 30,
                    speed_kmh: 5 * 3.6,
                    s: 55,
                    wayCoords: ways[0].coords,
                    note: null
                },
                {
                    p: {lat: 1.02, lon: -1.02, speed_mps: 10},
                    snappedLon: -74.0585,
                    snappedLat: 4.6525,
                    street: ways[0].street,
                    wayId: ways[0].id,
                    highway: ways[0].highway,
                    maxSpeedKmh: 30,
                    speed_kmh: 10 * 3.6,
                    s: 58,
                    wayCoords: ways[0].coords,
                    note: null
                },
                {
                    p: {lat: 1.03, lon: -1.03, speed_mps: 15},
                    snappedLon: 2,
                    snappedLat: 3,
                    street: ways[1].street,
                    wayId: ways[1].id,
                    highway: ways[1].highway,
                    maxSpeedKmh: 30,
                    speed_kmh: 20 * 3.6,
                    s: 20,
                    wayCoords: ways[1].coords,
                    note: null
                }
            ]
            const result = geoAggregationAdapter.consolidateByWayWithS(pointsWithAttrs)
            expect(result).toStrictEqual([
                {
                    wayId: ways[0].id,
                    name: ways[0].street,
                    highway: ways[0].highway,
                    maxSpeedKmh: pointsWithAttrs[0].maxSpeedKmh,
                    sStart: pointsWithAttrs[0].s,
                    sEnd: pointsWithAttrs[1].s,
                    coords: ways[0].coords
                },
                {
                    wayId: ways[1].id,
                    name: ways[1].street,
                    highway: ways[1].highway,
                    maxSpeedKmh: pointsWithAttrs[2].maxSpeedKmh,
                    sStart: pointsWithAttrs[2].s,
                    sEnd: pointsWithAttrs[2].s,
                    coords: ways[1].coords
                }
            ])
        })

        it('Cuando todo sale bien; hay algunos pointsWithAttrs con wayId = null', () => {
            const ways = [
                {
                    id: 111111111,
                    street: 'Calle 45',
                    maxSpeedKmh: '30',
                    highway: 'residential',
                    tags: {
                        "highway": "residential",
                        "name": "Calle 45",
                        "maxspeed": "30"
                    },
                    coords: [
                        [-74.0581, 4.6523],
                        [-74.0585, 4.6525],
                        [-74.0590, 4.6528]
                    ]
                },
                {
                    id: 111111112,
                    street: 'Carrera 13',
                    maxSpeedKmh: '50',
                    highway: 'residential',
                    tags: {
                        "highway": "residential",
                        "name": "Carrera 13",
                        "maxspeed": "50"
                    },
                    coords: [
                        [-74.0581, 4.6524],
                        [-74.0586, 4.6528],
                        [-74.0591, 4.6527]
                    ]
                }
            ]
            pointsWithAttrs = [
                {
                    p: {lat: 1.01, lon: -1.01, speed_mps: 5},
                    snappedLon: -74.0581,
                    snappedLat: 4.6523,
                    street: ways[0].street,
                    wayId: ways[0].id,
                    highway: ways[0].highway,
                    maxSpeedKmh: 30,
                    speed_kmh: 5 * 3.6,
                    s: 55,
                    wayCoords: ways[0].coords,
                    note: null
                },
                {
                    p: {lat: 1.015, lon: -1.015, speed_mps: 7},
                    snappedLon: -74.0581,
                    snappedLat: 4.6523,
                    street: ways[0].street,
                    wayId: null,
                    highway: ways[0].highway,
                    maxSpeedKmh: 30,
                    speed_kmh: 5 * 3.6,
                    s: 56.5,
                    wayCoords: ways[0].coords,
                    note: 'no_way_found'
                },
                {
                    p: {lat: 1.02, lon: -1.02, speed_mps: 10},
                    snappedLon: -74.0585,
                    snappedLat: 4.6525,
                    street: ways[0].street,
                    wayId: ways[0].id,
                    highway: ways[0].highway,
                    maxSpeedKmh: 30,
                    speed_kmh: 10 * 3.6,
                    s: 58,
                    wayCoords: ways[0].coords,
                    note: null
                },
                {
                    p: {lat: 1.03, lon: -1.03, speed_mps: 15},
                    snappedLon: 2,
                    snappedLat: 3,
                    street: ways[1].street,
                    wayId: ways[1].id,
                    highway: ways[1].highway,
                    maxSpeedKmh: 30,
                    speed_kmh: 20 * 3.6,
                    s: 20,
                    wayCoords: ways[1].coords,
                    note: null
                }
            ]
            const result = geoAggregationAdapter.consolidateByWayWithS(pointsWithAttrs)
            expect(result).toStrictEqual([
                {
                    wayId: ways[0].id,
                    name: ways[0].street,
                    highway: ways[0].highway,
                    maxSpeedKmh: pointsWithAttrs[0].maxSpeedKmh,
                    sStart: pointsWithAttrs[0].s,
                    sEnd: pointsWithAttrs[0].s,
                    coords: ways[0].coords
                },
                {
                    wayId: ways[0].id,
                    name: ways[0].street,
                    highway: ways[0].highway,
                    maxSpeedKmh: pointsWithAttrs[0].maxSpeedKmh,
                    sStart: pointsWithAttrs[2].s,
                    sEnd: pointsWithAttrs[2].s,
                    coords: ways[0].coords
                },
                {
                    wayId: ways[1].id,
                    name: ways[1].street,
                    highway: ways[1].highway,
                    maxSpeedKmh: pointsWithAttrs[3].maxSpeedKmh,
                    sStart: pointsWithAttrs[3].s,
                    sEnd: pointsWithAttrs[3].s,
                    coords: ways[1].coords
                }
            ])
        })

    })

    describe('addInterval', () => {
        let unionForWay
        let sA
        let sB

        it('Cuando unionForWay es nulo o indefinido', () => {
            sA = 1
            sB = 2
            const result = geoAggregationAdapter.addInterval(unionForWay, sA, sB)
            expect(result).toStrictEqual([[sA, sB]])            
        })

        it('Cuando unionForWay está vacío', () => {
            unionForWay = []
            sA = 1
            sB = 2
            const result = geoAggregationAdapter.addInterval(unionForWay, sA, sB)
            expect(result).toStrictEqual([[sA, sB]])            
        })

        it('Cuando unionForWay está vacío y sA > sB', () => {
            unionForWay = []
            sA = 3
            sB = 2
            const result = geoAggregationAdapter.addInterval(unionForWay, sA, sB)
            expect(result).toStrictEqual([[sB, sA]])            
        })

        it('Cuando unionForWay tiene elementos y la nueva tupla encaja entre dos tuplas del unionForWay', () => {
            unionForWay = [[0.1, 0.15], [0.2, 0.25], [0.25, 0.3]]
            sA = 0.16
            sB = 0.19
            const result = geoAggregationAdapter.addInterval(unionForWay, sA, sB)
            expect(result).toStrictEqual([
                unionForWay[0],
                [sA, sB],
                unionForWay[1],
                unionForWay[2]
            ])
        })

        it('Cuando unionForWay tiene elementos y la nueva tupla se entrecruza con otra', () => {
            unionForWay = [[0.1, 0.15], [0.18, 0.25], [0.26, 0.3]]
            sA = 0.16
            sB = 0.19
            const result = geoAggregationAdapter.addInterval(unionForWay, sA, sB)
            expect(result).toStrictEqual([
                unionForWay[0],
                [sA, unionForWay[1][1]],
                unionForWay[2]
            ])
        })

        it('Cuando unionForWay tiene elementos y la nueva tupla se entrecruza con las últimas dos', () => {
            unionForWay = [[0.1, 0.15], [0.18, 0.25], [0.26, 0.3]]
            sA = 0.19
            sB = 0.27
            const result = geoAggregationAdapter.addInterval(unionForWay, sA, sB)
            expect(result).toStrictEqual([
                unionForWay[0],
                [unionForWay[1][0], unionForWay[2][1]]
            ])
        })
    })

    describe('mergeUnion', () => {
        let existingUnion
        let newSegments

        it('Cuando el existingUnion es undefined o null', () => {
            newSegments = [
                {
                    wayId: 1,
                    sStart: 0.1,
                    sEnd: 0.2
                },
                {
                    wayId: 200,
                    sStart: 0.05,
                    sEnd: 0.3
                }
            ]
            geoAggregationAdapter.addInterval = jest.fn()
            geoAggregationAdapter.addInterval.mockReturnValueOnce([[0.1, 0.2]])
            geoAggregationAdapter.addInterval.mockReturnValueOnce([[0.05, 0.3]])
            const result = geoAggregationAdapter.mergeUnion(existingUnion, newSegments)
            expect(geoAggregationAdapter.addInterval).toHaveBeenNthCalledWith(
                1,
                [],
                newSegments[0].sStart,
                newSegments[0].sEnd
            )
            expect(geoAggregationAdapter.addInterval).toHaveBeenNthCalledWith(
                2,
                [],
                newSegments[1].sStart,
                newSegments[1].sEnd
            )
            expect(result).toStrictEqual({
                1: [[0.1, 0.2]],
                200: [[0.05, 0.3]]
            })
        })

        it('Cuando el existingUnion contiene segmentos con wayId distintos', () => {
            existingUnion = {
                1: [[0.23, 0.4], [0.41, 0.45]]
            }
            newSegments = [
                {
                    wayId: 5,
                    sStart: 0.1,
                    sEnd: 0.2
                },
                {
                    wayId: 6,
                    sStart: 0.05,
                    sEnd: 0.3
                }
            ]
            geoAggregationAdapter.addInterval = jest.fn()
            geoAggregationAdapter.addInterval.mockReturnValueOnce([[0.1, 0.2]])
            geoAggregationAdapter.addInterval.mockReturnValueOnce([[0.05, 0.3]])
            const result = geoAggregationAdapter.mergeUnion(existingUnion, newSegments)
            expect(geoAggregationAdapter.addInterval).toHaveBeenNthCalledWith(
                1,
                [],
                newSegments[0].sStart,
                newSegments[0].sEnd
            )
            expect(geoAggregationAdapter.addInterval).toHaveBeenNthCalledWith(
                2,
                [],
                newSegments[1].sStart,
                newSegments[1].sEnd
            )
            expect(result).toStrictEqual({
                1: existingUnion[1],
                5: [[0.1, 0.2]],
                6: [[0.05, 0.3]]
            })
        })

        it('Cuando el existingUnion tiene ids en común con los newSegments', () => {
            existingUnion = {
                1: [[0.23, 0.4], [0.41, 0.45]],
                5: [[0.01, 0.07]]
            }
            newSegments = [
                {
                    wayId: 5,
                    sStart: 0.1,
                    sEnd: 0.2
                },
                {
                    wayId: 6,
                    sStart: 0.05,
                    sEnd: 0.3
                }
            ]
            geoAggregationAdapter.addInterval = jest.fn()
            geoAggregationAdapter.addInterval.mockReturnValueOnce([[0.01, 0.07], [0.1, 0.2]])
            geoAggregationAdapter.addInterval.mockReturnValueOnce([[0.05, 0.3]])
            const result = geoAggregationAdapter.mergeUnion(existingUnion, newSegments)
            expect(geoAggregationAdapter.addInterval).toHaveBeenNthCalledWith(
                1,
                existingUnion[5],
                newSegments[0].sStart,
                newSegments[0].sEnd
            )
            expect(geoAggregationAdapter.addInterval).toHaveBeenNthCalledWith(
                2,
                [],
                newSegments[1].sStart,
                newSegments[1].sEnd
            )
            expect(result).toStrictEqual({
                1: existingUnion[1],
                5: [[0.01, 0.07], [0.1, 0.2]],
                6: [[0.05, 0.3]]
            })
        })
    })
})