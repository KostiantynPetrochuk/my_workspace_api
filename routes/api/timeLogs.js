const express = require("express");
const router = express.Router();
const timeLogsController = require("../../controllers/timeLogsController");
const ROLES_LIST = require("../../config/rolesList");
const verifyRoles = require("../../middleware/verifyRoles");

router
  .route("/")
  .post(verifyRoles(ROLES_LIST.User), timeLogsController.addUserLog)
  .patch(verifyRoles(ROLES_LIST.Admin), timeLogsController.updateUserLog)
  .delete(verifyRoles(ROLES_LIST.Admin), timeLogsController.deleteUserLog);

router
  .route("/getByUserId")
  .post(verifyRoles(ROLES_LIST.User), timeLogsController.getUserLogs);

module.exports = router;
