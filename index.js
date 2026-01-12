import { app } from "./app.js";
import dotenv from "dotenv";
import { connectDb } from "./src/config/db.js";
import http from "http";
import { Server } from "socket.io";
import { User } from "./src/models/user.model.js";

dotenv.config({ path: "./env" });

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials:true 
  },
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("send-location", (data) => {
    io.emit("receiver-location", { id: socket.id, ...data });
  });
  socket.on("join",async(data) => {
    console.log(data)
    
    await User.findByIdAndUpdate(data.id,{socketId:socket.id,lat:data.latitude,long:data.longitude})
    const users = await User.find({isOnline:true})
    const NoBikeUsers = await User.find({hasBike:false})
    io.emit("recive-locations",users)
    io.emit("no-bike-users",NoBikeUsers)
  })
  socket.on("update-location",async (data) => {
    const user = await User.findById(data.id)
   
    user.lat=data.lat,
    user.long=data.long
    user.socketId=socket.id
    await user.save()
    
  })
  socket.on("disconnect", async() => {
    console.log("disscounnected",socket.id)
    const user = await User.findOne({socketId:socket.id})
    if(user){
      user.lat=null
      user.long=null
      user.isOnline=false
      user.socketId=null
      await user.save()
    }
    io.emit("user-disconnected", socket.id);
    const users= await User.find({isOnline:true})
    io.emit("recive-locations",users)
    const NoBikeUsers = await User.find({hasBike:false})
    io.emit("no-bike-users",NoBikeUsers)
  });
});

const sendMesssageToSocketId = (socketId,obj) => {
  if(io){
    console.log(obj)
    io.to(socketId).emit(obj.event,obj.data)
  }else{
    console.log("io not initalized")
  }
}
export {sendMesssageToSocketId}



connectDb()
  .then(() => {
    server.listen(process.env.PORT, () => {
      console.log(`Server running at port ${process.env.PORT}`);
    });
  })
  .catch(() => console.log("error"));

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/test", (req, res) => {
  res.json("testing ....");
});
