const express = require('express');
const router = express.Router();
const urlController= require("../controllers/urlController")

router.post("/users", urlController.createUser)
router.get("/:urlCode", urlController.getUrl)


module.exports = router;