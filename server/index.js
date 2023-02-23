const express = require("express");
const cors = require('cors');
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const app = express();
const http = require("http");
const socket = require("socket.io");
const koa = require("koa");

const allowedOrigins = ['http://localhost:3000', 'http://localhost:5000'];

var whitelist = ['http://localhost:3000','http://localhost:5000']

// PORT configuration
const PORT = process.env.PORT || 5000;

// IP configuration
const IP = process.env.IP || 5000;



require("dotenv").config();

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));
app.use(express.json());



mongoose
  .connect(process.env.ATLAS_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connetion Successfull");
  })
  .catch((err) => {
    console.log(err.message);
  });

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);



// const server = app.listen(process.env.PORT,   () =>
//   console.log(`Server started on ${process.env.PORT}`)
// );

const server = app.listen(PORT, IP, ()  => {
  console.log(`The Server is running at: http://localhost:${PORT}`);
});








const io = socket(server, {
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});
