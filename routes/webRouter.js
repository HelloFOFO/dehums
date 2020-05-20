let express = require('express');
let router = express.Router();
let web = require('../action/webAction')

/* GET home page. */
router.get('/', web.renderHome);
router.get('/login',web.renderLogin);
router.get('/logout',web.renderLogout);

module.exports = router;
