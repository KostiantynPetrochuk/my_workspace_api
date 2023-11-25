const { ObjectId } = require("mongoose").Types;
const User = require("../model/User");
const ROLES_LIST = require("../config/rolesList");
const { startOfToday, endOfToday } = require("date-fns");

const getAllUsers = async (req, res) => {
  const startOfTodayTest = startOfToday();
  const endOfTodayTest = endOfToday();

  const adminOnly = req.user.roles.includes(ROLES_LIST.Admin);
  const find = {};
  const projection = {
    hashPwd: 0,
    __v: 0,
    refreshToken: 0,
    lastTimeLogId: 0,
  };
  if (!adminOnly) {
    find._id = new ObjectId(req.user.id);
  }

  const users = await User.aggregate([
    { $match: find },
    {
      $lookup: {
        from: "timelogs",
        let: { lastTimeLogId: "$lastTimeLogId" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$lastTimeLogId"] },
              date: {
                $gte: startOfTodayTest,
                $lte: endOfTodayTest,
              },
            },
          },
          {
            $project: {
              userId: 0,
              __v: 0,
            },
          },
        ],
        as: "lastTimeLog",
      },
    },
    {
      $lookup: {
        from: "timelogs",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$userId", "$$userId"] },
              date: {
                $gte: startOfTodayTest,
                $lte: endOfTodayTest,
              },
            },
          },
          {
            $project: {
              userId: 0,
              __v: 0,
            },
          },
          {
            $sort: { date: -1 },
          },
        ],
        as: "timelogsHistory",
      },
    },
    {
      $addFields: {
        lastTimeLog: { $arrayElemAt: ["$lastTimeLog", 0] },
      },
    },
    { $project: projection },
  ]);

  if (!users) return res.status(204).json({ message: "No users found" });

  res.json(users);
};

const deleteUser = async (req, res) => {
  if (!req?.body?.id) {
    return res.status(400).json({ message: "User ID required" });
  }

  const user = await User.findOne({ _id: req.body.id }).exec();
  if (!user) {
    return res
      .status(204)
      .json({ message: `User ID ${req.body.id} not found` });
  }
  const result = await user.deleteOne({ _id: req.body.id });
  res.json(result);
};

const getUser = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "User ID required" });
  }

  const user = await User.findOne({ _id: req.params.id }).exec();
  if (!user) {
    return res
      .status(204)
      .json({ message: `User ID ${req.params.id} not found` });
  }
  res.json(user);
};

module.exports = {
  getAllUsers,
  deleteUser,
  getUser,
};
