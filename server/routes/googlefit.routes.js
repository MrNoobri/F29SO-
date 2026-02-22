const express = require("express");
const googleFitController = require("../controllers/googlefit.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/auth", authenticate, googleFitController.getAuthUrl);
router.get("/callback", googleFitController.handleCallback);
router.get("/status", authenticate, googleFitController.getStatus);
router.post("/sync", authenticate, googleFitController.syncData);
router.post("/disconnect", authenticate, googleFitController.disconnect);

module.exports = router;
