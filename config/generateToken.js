const JWT = require("jsonwebtoken");

const generateToken = (docID) => {
  //Generating the JWT Token.
  const generatedToken = JWT.sign({ docID }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  return generatedToken;
};

module.exports = generateToken;
