const Express = require("express");
const app = Express();
app.use(Express.urlencoded());

const {
  registerUser,
  authUser,
  guestUser,
  allUsers,
} = require("../controllers/userControllers");

const JWT = require("jsonwebtoken");
const router = Express.Router();

const CookieParser = require("cookie-parser");
const VerifyToken = require("../middleware/authMiddleware");
app.use(CookieParser());

//This func. will also take 3 parameters:- req, res, next
function sendAndVerifyToken(req, res, next) {
  //Extract the token
  const fetchedToken = req?.cookies?.token || "";
  console.log({ fetchedToken });
  console.log(req?.cookies?.token);

  //server program, will check whether it is a valid token or not.
  if (!fetchedToken) {
    res.status(500).send({ error: "cookie is invalid !!!" });
  } else {
    //Logic to verify the token:-
    JWT.verify(fetchedToken, process.env.JWT_SECRET, (error) => {
      if (error) {
        //if the token that you have passed was not generated with this secret key("javascript"), then error will occur.
        res.status(400).send({ error: error.message });
      } else {
        //if the token that you have passed was generated with this secret key("javascript"), then error parameter will be empty string.
        next(); //next will point to the callback fun. of "/login" endpoint.
      }
    });
  }
}

//Endpoints
router.use(Express.json());
router.use(Express.urlencoded());

router.route("/").post(registerUser).get(VerifyToken, allUsers);
router.post("/login", authUser);
router.post("/login/guest", guestUser);

module.exports = router; //named export

/*
? 'const router = Express.Router();': 
   This creates a new instance of an Express router. A router works like a mini Express app, 
   allowing you to define routes in a modular way.

^ 'router.use(Express.json());': 
   This is middleware that parses incoming requests with JSON payloads and makes the parsed data
   available in req.body. This middleware will run for all requests that pass through this router.

   Purpose: This middleware function is used to parse incoming 'JSON' payloads. It extracts the 
            JSON data from the request body and makes it accessible on req.body.

^ 'router.route("/").post(registerUser);':
   This defines a POST route at the path / relative to the router. The function registerUser will 
   be executed whenever a POST request is made to this endpoint.

~ 'module.exports = router;':
   This exports the router object so it can be imported and used in other files (e.g., server.js).

**********************************************************************************************************

 In server.js:
 You mount the 'userRoutes' router at /api/user.

 In userRoutes.js:
 You define a POST '/' route on the router. This route is relative to the 'base path' where the router is 
 mounted.

**********************************************************************************************************
& What happens when you send a 'POST' request to 'http://localhost:3000/api/user': 

!1] The request hits the main Express app (server.js):
    Since the path is '/api/user', Express routes the request to the userRoutes router because you 
    specified app.use("/api/user", userRoutes);.

?2] The request is passed to userRoutes.js:
    Inside 'userRoutes.js', the router looks for a route that matches the remainder of the path after
    '/api/user'.

    Since 'router.route("/").post(registerUser);' defines a 'POST' route at '/', it will match the '/' part
    after '/api/user' and trigger the 'registerUser' function.

^ 3] The registerUser function is called:
    The registerUser function is executed, which handles the logic for registering a user 
    (e.g., storing the user in a database, responding with a success message).

************************************************************************************************************
! Visualizing the Flow:
~ Request: A 'POST' request is made to '/api/user'.
? Router in 'server.js': Express sees '/api/user' and sends the request to 'userRoutes'.
  Router in 'userRoutes.js': The 'userRoutes' router sees '/' (which comes after /api/user) and handles 
                             the request with the 'registerUser' function    

*************************************************************************************************************

! router.route("/"):
  This part creates a 'route' object associated with the 'root' path ("/"). This means that any requests 
  made to this path will be handled by the functions chained to it.

^ .post(registerUser):
  This specifies that when a 'POST' request is made to the "/" path, the 'registerUser' function should 
  be executed.
  'POST' requests are typically used for creating new resources. In this context, the 'registerUser' 
  function is likely handling the logic for registering a new user (e.g., taking user data from the 
  request body and saving it to a database).

~ .get(allUsers):
  This specifies that when a 'GET' request is made to the "/" path, the 'allUsers' function should be 
  executed.
  'GET' requests are typically used for retrieving data. Here, the 'allUsers' function likely fetches 
  and returns a list of all users (e.g., from a database).

*/
