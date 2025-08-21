export class RouteExecutionModel{
    constructor({connection}){
        this.connection = connection
    }

    getAllByRouteId = async ({ routeId }) => {
        const [executions] = await this.connection.query(
            `SELECT
                id,
                license_plate as licensePlate,
                init_time as initTime,
                end_time as endTime
            FROM route_executions
            WHERE route_id = UUID_TO_BIN(?)
            `,
            [routeId]
        )
        return executions
    }

    create = async ({input, routeId}) => {
        try{
            const {
                licensePlate,
                initTime
            } = input
            await this.connection.beginTransaction()
            await this.connection.query(
                `INSERT INTO route_executions (license_plate, init_time, route_id)
                    VALUES (?, ?, UUID_TO_BIN(?))
                `,
                [licensePlate, initTime, routeId]
            )
            const [executions] = await this.connection.query(
                `SELECT
                    id,
                    license_plate as licensePlate,
                    init_time as initTime,
                    BIN_TO_UUID(route_id) as routeId
                FROM route_executions
                WHERE id = (SELECT LAST_INSERT_ID())
                `
            )
            await this.connection.commit()
            return executions[0] ?? false
        }catch(err){
            this.connection.rollback()
            return false
        }
    }

    update = async ({input, id}) => {
        const {
            endTime
        } = input
        await this.connection.query(
            ` UPDATE route_executions
                SET end_time = ?
                WHERE id = ?
            `,
            [endTime, id]
        )
        const [executions] = await this.connection.query(
            `SELECT
                id,
                license_plate as licensePlate,
                init_time as initTime,
                end_time as endTime,
                BIN_TO_UUID(route_id) as routeId
            FROM route_executions
            WHERE id = ?
            `,
            [id]
        )
        return executions[0]
    }

    delete = async({ id }) => {
        try{
            const [result] = await this.connection.query(
                `DELETE FROM route_executions
                    WHERE id = ?
                `,
                [id]
            )
            return result['affectedRows'] == 1
        }catch(err){
            return false
        }
    }
}