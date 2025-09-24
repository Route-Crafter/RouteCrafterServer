import z from 'zod'

const initRouteExecutionSchema = z.object({
    initTime: z.string()
        .regex(
            /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]) ([01][0-9]|2[0-3]):[0-5][0-9]$/,
            {
                message: 'El formato debe ser yyyy-mm-dd hh:mm'
            }
        ),
    licensePlate: z.string().optional()
})

const endRouteExecutionSchema = z.object({
    endTime: z.string()
        .regex(
            /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]) ([01][0-9]|2[0-3]):[0-5][0-9]$/,
            {
                message: 'El formato debe ser yyyy-mm-dd hh:mm'
            }
        ).optional(),
    points: z.array(
        z.object({
            lat: z.float64(),
            lon: z.float64(),
            speed: z.float64().optional()
        }),
        {
            message: "El formato de los puntos del recorrido es incorrecto"
        }
    )
})

export function validateInitRouteExecution(object) {
    return initRouteExecutionSchema.safeParse(object)
}

export function validateEndRouteExecution(object) {
    return endRouteExecutionSchema.safeParse(object)
}