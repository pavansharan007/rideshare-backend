import mongoose, { Schema } from "mongoose";

const ridesSchema = new Schema({
  UserId:{
    type:String
  },
  BikeOwnerId:{
    type:String
  },
  rideStatus:{
    type:String,
    enum:["ongoing","completed","not started","started"],
    default:"not started"
  },
  ridePickupTime:{
    type:String
  },
  rideCompletedTime:{
    type:String
  },
  rideId:{
    type:String
  },
  rideAccepted:{
    type:Boolean,
    default:false
  },perHrFee:{
    type:Number
  },rideOtp:{
    type:String
  },
  isBikeOnRide:{
    type:Boolean,
    default:false
  },rideFee:{
    type:Number
  },hostName:{
    type:String
  },
  voyagerName:{
    type:String
  }
},{timestamps:true})


export const Rides = mongoose.model("Rides",ridesSchema)