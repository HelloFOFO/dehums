let express = require('express');
let router = express.Router();
let web = require('../action/webAction')


router.get('/', web.renderStation);
router.get('/ajax/summary', web.getStationSummary)
router.get('/ajax/summaryUsage', web.getStationSummaryUsage)

router.get('/area/:areaNum', web.renderArea)
router.get('/ajax/devices', web.getDevices)

router.get('/device/:devNums', web.renderDevice)
router.get('/ajax/device', web.getDevice)
router.get('/ajax/device/tempAndHum', web.getDeviceTempAndHum)
router.get('/ajax/device/summaryUsage', web.getDeviceSummaryUsage)

router.get('/alarms', web.renderAlarms)
router.get('/ajax/alarmList', web.getAlarmList)
router.get('/ajax/alarmListDT', web.getAlarmListDT)

router.get('/historyData', web.renderHistoryData)
// devicedata?points=1_1_1_TEMP|1_1_1_HUM&date=2019-08-04 这样的请求
router.get('/ajax/devicedata', web.getDeviceData)

router.get('/download', web.renderDownload)
router.get('/ajax/getExcel', web.getExcel)


// 下面是管理配置相关的页面；
router.get('/admin*', web.dehumAuth)
router.get('/login', web.renderLogin)
router.post('/login',web.checkLogin)
router.get('/logout',web.logout)
router.get('/adminchangepwd', web.renderAdminUpdatePwd)
router.post('/updatepassword', web.updatePassword)

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
router.get('/ajax/devicelist', web.getDeviceList)
router.post('/ajax/admin/device', web.updateElseInsertDevice)


//DEV_CONFIG表相关
router.get('/admindevconfig', web.renderAdminDevConfig)
router.get('/ajax/admin/devconfig', web.getAdminDevConfig)
router.get('/ajax/admin/sysconfigupdatelog', web.getSysConfigUpdateLog)
router.post('/ajax/admin/devconfig/recreate', web.recreateDevConfig)
router.post('/ajax/admin/devconfig/signal', web.signalDevConfig)

module.exports = router;
