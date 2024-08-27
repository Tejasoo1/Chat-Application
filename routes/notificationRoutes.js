const Express = require("express");
const VerifyToken = require("../middleware/authMiddleware");
const {
  createNotify,
  getNotifications,
  deleteNotification,
} = require("../controllers/notificationControllers");
const router = Express.Router();

router.use(Express.urlencoded());
router.use(Express.json());

//Routes for notifications:-

router.route("/create").post(VerifyToken, createNotify);
router.route("/:userId").get(VerifyToken, getNotifications);
router.route("/notificationdelete").delete(VerifyToken, deleteNotification);

module.exports = router;
