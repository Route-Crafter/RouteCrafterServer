export class CityModel{
    constructor({ connection }){
        this.connection = connection
    }

    getAllByStateId = async ({ stateId }) => {
        const [cities] = await this.connection.query(
            `SELECT * FROM cities
                WHERE state_id = ?
            `,
            [stateId]
        )
        return cities
    }

    getByNameAndStateId = async ({ name, stateId }) => {
        const [cities] = await this.connection.query(
            `SELECT * FROM cities
                WHERE LOWER(name) = ? AND state_id = ?
            `,
            [name.toLowerCase(), stateId]
        )
        return cities[0]
    }

    create = async ({ input, stateId }) => {
        try{
            const {
                name
            } = input
            await this.connection.query(
                `INSERT INTO cities (name, state_id)
                    VALUES (?, ?)
                `,
                [name, stateId]
            )
            const [cities] = await this.connection.query(
                `SELECT * FROM cities
                    WHERE name = ? AND state_id = ?
                `,
                [name, stateId]
            )
            return cities[0]
        }catch(err){
            return false
        }
    }

    delete = async({ id }) => {
        try{
            const [result] = await this.connection.query(
                `DELETE FROM cities
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