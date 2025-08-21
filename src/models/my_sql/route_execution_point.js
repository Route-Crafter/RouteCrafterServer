export class RouteExecutionPointModel{
    constructor({connection}){
        this.connection = connection
    }

    getAllByRouteExecutionId = async ({ routeExecutionId }) => {
        const [points] = await this.connection.query(
            `SELECT * FROM route_execution_points
                WHERE route_execution_id = ?
            `,
            [routeExecutionId]
        )
        return points
    }

    createList = async ({ inputs, routeExecutionId }) => {
        for(let i in inputs){
            const {
                lat,
                lon,
                speed
            } = inputs[i]
            await this.connection.query(
                `INSERT INTO route_execution_points (lat, lon, speed, route_execution_id)
                    VALUES (?, ?, ?, ?)
                `,
                [lat, lon, speed, routeExecutionId]
            )
        }
        const [points] = await this.connection.query(
            `SELECT * FROM route_execution_points
                WHERE route_execution_id = ?
            `,
            [routeExecutionId]
        )
        return points
    }
}