const User = require("../model/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const handleNewUser = async (req, res) => {
  const { firstName, lastName, surrName, email, pwd } = req.body;
  if (!email || !pwd) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  const duplicate = await User.findOne({ email }).exec();
  if (duplicate) return res.sendStatus(409); // Conflict

  try {
    const hashPwd = await bcrypt.hash(pwd, 10);

    const result = await User.create({
      firstName,
      lastName,
      surrName,
      email,
      hashPwd,
    });

    const accessToken = jwt.sign(
      {
        UserInfo: {
          id: foundUser._id,
          email,
          roles: result.roles,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    res.status(201).json({
      userId: result._id,
      roles: result.roles,
      accessToken,
      firstName,
      lastName,
      surrName,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleNewUser };
