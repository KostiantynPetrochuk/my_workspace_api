const User = require("../model/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const handleNewUser = async (req, res) => {
  const { firstName, lastName, email, pwd } = req.body;
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
      email,
      hashPwd,
    });

    const roles = Object.values(result.roles).filter(Boolean);

    const accessToken = jwt.sign(
      {
        UserInfo: {
          email,
          roles: roles,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "10s" }
    );

    res.status(201).json({ roles, accessToken });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleNewUser };
