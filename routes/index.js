var express = require('express');
var router = express.Router();
const {v4: uuidV4} = require('uuid');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect(`/chat/${uuidV4()}`)
});

module.exports = router;
