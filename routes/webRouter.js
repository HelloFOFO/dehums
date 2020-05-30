let express = require('express');
let router = express.Router();
let web = require('../action/webAction')

router.get('/', web.renderHome);

// 全局配置相关
router.get('/admin', web.renderAdminIndex)
router.post('/ajax/global_config', web.updateGlobalConfig)

// 区域管理相关
router.get('/adminarea', web.renderAdminArea)
router.get('/ajax/admin/arealist', web.getAdminAreaList)
router.get('/ajax/arealist', web.getAreaList)
router.post('/ajax/admin/area', web.updateElseInsertArea)


// 机柜管理相关
router.get('/adminbox', web.renderAdminBox)
router.get('/ajax/admin/boxlist', web.getAdminBoxList)
router.get('/ajax/boxlist', web.getBoxList)
router.post('/ajax/admin/box', web.updateElseInsertBox)


//除湿机管理相关
router.get('/admindevice', web.renderAdminDevice)
router.get('/ajax/admin/devicelist', web.getAdminDeviceList)
router.post('/ajax/admin/device', web.updateElseInsertDevice)


module.exports = router;
