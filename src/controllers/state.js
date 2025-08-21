export class StateController{
    constructor({stateModel, validateState}){
        this.stateModel = stateModel
        this.validateState = validateState
    }

    getAllByCountryId = async (req, res) => {
        const { countryId } = req.params
        const states = await this.stateModel.getAllByCountryId({ countryId })
        res.json(states)
    }

    create = async (req, res) => {
        const { countryId } = req.params
        const result = this.validateState(req.body)
        if(result.error){
            return res.status(400).json({
                error: JSON.parse(result.error.message)
            })
        }
        const newState = await this.stateModel.create({input: result.data, countryId})
        if(newState){
            res.status(201).json(newState)
        }else{
            res.status(500).json({
                message: 'No se ha podido crear el elemento'
            })
        }
    }

    delete = async (req, res) => {
        const {stateId} = req.params
        const wasDeleted = await this.stateModel.delete({id: stateId})
        if(!wasDeleted){
            return res.status(404).json({
                message: 'No se pudo borrar el estado'
            })
        }
        return res.json({
            message: 'Se ha borrado el estado'
        })
    }
}