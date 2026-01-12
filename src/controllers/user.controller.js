import { User } from "../models/user.model.js";
import { hasBike } from "../models/hasBike.model.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { customAlphabet, nanoid } from "nanoid";

const createUser = async(req , res) => {
  const {fullname,email,password,phno} = req.body
  if(!email){
    return res.status(400)
    .json({
      flag:false,
      message:"email is required"
    })
  }
  if(!fullname){
    return res.status(400)
    .json({
      flag:false,
      message:"name is required"
    })
  }
  if(!password){
    return res.status(400)
      .json({
        flag:false,
        message:"password is required"
      })
  } 
  if(!phno){
    return res.status(400)
    .json({
      flag:false,
      message:"phone no is required"
    })
  }

  const existingUser = await User.findOne({email:email})

  if(existingUser){
    return res.status(400)
    .json({
      flag:false,
      message:"User already exists please login"
    })
  }
  const hashPass = await bcrypt.hash(password,10)
  const nanoidd = customAlphabet("123456789ABCDEFGHIJKLMNPQRSTUVWXYZ",7)
  const generateUniqueId = nanoidd()
  await User.create({
    fullname,
    email,
    password:hashPass,
    phno,
    uniqueId:generateUniqueId,
    lat:null,
    long:null
  })

  return res.status(201)
  .json({
    flag:true,
    message:"user Created Succesfully"
  })
}
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        flag: false,
        message: "User not found"
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        flag: false,
        message: "Passwords didn't match"
      });
    }

    // Generate JWT
    const accessToken = jwt.sign(
      { id: user._id, email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "24h" }
    );

    // Send cookie + response
    res
      .status(200)
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure:true,
        sameSite: "none"
      })
      .json({
        message: "User logged in successfully",   
        flag: true
      });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      flag: false,
      message: "Server error"
    });
  }
};

const logout = async(req ,res)=> {
  res
      .clearCookie("accessToken", {
        httpOnly: true,
        secure: true, 
        sameSite: "none",
      })
      .status(200)
      .json({ message: "Logged out successfully" });
}

const getCurrentUser = async(req,res) => {
  const user = await User.findById(req.user._id)
  if(!user){
    return res.status(404)
    .json({
      flag:false,
      hasBike:false,
      message:"No user logged IN"
    })
  }
  console.log(user)
  return res.status(200)
  .json({
    flag:true,
    hasBike:user.hasBike,
    bikeName:user.bikeName,
    user:user
  })
}

const registerBike = async(req , res) => {
  const{bikeName,bikeNo,perHrFee} = req.body
  const user = await User.findById(req.user._id)
  if(!user){
    return res.status(404)
    .json({
      flag:false,
      message:"user Not found"
    })
  }

  const uniqueId = user.uniqueId
  
  const existingUserHavingBike = await hasBike.findOne({uniqueId:uniqueId})

  if(existingUserHavingBike){
    return res.status(400)
    .json({
      flag:false,
      message:"You can't register again"
    })
  }

  const createHasBike= await hasBike.create({
    uniqueId:uniqueId,
    bikeName:bikeName,
    bikeNo:bikeNo,
    perHrFee:perHrFee
  })
  if(createHasBike){
    user.hasBike=true
    user.bikeName=bikeName,
    user.bikeNo=bikeNo,
    user.perHrFee=perHrFee
    user.save()
  }
  return res.status(201)
  .json({
    flag:true,
    message:"Bike Registered succcesfully"
  })
}


const toggleOnline = async(req ,res) => {
  const user = await User.findById(req.user._id)
  if(!user.hasBike){
    return res.status(400)
    .json({
      flag:false,
      message:"Need to do Bike regsitration to access this feature"
    })
  }
  if(user.isOnline){
    user.isOnline=false
    await user.save()
    return res.status(200)
    .json({flag:false})
  }
  user.isOnline=true
  await user.save()
  return res.status(200)
  .json({
    flag:true
  })
}
const implicitToggleOnline = async(req ,res) => {
  const user = await User.findById(req.user._id)

  const uniqueId = user.uniqueId

  const updateUserOnlyWithBike = await User.findOneAndUpdate({uniqueId:uniqueId,hasBike:true},{isOnline:true})
  if(!updateUserOnlyWithBike){
    return res.status(404).json({flag:false})
  }
  return res.status(200).json({
    flag:true,
    user:updateUserOnlyWithBike
  })
}

const UserDetails = async(req ,res) => {
  const user = await User.findById(req.user._id)

  return res.status(200)
  .json({
    fullname:user.fullname,
    email:user.email,
    phno:user.phno,
    uniqueId:user.uniqueId
  })
}
export {
  createUser,login,registerBike,logout,toggleOnline,getCurrentUser,UserDetails,implicitToggleOnline
}