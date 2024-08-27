const Mongoose = require("mongoose");

const NotificationSchema = new Mongoose.Schema({
  currMessage: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: "messages",
  },

  userId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
});

const NotificationModel = Mongoose.model("notifications", NotificationSchema);

module.exports = NotificationModel;
