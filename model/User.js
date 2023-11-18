const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema;

const userSchema = new Schema(
  {
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
      type: [String],
      default: ["User"],
    },
    hashPwd: {
      type: String,
      required: true,
    },
    refreshToken: { type: [String], default: [] },
    lastTimeLogId: ObjectId,
  },
  { versionKey: false }
);

module.exports = mongoose.model("User", userSchema);
