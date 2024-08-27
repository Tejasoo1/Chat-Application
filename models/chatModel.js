const Mongoose = require("mongoose");

// chatName ---> string
// users ---> an array of user objects.
// isGroupChat ---> true or false
// groupAdmin --> is an object
// latestMessage

/*
 trim: true ---> So that there are no trailing or leading spaces in that string.
 default: false ---> default value of this field should be false. 

 1] If a new chat(document) is added inside 'chats' collection, then a time_stamp will be added by 
    mongoose.
  
   {
     timestamps: true,  --> If we specify this
   }

*/

/*
~ Understanding ChatSchema:-
  The 'ChatSchema' is a Mongoose schema that defines the structure of a document in a MongoDB collection, 
  which in this case represents a chat or conversation.

^ chatName: 
  This is a string representing the name of the chat. The 'trim: true' option ensures that any leading
  or trailing whitespace is removed.

^ isGroupChat: 
   This is a boolean that indicates whether the chat is a group chat ('true') or a one-on-one chat ('false'). 
   The default value is 'false', meaning by default it's not a group chat.

^ users: 
  This is an array of 'ObjectIds' that reference 'users' involved in the chat. Each 'ObjectId' points 
  to a document in the 'UserModel' collection.

^ latestMessage: 
  This field stores the 'ObjectId' of the most recent message in the chat, referencing a document in 
  the 'MessageModel' collection.

^ groupAdmin: 
  If the chat is a group chat, this field stores the 'ObjectId' of the user who is the group admin, 
  also referencing a document in the 'UserModel' collection.

^ timestamps: true: 
  This option automatically adds 'createdAt' and 'updatedAt' fields to the schema, which Mongoose manages. 
 

*/

//Schema for Chat.
const ChatSchema = new Mongoose.Schema(
  {
    chatName: {
      type: String,
      trim: true,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    users: [
      {
        type: Mongoose.Schema.Types.ObjectId,
        // It belongs to the 'User' Schema.
        ref: "users",
      },
    ],
    latestMessage: {
      type: Mongoose.Schema.Types.ObjectId,
      ref: "messages",
    },

    groupAdmin: {
      type: Mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
  },
  {
    timestamps: true,
  }
);

//Creating 'chats' collection.
const ChatModel = Mongoose.model("chats", ChatSchema);

module.exports = ChatModel;

/*
 Q. How to establish the connection between 2 Schemas ?
-->  1] To 'ref' variable you should tell to which Schema you want to get connected to.
         
        ref: "users",
                |
                |--> I want to get connected to 'users' collection.
                     i.e. in 'users' collection whatever the documents/users you have, those
                          documents/users, you are connecting them to PostSchema.   

     2] In 'User' Schema you want to get connected to which field ?
     -->  _id field.

         type: Mongoose.Schema.Types.ObjectId
                      |             |
                      |             |
                      |             |--> What is the 'type' of the 'field' to which you need to get connected to.
                      |
                      |---> will refer to User Schema.
                      
         i.e. _id is of ObjectId type.             

*/
