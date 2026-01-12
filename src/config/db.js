import mongoose from "mongoose";

const connectDb = async () => {
  try {
    const connectedTo = await mongoose.connect(process.env.MONGO_CONNECTION_STRING)
    console.log(connectedTo.connection.host)
  } catch (error) {
    console.log(error)
  }
}

export {connectDb}