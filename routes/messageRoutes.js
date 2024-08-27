const Express = require("express");
const router = Express.Router();
const VerifyToken = require("../middleware/authMiddleware");
const {
  sendMessage,
  allMessages,
  sendImageMessage,
} = require("../controllers/messageControllers");

router.use(Express.json());
router.use(Express.urlencoded());

//routes for message:-

/*
 1] 1st route will be for sending the message.
 2] 2nd route will be responsible for fetching all of the messages belonging to a particular chat.
*/

router.route("/").post(VerifyToken, sendMessage);
router.route("/:chatId").get(VerifyToken, allMessages);
router.route("/imgmessage").post(VerifyToken, sendImageMessage);

module.exports = router;
