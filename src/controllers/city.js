export class CityController{
    constructor({cityModel, validateCity}){
        this.cityModel = cityModel
        this.validateCity = validateCity
    }

    getAllByStateId = async (req, res) => {
        const { stateId } = req.params
        const cities = await this.cityModel.getAllByStateId({stateId})
        res.json(cities)
    }

    create = async (req, res) => {
        const { stateId } = req.params
        const result = this.validateCity(req.body)
        if(result.error){
            return res.status(400).json({
                error: JSON.parse(result.error.message)
            })
        }
        const newCity = await this.cityModel.create({
            input: result.data,
            stateId
        })
        if(newCity){
            res.status(201).json(newCity)
        }else{
            res.status(500).json({
                error: 'No se ha podido crear el elemento'
            })
        }
        
    }

    delete = async (req, res) => {
        const { cityId } = req.params
        const wasDeleted = await this.cityModel.delete({ id: cityId })
        if(!wasDeleted){
            return res.status(404).json({
                message: 'No se pudo borrar la ciudad'
            })
        }
        return res.json({
            message: 'Se ha borrado la ciudad'
        })
    }
}