import mongoose, { Schema } from "mongoose";

const HasBikeSchema = new Schema({
  uniqueId:{
    type:String
  },
  bikeName:{
    type:String
  },
  bikeNo:{
    type:String
  },
  bikeImg:{
    type:String
  },
  perHrFee:{
    type:String
  }
},{timestamps:true})


export const hasBike = mongoose.model("HasBike",HasBikeSchema)