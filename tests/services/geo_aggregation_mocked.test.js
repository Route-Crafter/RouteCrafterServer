import { beforeEach, describe, jest } from '@jest/globals'
import { GeoAggregationService } from '../../src/services/geo_aggregation'

describe('GeoAgregationService mocked', () => {
    let geoAggregationService
    let adapter

    beforeEach(() => {
        adapter = {
            ensureWaysForRoute: jest.fn(),
            annotatePoints: jest.fn(),
            consolidateByWayWithS: jest.fn(),
            mergeUnion: jest.fn()
        }
        geoAggregationService = new GeoAggregationService({
            adapter
        })
    })

    describe('insertPointsInToRoute', () => {
        let route
        let points

        beforeEach(() => {
            
            points = [
                {lat: 1, lon: 2},
                {lat: 3, lon: 4}
            ]
        })

        it('Debe llamar los métodos indicados', async () => {
            const initRoute = {
                name: 'Route X',
                description: 'This is the Route X'
            }
            route = {
                name: initRoute.name,
                description: initRoute.description
            }
            const waysPack = {
                dict: {3: {name: 'w1'}, 5: {name: 'w2'}},
                bbox: [1, 2, 3, 4],
                list: [{name: 'w1'}]
            }
            adapter.ensureWaysForRoute.mockResolvedValue(waysPack)
            const annotated = {
                3: [1, 2],
                5: [3, 4]
            }
            adapter.annotatePoints.mockReturnValue(annotated)
            const segs = [
                {
                    wayId: 3,
                    sStart: 0.01,
                    sEnd: 0.05
                },
                {
                    wayId: 5,
                    sStart: 0.08,
                    sEnd: 0.45
                }
            ] 
            adapter.consolidateByWayWithS.mockReturnValue(segs)
            const union = {
                3: [[0.01, 0.05], [0.06, 0.09]],
                5: [[0.02, 0.45], [0.47, 0.48]]
            }
            adapter.mergeUnion.mockReturnValue(union)
            const updatedRoute = {
                ...route,
                ways: waysPack.dict,
                bbox: waysPack.bbox,
                union: union,
                orderedWayIds: [3, 5]
            }
            await geoAggregationService.insertPointsInToRoute({ route, points })
            expect(adapter.ensureWaysForRoute).toHaveBeenCalledWith(
                expect.objectContaining(initRoute),
                points
            )
            expect(adapter.annotatePoints).toHaveBeenCalledWith(
                points,
                waysPack.list,
                50
            )
            expect(adapter.consolidateByWayWithS).toHaveBeenCalledWith(
                annotated
            )
            expect(adapter.mergeUnion).toHaveBeenCalledWith(
                undefined,
                segs
            )
            expect(route).toStrictEqual(updatedRoute)
        })
    })
})