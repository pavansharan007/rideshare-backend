import { User } from "../models/user.model.js";
import { Rides } from "../models/rides.model.js";
import { sendMesssageToSocketId } from "../../index.js";
import { customAlphabet } from "nanoid";
import { hasBike } from "../models/hasBike.model.js";

function getHourDifference(time1, time2) {
  // Parse "HH:mm" into Date objects
  const [h1, m1] = time1.split(":").map(Number);
  const [h2, m2] = time2.split(":").map(Number);

  // Convert both times into minutes
  const minutes1 = h1 * 60 + m1;
  const minutes2 = h2 * 60 + m2;

  // Difference in minutes
  const diffMinutes = minutes2 - minutes1;

  // Convert to hours (can be fractional)
  return Number((diffMinutes / 60).toFixed(2))

}

function generateOtp() {
  const nanoidd= customAlphabet("ABCDEFGHI",4)
  const otp = nanoidd()
  return otp
}
const createRide = async(req ,res) => {
  const nanoidd=customAlphabet("123456789ABCDEFGHIJKLMNPQRSTUVWXYZ",6)
  const {BikeOwnerId}=req.body
  const user = await User.findById(req.user.id)
  const BikeOwner = await User.findOne({uniqueId:BikeOwnerId})
  const BikeDetails = await hasBike.findOne({uniqueId:BikeOwnerId})
  let socketId=BikeOwner.socketId
  console.log(socketId)

  const ride = await Rides.create({
    UserId:user.uniqueId,
    BikeOwnerId:BikeOwnerId,
    rideId:nanoidd(),
    perHrFee:BikeDetails.perHrFee
  })
  
  sendMesssageToSocketId(socketId,{
    event:"request-bike",
    data:{
      username:user.fullname,
      userId:user.uniqueId,
      rideId:ride.rideId
    }
  })

  return res.status(201)
  .json({
    flag:true,
    message:"ride created "
  })
}

const acceptRide = async(req, res) => {
  const{userUniqueId,rideId} = req.body
  
  const user = await User.findOne({uniqueId:userUniqueId})
  const ride = await Rides.findOne({ UserId: userUniqueId, rideAccepted: false,rideId:rideId , isBikeOnRide:false })
  const BikeOwnerId=ride.BikeOwnerId
  const bikeOwner = await User.findOne({uniqueId:BikeOwnerId})
  let socketId = user.socketId
  let BikeOwnerSocketId= bikeOwner.socketId
  const otp = generateOtp()
  sendMesssageToSocketId(socketId,{
    event:"ride-accepted",
    data:{
      otp:otp,
      message:"Tell this OTP to Pickup Bike",
      owner:bikeOwner.fullname
    }
  })
  ride.rideOtp=otp
  await ride.save()
  sendMesssageToSocketId(BikeOwnerSocketId,{
    event:"send-res-to-owner",
    data:{
      message:"Enter OTP to start ride",
      user:user.fullname,
      userdetails:user
    }
  })
  return res.status(200)
  .json({
    flag:true,
    message:"ride accepted succesfully"
  })
}

const declineRide = async(req ,res) => {
  const{rideId,userUniqueId}=req.body
  const user = await User.findOne({uniqueId:userUniqueId})
  const ride = await Rides.findOneAndDelete({rideId:rideId})
  console.log(ride)

  if(!ride){
    return res.status(404)
    .json({
      flag:false
    })
  }
  return res.status(200)
  .json({
    flag:true
  })
}
const confirmRide = async(req ,res )=> {
  const{userUniqueId,rideId,otp} = req.body
  console.log(userUniqueId,rideId,otp)
  const now = new Date();
  const user= await User.findOne({uniqueId:userUniqueId})
  const ride = await Rides.findOne({ UserId: userUniqueId, rideAccepted: false,rideId:rideId })
  const bikeOwner = await User.findOne({uniqueId:ride.BikeOwnerId})
  if(otp.toUpperCase() === ride.rideOtp){
    const timeHM = now.toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit" });
    console.log(timeHM); // e.g. "17:47"
    ride.rideStatus="ongoing"
    ride.rideAccepted=true
    ride.ridePickupTime=timeHM
    ride.isBikeOnRide=true,
    ride.voyagerName=user.fullname
    ride.hostName=bikeOwner.fullname
    bikeOwner.isBikeOnRide=true
    await ride.save()
    await bikeOwner.save()
    await User.updateOne(
      { uniqueId: userUniqueId },
      { $addToSet: { rideIds: rideId } }
    );

    await User.updateOne(
    { uniqueId: bikeOwner.uniqueId },
    { $addToSet: { rideIds: rideId } }
  );


  }else{
    return res.status(400)
    .json({
      flag:false,
      message:"ENTERED WRONG OTP"
    })
  }
  sendMesssageToSocketId(user.socketId,{
    event:"send-to-user-rideconfirmed",
    data:{
      message:"ride confirmed",
      bikeOwner:bikeOwner,
      user:user,
      flag:true
    }
  })

  sendMesssageToSocketId(bikeOwner.socketId,{
    event:"send-to-owner-rideconfirmed",
    data:{
      message:"ride confirmed hand over your bike and wait for your earnings",
      ownerflag:true,
      user:user,
      bikeOwner:bikeOwner
    }
  })
  return res.status(200)
  .json({
    flag:true,
    message:"ride Confirmed succesfully",
    ride:ride
  })
}
const completeRide = async(req ,res) => {
  const{userUniqueId,rideId} = req.body
  const now = new Date();
  const ride = await Rides.findOne({ UserId: userUniqueId, rideAccepted: true, rideId:rideId })
  const bikeOwner = await User.findOne({uniqueId:ride.BikeOwnerId})
  const user = await User.findOne({uniqueId:userUniqueId})
  const currentTime = now.toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit" })
  const AcceptedTime = ride.ridePickupTime
  const hrDiff= getHourDifference(AcceptedTime,currentTime)
  ride.rideCompletedTime=currentTime
  ride.rideStatus="completed"
  ride.isBikeOnRide=false,
  ride.voyagerName=user.fullname
  ride.hostName=bikeOwner.fullname
  ride.rideFee = hrDiff * ride.perHrFee
  await ride.save()
  bikeOwner.isBikeOnRide=false
  await bikeOwner.save()
  
  const perHrFee=ride.perHrFee
  let userEarnings=user.totalEarnings
  user.totalEarnings=userEarnings+(hrDiff*perHrFee)
  await user.save()
  sendMesssageToSocketId(user.socketId,{
    event:"ride-complete-to-user",
    data:{
      flag:true,
      message:"ride completed",
      hrDiff:hrDiff,
      Fare:hrDiff*perHrFee
    }
  })
  return res.status(200)
  .json({
    flag:true,
    message:"ride completed",
    hrDiff:hrDiff,
    Fare:hrDiff*perHrFee
  })
}

const getRides = async(req, res) => {
  const user = await User.findById(req.user._id)
  let ridesHistory=[]
  for (const rideId of user.rideIds){
    const ride = await Rides.findOne({rideId:rideId})
    ridesHistory.push(ride)
  }
  if(ridesHistory.length === 0){
    return res.status(200)
    .json({message:"No Voyages Yet"})
  }
  return res.status(200)
  .json({
    rides:ridesHistory
  })
}   

export {createRide,acceptRide ,completeRide,declineRide,confirmRide,getRides}