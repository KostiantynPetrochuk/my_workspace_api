const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema;

const usersTimeLogsSchema = new Schema({
  userId: ObjectId,
  date: Date,
  status: String, // 'in' | 'out'
  entries: {
    in: {
      recorderId: ObjectId,
      date: Date,
    },
    out: {
      recorderId: ObjectId,
      date: Date,
    },
    timeAmount: Number,
  },
});

module.exports = mongoose.model("UsersTimeLogs", usersTimeLogsSchema);
