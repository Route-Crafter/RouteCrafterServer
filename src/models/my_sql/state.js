export class StateModel{
    constructor({connection}){
        this.connection = connection
    }

    getAllByCountryId = async ({countryId}) => {
        const [states] = await this.connection.query(
            `SELECT id, name
                FROM states
                WHERE country_id = ?
            `,
            [countryId]
        )
        return states
    }

    getByNameAndCountryId = async ({ name, countryId }) => {
        const [states] = await this.connection.query(
            `SELECT id, name
                FROM states
                WHERE LOWER(name) = ? AND country_id = ?
            `,
            [name.toLowerCase(), countryId]
        )
        return states[0]
    }

    create = async ({input, countryId}) => {
        try{
            const {
                name
            } = input
            await this.connection.query(
                `INSERT INTO states (name, country_id)
                    VALUES (?, ?)
                `,
                [name, countryId]
            )
            const [states] = await this.connection.query(
                `SELECT * FROM states
                    WHERE name = ? AND country_id = ?
                `,
                [name, countryId]
            )
            return states[0]
        }catch(err){
            return false
        }
    }

    delete = async({ id }) => {
        try{
            const [result] = await this.connection.query(
                `DELETE FROM states
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