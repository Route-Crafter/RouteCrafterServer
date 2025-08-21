import { randomUUID } from 'crypto'
export class RouteModel{
    constructor({connection}){
        this.connection = connection
    }

    getAllByCityId = async ({ cityId }) => {
        const [routes] = await this.connection.query(
            `SELECT 
                BIN_TO_UUID(id) as id,
                name,
                description
            FROM routes
                WHERE city_id = ?
            `,
            [cityId]
        )
        return routes
    }

    getByNameAndCityId = async ({ name, cityId }) => {
        const [routes] = await this.connection.query(
            `SELECT 
                BIN_TO_UUID(id) as id,
                name,
                description
            FROM routes
                WHERE name = ? AND city_id = ?
            `,
            [name, cityId]
        )
        return routes
    }

    getById = async ({ id }) => {
        const [routes] = await this.connection.query(
            `SELECT
                BIN_TO_UUID(id) as id,
                name,
                description,
                city_id as cityId,
                min_lat as minLat,
                min_lon as minLon,
                max_lat as maxLat,
                max_lon as maxLon,
                version,
                updated_at as updatedAt,
                polyline_cache as polylineCache
            FROM routes
                WHERE BIN_TO_UUID(id) = ?
            `,
            [id]
        )
        return routes[0]
    }

    create = async ({input, cityId}) => {
        const {
            name,
            description
        } = input
        const uuid = randomUUID()
        await this.connection.query(
            `INSERT INTO routes (id, name, description, city_id)
                VALUES (UUID_TO_BIN('${uuid}'), ?, ?, ?)
            `, 
            [name, description, cityId]
        )
        const [routes] = await this.connection.query(
            `SELECT
                BIN_TO_UUID(id) as id,
                name,
                description,
                city_id    
            FROM routes
            WHERE BIN_TO_UUID(id) = '${uuid}'
            `,
            [name, cityId]
        )
        return routes[0]
    }

    delete = async({ id }) => {
        try{
            const [result] = await this.connection.query(
                `DELETE FROM routes
                    WHERE BIN_TO_UUID(id) = ?
                `,
                [id]
            )
            return result['affectedRows'] == 1
        }catch(err){
            return false
        }
    }

    update = async ({ input, id }) => {
        const {
            minLat,
            minLon,
            maxLat,
            maxLon,
            version,
            updatedAt,
            polylineCache
        } = input
        await this.connection.query(
            `UPDATE routes 
            SET min_lat = ?,
                min_lon = ?,
                max_lat = ?,
                max_lon = ?,
                version = ?,
                updated_at = ?,
                polyline_cache = ?
            WHERE id = UUID_TO_BIN(?)
            `,
            [minLat, minLon, maxLat, maxLon, version, updatedAt, polylineCache, id]
        )
    }
}