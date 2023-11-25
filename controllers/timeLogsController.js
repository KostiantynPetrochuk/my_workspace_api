const { ObjectId } = require("mongoose").Types;
const ROLES_LIST = require("../config/rolesList");
const User = require("../model/User");
const TimeLogs = require("../model/TimeLogs");

const { startOfToday, endOfToday, differenceInHours } = require("date-fns");

const addUserLog = async (req, res) => {
  let targetUserId = req.user.id;
  const adminOnly = req.user.roles.includes(ROLES_LIST.Admin);

  if (adminOnly) {
    targetUserId = req.body.userId;
  }

  const startTime = startOfToday();
  const endTime = endOfToday();

  const [lastTimeLog] = await TimeLogs.aggregate([
    {
      $match: {
        userId: new ObjectId(targetUserId),
        date: { $gte: startTime, $lte: endTime },
      },
    },
    {
      $sort: { date: -1 },
    },
    {
      $limit: 1,
    },
  ]);

  if (lastTimeLog?.status === "in") {
    // out
    const inTime = lastTimeLog.entries.in.date;
    const outTime = new Date();
    const resultTime = differenceInHours(outTime, inTime);

    const options = { returnOriginal: false, returnDocument: "after" };

    const updatedLog = await TimeLogs.findOneAndUpdate(
      { _id: new ObjectId(lastTimeLog._id) },
      {
        $set: {
          "entries.out": {
            recorderId: new ObjectId(req.user.id),
            date: new Date(),
          },
          status: "out",
          hours: resultTime,
        },
      },
      options
    );

    res.status(200).json({
      data: {
        _id: updatedLog._id,
        date: updatedLog.date,
        status: updatedLog.status,
        entries: updatedLog.entries,
      },
    });
    return;
  } else if (lastTimeLog?.status === "out" || !lastTimeLog?.status) {
    // in
    const timeLogBody = {
      userId: new ObjectId(targetUserId),
      date: new Date(),
      status: "in",
      entries: {
        in: {
          recorderId: new ObjectId(req.user.id),
          date: new Date(),
        },
      },
    };

    const addedTimeLog = await TimeLogs.create(timeLogBody);
    const result = await User.updateOne(
      { _id: new ObjectId(targetUserId) },
      { $set: { lastTimeLogId: addedTimeLog._id } }
    );

    res.status(200).json({
      data: {
        _id: addedTimeLog._id,
        date: addedTimeLog.date,
        status: addedTimeLog.status,
        entries: addedTimeLog.entries,
      },
    });
  }
};

module.exports = {
  addUserLog,
};
