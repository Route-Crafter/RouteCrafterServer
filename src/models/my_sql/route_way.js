export class RouteWayModel {
    constructor({connection}){
        this.connection = connection
    }

    getAllByRouteId = async ({ routeId }) => {
        const [ways] = await this.connection.query(
            `SELECT
                way_id as wayId,
                ordered_position as orderedPosition
            FROM routes_ways
            WHERE route_id = ?
            `,
            [routeId]
        )
        return ways
    }

    removeAllByRouteId = async ({ routeId }) => {
        await this.connection.query(
            `DELETE FROM routes_ways
                WHERE route_id = UUID_TO_BIN(?)
            `,
            [routeId]
        )
    }

    create = async ({ input, routeId, wayId }) => {
        const [
            orderedPosition
        ] = input
        await this.connection.query(
            `INSERT INTO routes_ways (route_id, way_id, ordered_position)
                VALUES (?, ?,?)
            `,
            [routeId, wayId, orderedPosition]
        )
    }

    update = async ({ input, routeId, wayId }) => {
        const {
            orderedPosition
        } = input
        await this.connection.query(
            `UPDATE routes_ways
                SET ordered_position = ?
                WHER#E route_id = ? AND way_id = ?
            `,
            [orderedPosition, routeId, wayId]
        )
    }
}