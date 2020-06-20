let express = require('express');
let router = express.Router();
let web = require('../action/webAction')


router.get('/', web.renderStation);
router.get('/ajax/summary', web.getStationSummary)
router.get('/ajax/summaryUsage', web.getStationSummaryUsage)

router.get('/area/:areaNum', web.renderArea)
router.get('/ajax/devices', web.getDevices)

router.get('/device/:devNums', web.renderDevice)
router.get('/ajax/device/tempAndHum', web.getDeviceTempAndHum)


// 下面是管理配置相关的页面；

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

//DEV_CONFIG表相关
router.get('/admindevconfig', web.renderAdminDevConfig)
router.get('/ajax/admin/devconfig', web.getAdminDevConfig)
router.get('/ajax/admin/sysconfigupdatelog', web.getSysConfigUpdateLog)
router.post('/ajax/admin/devconfig/recreate', web.recreateDevConfig)
router.post('/ajax/admin/devconfig/signal', web.signalDevConfig)

module.exports = router;
