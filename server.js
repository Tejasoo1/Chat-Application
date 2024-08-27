const Express = require("express");
const app = Express();

// Middleware to parse JSON bodies with a limit of 10MB
app.use(Express.json({ limit: "10mb" }));

// Middleware to parse URL-encoded bodies with a limit of 10MB
app.use(Express.urlencoded({ limit: "10mb", extended: true }));

/*
 1] npm i dotenv. 

^ 'dotenv.config();' :-
  1] This line calls the 'config()' function from the 'dotenv' package. This function reads the '.env' file 
     (typically located in the root of the project) and loads its 'key-value pairs' as environment variables. 
   
  2] These variables are then accessible globally in the application via 'process.env'.

^ 'const PORT = process.env.PORT || 5000;' :-
  1] This line sets the 'PORT' variable to the value of the environment variable 'PORT'. If process.env.PORT is 
     undefined (i.e., the PORT variable is not set in the .env file or environment), 
     it will default to 5000. 
  
  2] This is useful for ensuring the server can run on a specified port, or fallback to a default port if 
     one isn't provided.

~  Q. Why Use '.env' Files?    
 --> 1] They allow you to keep sensitive information, such as 'API keys' or 'configuration' values (like PORT), 
        out of your codebase. 

     2] They enable environment-specific settings for development, testing, or production environments without
        hardcoding them into the application.   

**************************************************************************************************
^ MongoDB Atlas ClusterChat:-
  

*/
const { chats } = require("./data/serverData");
const dotenv = require("dotenv");
dotenv.config();

const CORS = require("cors");
app.use(
  CORS({
    origin: "http://localhost:5173", // Specify the exact origin of your frontend
    credentials: true,
  })
);

const connectDB = require("./config/db");
connectDB();

const CookieParser = require("cookie-parser");
app.use(CookieParser());

/*
^ app.use("/api/user", userRoutes);

  app.use(): This method tells Express to use some 'middleware' or 'router' on a specific path. 
             Here, 'app.use("/api/user", userRoutes);' is setting up a route handler for any 
             requests that start with '/api/user'.

  "/api/user": This is the 'base' path for any routes defined in 'userRoutes'. So, any route inside
               userRoutes will be prefixed with '/api/user'.

  'userRoutes': This is the router you imported from another file (in this case, from userRoutes.js).


*/

const { notFound, errorHandler } = require("./middleware/errorMiddleware");
//Routes
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

//Endpoints
// Use the imported 'router' on the "/api/user" path
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/notification", notificationRoutes);

//Adding, two error handling middlewares.
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(5000, () => {
  console.log(
    `Express application is running on port no. ${PORT}, in local server.`
  );
});

//Socket.io (SERVER SIDE)
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:5173", // Specify the exact origin of your frontend
    methods: ["GET", "POST"],
    credentials: true,
  },
});

//Track Online Users: Maintain a 'Set' of online users on the server.
const onlineUsers = new Set();

const userSocketMap = new Map(); // Map to store user._id to socket.id mapping

io.on("connection", (socket) => {
  console.log(` User connected to socket.io: ${socket.id}`);
  /*
    1] Here, we are creating a new socket, where front-end will send some data & will 
       join one room.

    2] We are going to create a new room with the ID of the userData. 
       And that room will be exclusive to that particular user only.

    3] socket.join(userData._id); ===> So this has created a room for that particular user
                                       who is logged in.   
  
  */

  // When a user logs in
  socket.on("setup", (userData) => {
    onlineUsers.add(userData._id); // Add user to online list
    // Store the mapping of user._id to socket.id
    userSocketMap.set(socket.id, userData._id);
    socket.join(userData._id);
    console.log(userData._id);
    socket.emit("connected");

    // Notify all clients of the new online user
    socket.broadcast.emit("user online", userData._id);

    // Send the full list of online users to the newly connected user
    socket.emit("all users", Array.from(onlineUsers));
  });

  /*
      When we click on any of the chat, the below code should create a 'new room' with that particular 
      user who has clicked on it & the other user who joins that same chat should also be added as well 
      inside the same chat room.
  
  */
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User joined Room " + room);
  });

  // Leaving a room
  socket.on("leaveRoom", (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.id} left room ${chatId}`);
  });

  socket.on("new message", (newMessageReceived) => {
    console.log("new message socket listener");
    /*
     Q> To which 'chat' does it(the sent message) belong to ? 
     --> Because then i can send that particular message to the room created for that particular chat.
      
     1] If we are a user & we are sending the message inside of a chat group,then except for us, we want 
        that message to be emmited to all of the other users of that chat group.

     2] Suppose there are 5 users in a group chat(and the room associated with it),including me(sender),
        & if i am sending the message, so that message should be received only by the other 4 users of 
        that group chat(room) & not by me.    
    */

    let chat = newMessageReceived.chat;

    if (!chat.users.length) return console.log("chat.users is empty");

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;
      // console.log({ newMessageReceived });
      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  // Handle user disconnection (When a user disconnects)
  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.id);
    const userId = userSocketMap.get(socket.id);

    onlineUsers.delete(userId); // Remove 'user' from online list

    // Notify others that this user is offline
    socket.broadcast.emit("user offline", userId);
  });
});
