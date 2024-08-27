/*
  
1] decoded: If the token is valid, 'JWT.verify()' returns the payload (data) embedded within the 'JWT'. 
            If the token is invalid or expired, it will throw an error.

   Since you mentioned that the token was generated using the '_id' of a User 'object/document', the 
   'decoded object' will include the 'id 'of the user (which corresponds to the MongoDB _id).

2] req.user = UserModel.findById(decoded.id).select("-password"); :-

  ^ UserModel.findById(decoded.id):
   'decoded.id': This is the 'id' field from the decoded 'JWT' payload. Since you used the user's '_id' 
                 to generate the 'JWT', 'decoded.id' will hold that '_id' value.

  ^ UserModel.findById(id): 
   This method queries the MongoDB database to find a user document with the given '_id'.

  ^ .select("-password"):
   The 'select()' method allows you to specify which fields to include or exclude in the returned 
   document.

  ^ "-password": 
    The minus sign '-' indicates that the password field should be excluded from the result. 
    This is a common security practice to avoid accidentally exposing passwords in the response 
    or within the application logic.

  ^ req.user:
   The result of 'findById' is assigned to 'req.user', attaching the user's data to the 'req' object.
   This makes the authenticated user's details available throughout the rest of the middleware stack
   or in the route handler.

3] The callback function receives two arguments:
   error: If there is an error during verification (e.g., the token is invalid, expired, or the secret 
          doesn't match), this parameter will contain the 'error' object.

   decoded: If the token is successfully verified, this parameter will contain the decoded 
            payload of the JWT. 
            This is the data that was originally encoded into the token when it was created.


*/
const Express = require("express");
const app = Express();

const UserModel = require("../models/userModel");

const JWT = require("jsonwebtoken");
const CookieParser = require("cookie-parser");
app.use(CookieParser());

//This func. will also take 3 parameters:- req, res, next
async function VerifyToken(req, res, next) {
  //Extract the token
  const fetchedToken = req?.cookies?.token || "";

  // console.log({ fetchedToken });
  // console.log(req?.cookies?.token);

  //server program, will check whether it is a valid token or not.
  if (!fetchedToken) {
    res.status(400).send("cookie (token) is not sent !!!");
  } else {
    //Logic to verify the token:-

    try {
      const decoded = JWT.verify(fetchedToken, process.env.JWT_SECRET);
      // console.log(decoded);
      req.user = await UserModel.findById(decoded.docID).select("-password");
      // console.log(req.user);
      next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).send("Invalid token");
    }
  }
}

module.exports = VerifyToken;

/*
JWT.verify(fetchedToken, process.env.JWT_SECRET, (error, decoded) => {
      console.log("verify func.");
      if (error) {
        //if the token that you have passed was not generated with this secret key("javascript"), then error will occur.
        res.status(500).send("invalid token");
      } else {
        //if the token that you have passed was generated with this secret key("javascript"), then error parameter will be empty string.
        console.log(decoded.docID);
        async function fetchUserViaToken() {
          req.user = await UserModel.findById(decoded.docID).select(
            "-password"
          );
        }

        fetchUserViaToken();
        console.log({ reqUser: req.user });
        next(); //next will point to the callback fun. of a specific endpoint.
      }
    });





*/
