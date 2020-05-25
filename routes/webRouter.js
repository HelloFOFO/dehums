let express = require('express');
let router = express.Router();
let web = require('../action/webAction')

router.get('/', web.renderHome);
router.get('/admin', web.renderAdminIndex)
router.get('/adminarea', web.renderAdminArea)
router.get('/admindevice', web.renderAdminDevice)

router.post('/ajax/global_config', web.updateGlobalConfig)
router.get('/ajax/admin/arealist', web.getAdminAreaList)
router.post('/ajax/admin/area', web.updateElseInsertArea)

module.exports = router;
