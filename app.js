import cookieParser from "cookie-parser"
import express, { json, urlencoded } from "express"
import cors from "cors"

const app = express()
const allowedOrigins = [
  "http://localhost:5173", // dev
  "https://voyabikeshare.vercel.app" // prod
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(cookieParser())
app.use(json())
app.use(urlencoded())
app.set(express.static("public"))

import router from "./src/routes/user.routes.js"
app.use("/user",router)

import { ridesRouter } from "./src/routes/ride.routes.js"
app.use("/ride",ridesRouter)
export {app}