import z from 'zod'

const RouteSchema = z.object({
    name: z.string({
        invalid_type_error: 'El nombre debe ser un String',
        required_error: 'El nombre es requerido'
    }),
    description: z.string({
        invalid_type_error: 'El nombre debe ser un String',
    })
})

export function validateRoute(object) {
    return RouteSchema.safeParse(object)
}