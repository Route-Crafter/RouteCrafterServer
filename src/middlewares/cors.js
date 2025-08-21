import cors from 'cors'

const ACCEPTED_ORIGINS = [
    'http://localhost:8080',
    'http://localhost:1234',
    'http://books.com'
]
/*
 ********* CORS
 * Métodos normales: GET / HEAD / POST
 * * CORS PRE-Flight
 * Métodos complejos: PUT / PATCH / DELETE
 * * OPTIONS
*/

export const corsMiddleware = () => cors({
    origin: (origin, callback) => {
        if(ACCEPTED_ORIGINS.includes(origin)) {
            return callback(null, true)
        }

        if(!origin){
            return callback(null, true)
        }

        return callback(new Error('Not allowerd by CORS'))
    }
})