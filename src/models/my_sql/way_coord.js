export class WayCoordModel{
    constructor({connection}){
        this.connection = connection
    }

    getAllByWayId = async ({ wayId }) => {
        const [coords] = await this.connection.query(
            `SELECT
                lat,
                lon
            FROM way_coords
            WHERE way_id = ?
            `,
            [wayId]
        )
        return coords
    }

    create = async ({ input, wayId }) => {
        const {
            lat,
            lon
        } = input
        await this.connection.query(
            `INSERT INTO way_coords (lat, lon, way_id)
                VALUES (?, ?, ?)
            `,
            [lat, lon, wayId]
        )
    }
}