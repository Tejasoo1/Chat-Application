const Mongoose = require("mongoose");

/*
1] _id ---> id of the sender
   content ---> actual written message(data)
   chat  ---> Reference to the chat, to which it belongs to.


*/

const MessageSchema = new Mongoose.Schema(
  {
    sender: {
      type: Mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    content: {
      type: String,
      trim: true,
    },
    imgUrl: {
      type: String,
      // trim: true,
      default: "",
    },
    chat: {
      type: Mongoose.Schema.Types.ObjectId,
      ref: "chats",
    },
  },
  {
    timestamps: true,
  }
);

const MessageModel = Mongoose.model("messages", MessageSchema);

module.exports = MessageModel;
