const NotificationModel = require("../models/notificationModel");

const createNotify = async (req, res) => {
  const { messageId, userId } = req.body;

  try {
    const NotificationData = new NotificationModel({
      currMessage: messageId,
      userId,
    });

    const notificationInfo = await NotificationData.save();
    res.status(200).send(notificationInfo);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Internal Server Error !!!");
  }
};

const getNotifications = async (req, res) => {
  const loggedUserId = req.params.userId;

  console.log({ loggedUserId });

  try {
    const allNotificationData = await NotificationModel.find({
      userId: loggedUserId,
    })
      .populate({
        path: "currMessage",
        populate: [
          {
            path: "sender", // Populating the 'sender' field within currMessage
            select: "-password",
          },
          {
            path: "chat", // Populating the 'chat' field within currMessage
            populate: [
              {
                path: "users",
                select: "-password",
              },
              {
                path: "latestMessage",
              },

              {
                path: "groupAdmin",
                select: "-password",
              },
            ],
          },
        ],
      })
      .populate("userId", "-password");

    res.status(200).send(allNotificationData);
  } catch (err) {
    res.status(500).send("Internal Server error !!!");
  }
};

const deleteNotification = async (req, res) => {
  const { notifyId } = req.body;

  try {
    const DeletedDoc = await NotificationModel.findByIdAndDelete(notifyId);
    res.status(200).send(DeletedDoc);
  } catch (err) {
    res.status(500).send("Error in deleting the notification doc.");
  }
};

module.exports = { createNotify, getNotifications, deleteNotification };
