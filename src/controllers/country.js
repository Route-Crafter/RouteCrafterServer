
export class CountryController{
    constructor({countryModel, validateCountry}){
        this.countryModel = countryModel
        this.validateCountry = validateCountry
    }

    getAll = async (req, res) => {
        const countries = await this.countryModel.getAll()
        res.json(countries)
    }

    create = async (req, res) => {
        const result = this.validateCountry(req.body)
        if(result.error){
            return res.status(400).json({
                error: JSON.parse(result.error.message)
            })
        }
        const newCountry = await this.countryModel.create({input: result.data})
        if(newCountry){
            res.status(201).json(newCountry)
        }else{
            res.status(500).json({
                error: 'No se ha podido crear el elemento'
            })
        }
        
    }

    delete = async (req, res) => {
        const {countryId} = req.params
        const wasDeleted = await this.countryModel.delete({id: countryId})
        if(!wasDeleted){
            return res.status(404).json({
                message: 'No se pudo borrar el país'
            })
        }
        return res.json({
            message: 'Se ha borrado el país'
        })
    }
}