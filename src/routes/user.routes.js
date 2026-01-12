import { Router } from "express";
import { createUser,login,registerBike,logout,toggleOnline, getCurrentUser, implicitToggleOnline } from "../controllers/user.controller.js";
import {VerifyJwt} from "../middlewares/user.middle.js"
const router= Router()

router.route("/createUser").post(createUser)
router.route("/login").post(login)
router.route("/registerBike").post(VerifyJwt,registerBike)
router.route("/logout").post(logout)
router.route("/getcurrentuser").get(VerifyJwt,getCurrentUser)
router.route("/toggleOnline").post(VerifyJwt,toggleOnline)
router.route("/implicitToggleOnline").post(VerifyJwt,implicitToggleOnline)

export default router