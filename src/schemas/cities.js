import z from 'zod'

const citySchema = z.object({
    name: z.string({
        invalid_type_error: 'El nombre debe ser un String',
        required_error: 'El nombre es requerido'
    })
})

export function validateCity (object) {
    return citySchema.safeParse(object)
}