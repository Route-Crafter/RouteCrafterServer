import z from 'zod'

const countrySchema = z.object({
    name: z.string({
        invalid_type_error: 'El nombre debe ser un String',
        required_error: 'El nombre es requerido'
    }),
    iso: z.string({
        invalid_type_error: 'El código ISO debe ser un String'
    }).regex(
        /^[A-Z]{2}$/,
        'Debe ser un código ISO en formato alpha-2 (Ejemplo: CO para Colombia)'
    )
})

export function validateCountry(object) {
    return countrySchema.safeParse(object)
}