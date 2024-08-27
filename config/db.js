const Mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await Mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.log(`Error: ${err.message}`);
    process.exit();
  }
};

module.exports = connectDB;
