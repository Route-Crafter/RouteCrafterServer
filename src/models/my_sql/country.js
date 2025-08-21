export class CountryModel{
    constructor({connection}){
        this.connection = connection
    }

    getAll = async () => {
        const [countries] = await this.connection.query(
            `SELECT * FROM countries`
        )
        return countries
    }

    getByIso = async ({ iso }) => {
        const [countries] = await this.connection.query(
            `SELECT * FROM countries
                WHERE iso = ?
            `,
            [iso]
        )
        return countries[0]
    }

    create = async ({ input }) => {
        try{
            const {
                name,
                iso
            } = input
            await this.connection.query(
                `INSERT INTO countries (name, iso)
                    VALUES (?, ?)
                `,
                [name, iso]
            )
            const [countries] = await this.connection.query(
                `SELECT
                    id,
                    name,
                    iso
                FROM countries
                WHERE iso = ?
                `,
                [iso]
            )
            return countries[0]
        }catch(err){
            return false
        }
    }

    //TODO: Probar que en efecto la base de datos haga su eliminación en cascada
    delete = async ({ id }) => {
        try{
            const [result] = await this.connection.query(
                `DELETE FROM countries
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