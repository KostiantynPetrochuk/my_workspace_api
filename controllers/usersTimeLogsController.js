const Employee = require("../model/Employee");

const addUserLog = async (req, res) => {
  res.status(200).json({ message: "Hello!" });
};

module.exports = {
  addUserLog,
};
