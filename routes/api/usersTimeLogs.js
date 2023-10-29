const express = require("express");
const router = express.Router();
const usersTimeLogsController = require("../../controllers/usersTimeLogsController");
const ROLES_LIST = require("../../config/rolesList");
const verifyRoles = require("../../middleware/verifyRoles");

router
  .route("/")
  .post(verifyRoles(ROLES_LIST.User), usersTimeLogsController.addUserLog);

module.exports = router;
