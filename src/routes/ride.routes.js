import { Router } from "express";
import { acceptRide,createRide,completeRide, declineRide, confirmRide, getRides } from "../controllers/ride.controller.js";
import { VerifyJwt } from "../middlewares/user.middle.js";
const ridesRouter = Router()

ridesRouter.route("/createRide").post(VerifyJwt,createRide)
ridesRouter.route("/acceptRide").post(acceptRide)
ridesRouter.route("/completeRide").post(completeRide)
ridesRouter.route("/declineRide").post(declineRide)
ridesRouter.route('/confirmRide').post(confirmRide)
ridesRouter.route('/getRide').get(VerifyJwt,getRides)
export {ridesRouter}