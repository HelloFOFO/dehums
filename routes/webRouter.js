let express = require('express');
let router = express.Router();
let web = require('../action/webAction')

/* GET home page. */
router.get('/', web.renderHome);
router.get('/adminPage', web.renderAdminPage)


router.post('/ajax/global_config', web.updateGlobalConfig)

module.exports = router;
