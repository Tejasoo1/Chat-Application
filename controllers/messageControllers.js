const ChatModel = require("../models/chatModel");
const MessageModel = require("../models/messageModel");
const UserModel = require("../models/userModel");

const sendMessage = async (req, res) => {
  /* 
    1] chatId:- On which 'chat' we are suppose, to send the message.
    2] content:- Actual message(string)
    3] senderId:- who is the sender of the message.

     Whenever we send a message, that message is going to be the latest message. 
     When the next message comes, it's going to replace the previous latest message. 
  */

  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into the request");
    return res.status(400).send("Invalid data passed into the request");
  }

  // let MessageData = new MessageModel({
  //   sender: req.user._id,
  //   content,
  //   chat: chatId,
  // });

  try {
    let message = new MessageModel({
      sender: req.user._id,
      content,
      chat: chatId,
    });

    // Save the message and populate the sender and chat fields
    message = await message.save();
    message = await message.populate("sender", "name pic email");
    message = await message.populate("chat");
    message = await UserModel.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    console.log(message);

    /*
    ~ Nested Population:
     Ex:- .populate({ 
              path: "latestMessage", 
              populate: { path: "sender", select: "name pic email" } 
           });

     The path: "latestMessage" part populates the 'latestMessage' field.
     The populate: { path: "sender", select: "name pic email" } part:
      Further populates the 'sender' field within the 'latestMessage', selecting only the 'name', 'pic', 
      and 'email' fields.
    
    
    */

    // Update the latest message in the chat
    let updatedChatDoc = await ChatModel.findByIdAndUpdate(
      chatId,
      {
        latestMessage: message._id,
      },
      { new: true }
    )
      .populate("users", "-password")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "-password", // Only select necessary fields
        },
      })
      .populate("groupAdmin", "-password");

    // res.status(200).send(message);
    // Send both the updated chat document and the message as the response
    res.status(200).send({
      message,
      updatedChat: updatedChatDoc,
    });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).send("Internal server error(Message could not be created)");
  }
};

const allMessages = async (req, res) => {
  //Fetching all of the messages for a particular chat.
  try {
    let messages = await MessageModel.find({
      chat: req.params.chatId,
    })
      .populate("sender", "name pic email")
      .populate({
        path: "chat",
        populate: {
          path: "users",
          select: "-password",
        },
      });

    res.status(200).send(messages);
  } catch (err) {
    console.log(err.message);
    res
      .status(500)
      .send("Internal Server Error, Messages could not be fetched !!!");
  }
};

const sendImageMessage = async (req, res) => {
  const { content, chatId, imageURL } = req.body;
  console.log("sendImageMessage");

  console.log(content, chatId, imageURL);

  try {
    let message = new MessageModel({
      sender: req.user._id,
      content,
      imgUrl: imageURL,
      chat: chatId,
    });

    console.log({ message });

    // Save the message and populate the sender and chat fields
    message = await message.save();
    console.log("message saved image");

    message = await message.populate("sender", "name pic email");
    message = await message.populate("chat");
    message = await UserModel.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    //Update the associated chat document to reflect the latest message field.
    let updatedChatDoc = await ChatModel.findByIdAndUpdate(
      chatId,
      {
        latestMessage: message._id,
      },
      { new: true }
    );

    console.log("Associated chat doc updated successfully");

    res.status(200).send(message);
  } catch (err) {
    console.log("error occured");
    console.log(err);
    res
      .status(500)
      .send("Internal Server Error !!(Failed to upload the image)");
  }
};

module.exports = { sendMessage, allMessages, sendImageMessage };

/*
try {
    let message = new MessageModel({
      sender: req.user._id,
      content,
      chat: chatId,
    });

    // Save the message and populate the sender and chat fields
    message = await message.save();
    message = await message.populate("sender", "name pic email").execPopulate();
    message = await message.populate("chat").execPopulate();
    message = await UserModel.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    // Update the latest message in the chat
    await ChatModel.findByIdAndUpdate(chatId, {
      latestMessage: message._id,
    });

    res.status(200).send(message);
  } catch (err) {
    console.error("Error sending message:", err);
    res
      .status(500)
      .send("Internal server error(Message could not be created)");
  }


*************************************************************************************************************
 MessageData.save()
    .then(async (doc) => {
      console.log(doc);
      doc = await doc.populate("sender", "-password");

      doc = await doc.populate("chat");

      doc = await UserModel.populate(doc, {
        path: "chat.users",
        select: "-password",
      });

      console.log(doc);

      return doc; // Return the populated document
    })
    .then(async (populatedDoc) => {
      let updatedChatDoc = await ChatModel.findByIdAndUpdate(req.body.chatId, {
        latestMessage: populatedDoc._id,
      });

      res.status(200).send(populatedDoc);
    })
    .catch((err) => {
      res
        .status(500)
        .send("Internal server error(Message could not be Created)");
    });



*/
