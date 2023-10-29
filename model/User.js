const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  surrName: {
    type: String,
    required: true,
  },
  roles: {
    User: {
      type: Number,
      default: 2001,
    },
    Admin: Number,
  },
  hashPwd: {
    type: String,
    required: true,
  },
  refreshToken: { type: [String], default: [] },
  lastTimeLogId: ObjectId,
});

module.exports = mongoose.model("User", userSchema);
