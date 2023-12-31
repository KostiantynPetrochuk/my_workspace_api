const { ObjectId } = require("mongoose").Types;
const ROLES_LIST = require("../config/rolesList");
const User = require("../model/User");
const TimeLogs = require("../model/TimeLogs");

const {
  startOfToday,
  endOfToday,
  differenceInHours,
  endOfMonth,
} = require("date-fns");

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

const getUserLogs = async (req, res) => {
  const { userId, year, month } = req.body;
  const date = new Date(year, month);
  const endDate = endOfMonth(date);
  let targetUserId = req.user.id;
  const adminOnly = req.user.roles.includes(ROLES_LIST.Admin);

  if (adminOnly) {
    targetUserId = userId;
  }

  const userLogs = await TimeLogs.aggregate([
    {
      $match: {
        userId: new ObjectId(targetUserId),
        date: {
          $gte: date,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        logs: { $push: "$$ROOT" },
        _id: {
          $dateToString: {
            format: "%d",
            date: "$date",
            timezone: "Europe/Kiev",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        day: { $toInt: "$_id" },
        count: 1,
        logs: 1,
      },
    },
    {
      $sort: {
        day: 1,
      },
    },
  ]);

  res.json({ userLogs });
};

const updateUserLog = async (req, res) => {
  const { logId, time, logStatus } = req.body;
  const currentLog = await TimeLogs.findOne({ _id: new ObjectId(logId) });

  if (logStatus === "in" && currentLog.status === "out") {
    const outTime = currentLog.entries.out.date;
    const resultTime = differenceInHours(outTime, new Date(time));

    const result = await TimeLogs.findOneAndUpdate(
      { _id: new ObjectId(logId) },
      {
        $set: {
          "entries.in.date": time,
          hours: resultTime,
        },
      },
      { new: true }
    );
    res.status(200).json(result);
    return;
  }
  if (logStatus === "in" && currentLog.status === "in") {
    const result = await TimeLogs.findOneAndUpdate(
      { _id: new ObjectId(logId) },
      {
        $set: {
          "entries.in.date": time,
        },
      },
      { new: true }
    );
    res.status(200).json(result);
    return;
  }
  if (logStatus === "out") {
    const inTime = currentLog.entries.in.date;
    const resultTime = differenceInHours(new Date(time), inTime);

    const result = await TimeLogs.findOneAndUpdate(
      { _id: new ObjectId(logId) },
      {
        $set: {
          "entries.out.date": time,
          hours: resultTime,
        },
      },
      { new: true }
    );
    res.status(200).json(result);
    return;
  }
};

const deleteUserLog = async (req, res) => {
  const { logId, logStatus } = req.body;

  if (logStatus === "in") {
    await TimeLogs.deleteOne({ _id: new ObjectId(logId) });
    res.status(200).json({ status: "success" });
    return;
  }
  if (logStatus === "out") {
    const result = await TimeLogs.findOneAndUpdate(
      { _id: new ObjectId(logId) },
      {
        $unset: {
          "entries.out": "",
          hours: "",
        },
        $set: {
          status: "in",
        },
      },
      { new: true }
    );
    res.status(200).json({ status: "success", newLog: result });
    return;
  }
};

module.exports = {
  addUserLog,
  getUserLogs,
  updateUserLog,
  deleteUserLog,
};
