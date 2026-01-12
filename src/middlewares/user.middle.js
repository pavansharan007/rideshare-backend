import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken"
const VerifyJwt = async(req , res , next) => {
    const token = req.cookies?.accessToken

    if(!token){
      return res.status(401)
      .json({
        flag:false,
        message:"unauthorized"
      })
    }

    const decodedToken =  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    const user = await User.findById(decodedToken?.id)

    if(!user){
      return res.status(404)
      .json({
        flag:false,
        message:"User not found"
      })
    }

    req.user = user

    next()
}

export {VerifyJwt}