const express = require("express");
const router = express.Router();
const path = require("path");

// could request just the / or the whole index.html or just index
router.get("^/$|/index(.html)?", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
});

module.exports = router;
