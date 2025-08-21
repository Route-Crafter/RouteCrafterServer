import z from 'zod'

const stateSchema = z.object({
    name: z.string({
        invalid_type_error: 'El nombre debe ser un String',
        required_error: 'El nombre es requerido'
    })
})

export function validateState(object) {
    return stateSchema.safeParse(object)
}