export class WayModel{
    constructor({connection}){
        this.connection = connection
    }

    getById = async ({ id }) => {
        const [ways] = await this.connection.query(
            `SELECT
                id,
                name,
                highway,
                max_speed_kmh as maxSpeedKmh    
            FROM ways
            WHERE id = ?`,
            [id]
        )
        return ways[0]
    }

    create = async ({ input, id }) => {
        const {
            name,
            highway,
            maxSpeedKmh
        } = input
        await this.connection.query(`
            INSERT INTO ways (id, name, highway, max_speed_kmh)
                VALUES (?, ?, ?, ?)
            `,
            [id, name, highway, maxSpeedKmh]
        )
        const [ways] = await this.connection.query(
            `SELECT * FROM highways
                WHERE id = (SELECT LAST_INSERT_ID()) 
            `
        )
        return ways[0]
    }


}