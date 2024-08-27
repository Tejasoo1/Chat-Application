/*
^  If the 'latestMessage' field is not explicitly set when a chat document is created, and it doesn't have 
^  a default value in the ChatSchema, here’s what will happen:

! 1] Creation of the Chat Document:
    When you create a new chat document (e.g., when you create a new group), the 'latestMessage' field will 
    simply be absent from the document if you do not set it and it doesn't have a default value.

~  This means the field is not stored in the document at all.

*  Example of the chat document after creation:
  {
    "_id": "chatId123",
    "chatName": "Chat Name",
    "isGroupChat": true,
    "users": ["userId1", "userId2"],
    "groupAdmin": "userId1"
    // Note: latestMessage is absent here.
  }

! 2] Behavior of .populate("latestMessage"):
    If you attempt to populate the 'latestMessage' field using '.populate("latestMessage")' when it doesn't 
    exist in the document:

~   Mongoose will not throw an error.
&   The resulting document will simply not include the 'latestMessage' field in the 'populated' output.

*   Example after population:

    {
      "_id": "chatId123",
      "chatName": "Chat Name",
      "isGroupChat": true,
      "users": [
        { "_id": "userId1", "name": "User One", "pic": "user1.jpg" },
        { "_id": "userId2", "name": "User Two", "pic": "user2.jpg" }
      ],
      "groupAdmin": { "_id": "userId1", "name": "User One", "pic": "adminPic.jpg" }
      // latestMessage is still absent
    }

! 3] After a Message is Sent:
    Once a message is sent and the 'latestMessage' field is updated, that field will be added to the 
    document.
    If you populate after this update, Mongoose will correctly populate the 'latestMessage' field with 
    the corresponding message document.

*/

const Express = require("express");
const ChatModel = require("../models/chatModel");
const UserModel = require("../models/userModel");
const MessageModel = require("../models/messageModel");
const app = Express();

const accessChat = async (req, res) => {
  /*
   1] This func. is going to be responsible for creating or fetching a 1 on 1 chat doc.
   2] We are going to take the 'userId' with which we are going to create a chat document,
      (So 'current user' whoever is logged in, is going to send us the 'userId' of other user with
       whom he wants to chat).
   3] Now, if a chat doc, with this 'userId' exists then return it, but if it doesn't exist
      then create a chat doc with this 'userId'.  
  */
  const { userId } = req.body;

  if (!userId) {
    res.status(400).send("userId param not sent with the request.");
    return;
  }

  //if the chat doc exists with this userId or not.

  let isChatExist = await ChatModel.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  /*
     Inside of the MessageModel, we have 'sender' field, so we have to populate that field as well.
  */

  isChatExist = await UserModel.populate(isChatExist, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  console.log({ isChatExist });

  if (isChatExist.length > 0) {
    //return the existing chat
    res.status(201).send(isChatExist[0]);
  } else {
    //Create a one-on-one chat document.

    const ChatData = new ChatModel({
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    });

    ChatData.save()
      .then((doc) => {
        console.log(doc);
        return doc.populate("users", "-password");
      })
      .then((populatedDoc) => {
        console.log(populatedDoc);
        res.status(200).send(populatedDoc);
      })
      .catch((err) => {
        res.status(500).send("Chat could not be created !!");
      });
  }
};

const fetchChats = async (req, res) => {
  /*  Sort all the chat docs, from new to old */
  ChatModel.find({ users: { $elemMatch: { $eq: req.user._id } } })
    .populate("users", "-password")
    .populate("latestMessage")
    .populate("groupAdmin", "-password")
    .sort({ updatedAt: -1 })
    .then(async (docs) => {
      docs = await UserModel.populate(docs, {
        path: "latestMessage.sender",
        select: "name pic email",
      });

      res.status(200).send(docs);
    })
    .catch((err) => {
      res.status(500).send("internal server error !!");
    });
};

const createGroupChat = async (req, res) => {
  /*
    1] We will receive the group's 'chatName' & an array of user(objs) that we want to
       add in this groupChat.

  */

  if (!req.body?.users && !req.body.name) {
    res.status(400).send("Please fill all the fields !!!");
    return;
  }

  //Data(users' array) is going to come in a Stringify format.
  let users = JSON.parse(req.body.users);

  if (users.length < 2) {
    res.status(400).send("More than 2 users are required for a group chat.");
    return;
  }

  users.push(req.user._id); //current 'user' that is logged-in

  const ChatData = new ChatModel({
    chatName: req.body.name,
    isGroupChat: true,
    users,
    groupAdmin: req.user._id,
  });

  ChatData.save()
    .then(async (doc) => {
      // First populate users
      await doc.populate("users", "-password");

      // Then populate groupAdmin
      await doc.populate("groupAdmin", "-password");

      return doc; // Return the populated document
    })
    .then((populatedDoc) => {
      console.log(populatedDoc);
      res.status(200).send(populatedDoc);
    })
    .catch((err) => {
      console.error(err); // Logging the error for debugging
      res.status(500).send("Internal Server Error !!");
    });
};

const renameGroupChat = async (req, res) => {
  const { chatId, chatName } = req.body;

  /*
    1] The '{ new: true }' option is required if you want the 'findByIdAndUpdate' method to return the 
       'updated' document instead of the 'original' one.   
  
  */

  const UpdatedChatGroup = await ChatModel.findByIdAndUpdate(
    chatId,
    { chatName },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("latestMessage");

  if (!UpdatedChatGroup) {
    res.status(404).send("Chat Not Found");
  } else {
    res.status(200).json(UpdatedChatGroup);
  }
};

const addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  const UpdatedGroupChat = await ChatModel.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("latestMessage");

  if (!UpdatedGroupChat) {
    res.status(404).send("Chat Not Found");
  } else {
    res.status(200).json(UpdatedGroupChat);
  }
};

const removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  const UpdatedGroupChat = await ChatModel.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("latestMessage");

  if (!UpdatedGroupChat) {
    res.status(404).send("Chat Not Found");
  } else {
    res.status(200).json(UpdatedGroupChat);
  }
};

/*
~ findByIdAndDelete(chatId): 
  1] This method searches for a document by its '_id' and deletes it from the database.
  2] If the document is found and successfully deleted, it returns the deleted document; otherwise, 
     it returns null.


*/

const deleteGroup = async (req, res) => {
  const { chatId } = req.body;

  const deletedDoc = await ChatModel.findByIdAndDelete(chatId);

  if (deletedDoc !== null) {
    // Deleting all messages where the 'chat' field matches the provided chatId
    const result = await MessageModel.deleteMany({ chat: chatId });
    res.status(200).send(deletedDoc);
  } else {
    res.status(500).send("Group Could not be deleted");
  }
};

const deleteAChat = async (req, res) => {
  const { chatId } = req.body;

  try {
    const deletedChatDoc = await ChatModel.findByIdAndDelete(chatId);

    if (deletedChatDoc !== null) {
      // Deleting all messages where the 'chat' field matches the provided chatId
      const result = await MessageModel.deleteMany({ chat: chatId });

      // Sending a success response with the count of deleted documents
      res.status(200).json({
        message: "Messages deleted",
        deletedCount: result.deletedCount,
        deletedChatDoc,
      });
    }
  } catch (err) {
    res
      .status(500)
      .send("Internal Server Error, Could not delete the requested Chat");
  }
};

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroupChat,
  addToGroup,
  removeFromGroup,
  deleteGroup,
  deleteAChat,
};

/*
~ Explanation:
  
^ ChatData.save(): 
  This saves the new chat document to the database and returns a promise that resolves with the 
  saved document.
 
^ doc.populate("users", "-password").execPopulate(): 
  After saving the document, 'populate()' is used to populate the 'users' field, excluding the 'password' 
  field. 
  
^ execPopulate(): 
  Is necessary because 'populate()' returns a promise when used on a 'document', and 'execPopulate()'
  ensures that the promise is properly handled.

^ Chaining then(): 
  The second 'then()' is used to handle the populated document and send it in the response.

~ Why Use execPopulate():
? .populate() vs. .execPopulate(): 
   When populating fields on a document that has already been saved, 'execPopulate()' is required to 
   execute the population and return a promise. 
   
   This ensures that the next 'then()' block receives the fully populated document.

! IMP points:-
 1] Since 'populate' returns a 'promise' when combined with 'execPopulate()', you can chain it with 
    another '.then()' to ensure the document is fully populated before sending it in the response.

 2] The 'save()' method returns a 'promise', and you can only call 'populate' on a document or query, not 
    directly on the 'promise' returned by 'save()'. 

 ***********************************************************************************************************


*/

/*
~ Filtering Non-Group Chats:
  The query filters the 'ChatModel' collection to find chats where 'isGroupChat' is 'false', meaning 
  one-on-one chats.

^ Finding Specific Users in Chat:
  The '$and' operator ensures that both users (the current user and another specified user) are part 
  of the chat.

  $elemMatch: { $eq: req.user._id } checks if the users array contains the current user's ObjectId.
  $elemMatch: { $eq: userId } checks if the users array contains the other user's ObjectId (userId).

^ Population:
  .populate("users", "-password"): Populates the users array with the full user documents from UserModel, 
                                   excluding their passwords.
                                   
  .populate("latestMessage"): Populates the latestMessage field with the full message document from 
                              MessageModel.

? Nested Population:
  The 'latestMessage' field contains a reference to a message. Inside the 'MessageModel', the 'sender'
  field is a reference to a user.

  The code further populates the 'sender' field within the 'latestMessage' document to include the
  'username', 'pic', and 'email' fields from the 'UserModel'.

************************************************************************************************************
     isChatExist = await UserModel.populate(isChatExist, {
       path: "latestMessage.sender",
       select: "username pic email",
     });

~ Explanation:-
^  UserModel.populate(): 
   This specifically populates the 'sender' field inside the 'latestMessage' object of the 
   'isChatExist' document(s). 
   
   Normally, 'populate()' is called on the model that you're querying, but here it’s being used 
   directly on the result (isChatExist).

^ path: "latestMessage.sender":
  path: This specifies the field(s) you want to populate.
  "latestMessage.sender": This path tells Mongoose that within each 'chat' document, you should go into the 
                         'latestMessage' field, and within that, populate the 'sender' field.

^ select: "username pic email":
  This specifies which fields of the 'UserModel' you want to include in the populated 'sender' field. 
  Instead of getting the entire 'user' document (which might be large and contain sensitive information 
  like passwords), you’re only selecting the 'username', 'pic', and 'email' fields.

*********************************************************************************************************
? .sort({ updatedAt: -1 }):-
  This sorts the found chats by their 'updatedAt' field in 'descending' order, meaning the most recently 
  updated chats come first.

  Example: 
  If there are two chats, one updated on '2024-08-19' and another on '2024-08-20', the chat updated 
  on '2024-08-20' will appear first.

 { updatedAt: -1 } tells MongoDB to sort the documents by the 'updatedAt' field in descending order 
                  ('-1' indicates descending order).

? Descending Order: 
  In 'descending' order, the documents with the most recent 'updatedA't values (i.e., the ones updated last)
  appear first in the results.

  Example:
  Suppose you have three chat documents with the following updatedAt values:
  Chat 1: 2024-08-19T12:00:00Z
  Chat 2: 2024-08-20T09:30:00Z
  Chat 3: 2024-08-18T16:45:00Z

  When sorted using .sort({ updatedAt: -1 }), the order of the documents returned by the query will be:
  Chat 2 (2024-08-20T09:30:00Z)
  Chat 1 (2024-08-19T12:00:00Z)
  Chat 3 (2024-08-18T16:45:00Z)

^ The 'updatedAt' field stores both the 'date' and 'time', and when you sort by 'updatedAt'
^ in 'descending' order (-1), it naturally sorts by the latest date first and then by the latest 
^ time on that date. 

  Example:
  Assume you have the following 'updatedAt' values for your chats:
  Chat A: 2024-08-21T14:30:00Z
  Chat B: 2024-08-21T09:15:00Z
  Chat C: 2024-08-20T17:45:00Z

  When you apply .sort({ updatedAt: -1 }), the sorted order will be:
  Chat A: 2024-08-21T14:30:00Z (latest date and time)
  Chat B: 2024-08-21T09:15:00Z (same date as A but earlier time)
  Chat C: 2024-08-20T17:45:00Z (earlier date)


*/
