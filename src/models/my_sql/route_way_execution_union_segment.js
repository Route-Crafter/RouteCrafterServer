export class RouteWayExecutionUnionSegmentModel {
    constructor({connection}){
        this.connection = connection
    }

    getByRouteIdAndWayId = async ({ routeId, wayId }) => {
        const [segments] = await this.connection.query(
            `SELECT p1, p2
                FROM route_way_executions_union_segments
                WHERE route_id = ? AND way_id = ?
            `,
            [routeId, wayId]
        )
        return segments
    }

    removeAllByRouteIdAndWayId = async ({ routeId, wayId }) => {
        const [segments] = await this.connection.query(
            `DELETE FROM route_way_executions_union_segments
                WHERE route_id = UUID_TO_BIN(?) AND way_id = ?
            `,
            [routeId, wayId]
        )
        return segments
    }

    create = async ({ input, routeId, wayId }) => {
        const {
            p1,
            p2
        } = input
        await this.connection.query(
            `INSERT INTO route_way_executions_union_segments
                (route_id, way_id, p1, p2)
                VALUES (?, ?, ?, ?)
            `,
            [routeId, wayId, p1, p2]
        )
    }
}