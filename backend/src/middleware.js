
import jwt from 'jsonwebtoken'
import { WORKER_JWT_SECRET } from './config.js'
// const JWT_SECRET = "YashisPowerFullLikeSCARY"

export function authMiddleware(req, res, next) {
    const authHeader = req.headers ["authorization"]
    const JWT_SECRET = process.env.JWT_SECRET

    if (!authHeader) {
        return res.status(403).json({
            message: "You are not logged in"
        })
    }
    
    try {
         const decode = jwt.verify(authHeader, JWT_SECRET)
         if (decode.userId) {
            req.userId=decode.userId
            return next()
         } else {
                    return res.status(403).json({
                    message: "You are not logged in"
        })
         }
    } catch (error) {
        return res.status(403).json({
            message: "You are not logged in"
        })
    }
}





export function workerMiddleware(req, res, next) {
    

    const authHeader = req.headers ["authorization"]
    console.log("authHeader", authHeader);


    if (!authHeader) {
        return res.status(403).json({
            message: "You are not logged in"
        })
    }
    
    try {
         const decode = jwt.verify(authHeader, WORKER_JWT_SECRET)
         if (decode.workerId) {
            req.workerId=decode.workerId
            return next()
         } else {
                    return res.status(403).json({
                    message: "You are not logged in"
        })
         }
    } catch (error) {
        return res.status(403).json({
            message: "You are not logged in"
        })
    }


}