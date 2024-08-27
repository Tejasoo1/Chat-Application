const Express = require("express");
const VerifyToken = require("../middleware/authMiddleware");
const {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroupChat,
  addToGroup,
  removeFromGroup,
  deleteGroup,
  deleteAChat,
} = require("../controllers/chatControllers");

// const app = Express();
// app.use(Express.urlencoded());

const router = Express.Router();
router.use(Express.json());
router.use(Express.urlencoded());

//Only authenticated user's can access this route.

router.route("/").post(VerifyToken, accessChat);

/* API for fetching all of the chats (chat docs.) for a logged-in user */
router.route("/").get(VerifyToken, fetchChats);

router.route("/group").post(VerifyToken, createGroupChat);

/* 
  1] renaming a Group Chat, i.e. updating 'chatName' field of a (group) chat document.
  2] Since we are updating a particular entry in our database, its going to be a "PUT"
     request.
*/

router.route("/rename").put(VerifyToken, renameGroupChat);
/*
  1] In order to add a particular "user" to a group.

*/
router.route("/groupadd").put(VerifyToken, addToGroup);

/*
  1] In order to remove a particular "user" from the group (only admin can do it).
     
*/
router.route("/groupremove").put(VerifyToken, removeFromGroup);

/*
  In order to delete a particular Group Chat.
*/

router.route("/groupdelete").delete(VerifyToken, deleteGroup);

/*
 In order to delete any particular chat. 
*/

router.route("/deletechat").delete(VerifyToken, deleteAChat);

module.exports = router;
