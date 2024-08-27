/*
1] npm i express-async-handler


*/

const Express = require("express");
const app = Express();

const generateToken = require("../config/generateToken");

const UserModel = require("../models/userModel");
const asyncHandler = require("express-async-handler");

const CookieParser = require("cookie-parser");
app.use(CookieParser());

const Bcrypt = require("bcrypt");

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, pic } = req.body;
  console.log({ username, email, password, pic });

  if (!username || !email || !password) {
    res.status(400);
    throw new Error("Please Enter all the Fields");
  }

  const userExists = await UserModel.findOne({ email });

  if (userExists) {
    throw new Error("User already exists");
  }

  //This entire process will take some time (hence using await keyword)
  const hashedPasswordWithSalt = await Bcrypt.hash(password, 12);

  let userData = {};

  if (typeof pic !== "string") {
    console.log("registerUser");
    userData = new UserModel({
      name: username,
      email,
      password: hashedPasswordWithSalt,
    });
    console.log(userData);
  } else {
    userData = new UserModel({
      name: username,
      email,
      password: hashedPasswordWithSalt,
      pic,
    });
  }

  userData
    .save()
    .then((doc) => {
      //Generating the JWT token
      const actualToken = generateToken(doc._id);
      console.log(actualToken);

      //Sending the token to the browser.
      res.cookie("token", actualToken, {
        // sameSite: "None", // Set SameSite to None for cross-origin requests
        // secure: false,
      });

      res.status(201).json(doc);
    })
    .catch((err) => {
      res.status(500);
      throw new Error("Failed to Create the User");
    });
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const userExists = await UserModel.findOne({ email });

  if (userExists !== null) {
    //email is verified, Now verify the password.
    const actualPassword = userExists.password;

    const confirmationOutput = await Bcrypt.compare(password, actualPassword);

    if (confirmationOutput) {
      //Generating the JWT token for the logged-In user.
      const actualToken = generateToken(userExists._id);

      //Sending the token to the browser.
      res.cookie("token", actualToken);

      res.status(201).send(userExists);
    } else {
      res.status(500).send({ error: "Invalid Password !!!" });
    }
  } else {
    res.status(500).send({ error: "Invalid Email !!!" });
  }
});

const guestUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const guestUserAcc = await UserModel.findOne({ email });

  //Generating the JWT token for the guest user.
  const actualToken = generateToken(guestUserAcc._id);

  //Sending the token to the browser.
  res.cookie("token", actualToken);

  if (guestUserAcc !== null) {
    //Its a valid guest email

    const actualPassword = guestUserAcc.password;

    const confirmationOutput = await Bcrypt.compare(password, actualPassword);

    if (confirmationOutput) {
      // its a valid guest password.
      res.status(201).send(guestUserAcc);
    } else {
      res.status(500).send("Invalid Guest Password");
    }
  } else {
    res.status(500).send("Invalid Guest Email");
  }
});

// /api/user?search=j
const allUsers = asyncHandler(async (req, res) => {
  console.log(req.query.search);

  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  // console.log(keyword);

  const users = await UserModel.find(keyword)
    .find({
      _id: { $ne: req.user._id },
    })
    .select("-password");

  // console.log(users);

  res.send(users);
});

module.exports = { registerUser, authUser, guestUser, allUsers }; //default export

/*
^ MongoDB Query Object:

  $or: This is a MongoDB logical operator that allows you to match documents where at least one of 
       the sub-conditions is true.

  $regex: This operator is used to perform a regular expression (regex) search.

  req.query.search: The search term, "Tejas", is inserted into the regex search.

  $options: "i": The "i" option makes the search case-insensitive (so it will match 
                 "tejas", "TEJAS", "TeJas", etc.).

^ Search Criteria:- 
? The resulting query object is:                 
   {
     $or: [
       { username: { $regex: "Tejas", $options: "i" } },
       { email: { $regex: "Tejas", $options: "i" } },
     ],
   }

? This query tells MongoDB to find documents where either:
  The 'name' field contains the substring "Tejas" (case-insensitive).
  OR the 'email' field contains the substring "Tejas" (case-insensitive).  

  The code creates a dynamic 'MongoDB query' that searches for 'documents' where the 'name' or 'email' 
  fields contain the search term "Tejas", ignoring case sensitivity. 

~ $regex: This MongoDB operator performs a pattern matching search using a regular expression

*/
