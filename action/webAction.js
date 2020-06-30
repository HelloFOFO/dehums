let dbService = require("./../service/dbService");
let moment = require('moment')
let validator = require('validator')
let XLSX = require('xlsx')

exports.renderStation = function(req, res){
    let summaryData = {
        total: 0,
        total_valid: 0,
        total_working: 0,
        cnt_alarms: 0
    }

    dbService.getStationSummary(function(err, data){
        if(err){
            res.render('index', { title: '全站运行工况', summaryData:summaryData});
        }
        else{
            res.render('index', { title: '全站运行工况', summaryData:data  });
        }
    })
}

// 返回全站的概览数据
exports.getStationSummary = function(req, res){
    let summaryData = {
        total: 0,
        total_valid: 0,
        total_working: 0,
        cnt_alarms: 0
    }
    dbService.getStationSummary(function(err, data){
        if(err){
            res.json({data:summaryData});
        }
        else{
            res.json({data:data});
        }
    })
}

// 返回全站的用电量数据（包括除湿、加热）
exports.getStationSummaryUsage = function(req, res){
    dbService.getStationSummaryUsage(function(err, data){
        if(err){
            res.json({data:[]});
        }
        else{
            res.json({data:data});
        }
    })
}

exports.renderArea = function(req, res){
    let summaryData = {
        area_num: -1,
        area_name: "未知",
        total: 0,
        total_valid: 0,
        total_working: 0,
        cnt_alarms: 0
    }

    let areaNum = req.params.areaNum

    dbService.getAreaSummary(areaNum, function(err, data){
        if(err){
            res.render('area', { title: '区域运行工况', summaryData:summaryData});
        }
        else{
            res.render('area', { title: '区域运行工况', summaryData:data  });
        }
    })
}

exports.renderDevice = function(req, res){
    let dev = req.params.devNums.split('_')
    let deviceInfo = {
        areaNum: dev[0],
        boxNum: dev[1],
        devNum: dev[2]
    }
    dbService.getDevice(deviceInfo,function(err, data){
        let info = {
            areaNum : data.area_num,
            areaName : data.area_name,
            boxNum : data.box_num,
            boxName : data.box_name,
            devNum : data.dev_num,
            cnt_alarms : data.cnt_alarms
        }
        res.render('device', { title: '除湿机运行工况', deviceInfo:info});
    })
}

exports.getDevices = function(req ,res){
    let page     = req.query.page||1;//默认从第一页开始查询
    let pageSize = parseInt(req.query.pageSize)||9
    let areaNum = req.query.areaNum

    let searchParams = {
        page: page,
        pageSize: pageSize,
        areaNum: areaNum
    }

    dbService.getDevices(searchParams, function(err, data){
        if(err){
            console.log(err)
            res.json({errorCode: -1,errorMsg: "获取除湿机列表失败"})
        }
        else{
            res.json(data)
        }
    })
}

exports.getDevice = function(req, res){
    let areaNum = req.query.areaNum
    let boxNum = req.query.boxNum
    let devNum = req.query.devNum

    let deviceInfo = {
        areaNum: areaNum,
        boxNum: boxNum,
        devNum: devNum
    }

    dbService.getDevice(deviceInfo, function(err, data){
        if(err){
            console.log(err)
            res.json({errorCode: -1,errorMsg: "获取除湿机信息失败"})
        }
        else{
            res.json(data)
        }
    })
}


exports.getDeviceTempAndHum = function(req ,res){
    let areaNum = req.query.areaNum
    let boxNum = req.query.boxNum
    let devNum = req.query.devNum

    let deviceInfo = {
        areaNum: areaNum,
        boxNum: boxNum,
        devNum: devNum
    }

    dbService.getDeviceTempAndHum(deviceInfo, function(err, data){
        if(err){
            console.log(err)
            res.json({errorCode: -1,errorMsg: "获取除湿机温湿度失败"})
        }
        else{
            res.json(data)
        }
    })
}


exports.getDeviceSummaryUsage = function(req ,res){
    let areaNum = req.query.areaNum
    let boxNum = req.query.boxNum
    let devNum = req.query.devNum

    let deviceInfo = {
        areaNum: areaNum,
        boxNum: boxNum,
        devNum: devNum
    }

    dbService.getDeviceSummaryUsage(deviceInfo, function(err, data){
        if(err){
            console.log(err)
            res.json({errorCode: -1,errorMsg: "获取除湿机用电量失败"})
        }
        else{
            res.json(data)
        }
    })
}


exports.getAlarmList = function(req ,res){
    let areaNum = parseInt(req.query.areaNum)?parseInt(req.query.areaNum):-1
    let boxNum = parseInt(req.query.boxNum)?parseInt(req.query.boxNum):-1
    let devNum = parseInt(req.query.devNum)?parseInt(req.query.devNum):-1
    // console.log(areaNum)

    let bDate = req.query.beginDate? req.query.beginDate:""
    let eDate = req.query.endDate? req.query.endDate:""

    let beginDate = validator.isISO8601(bDate) ? moment(bDate).format("YYYY-MM-DD") : moment(new Date()).add(-1, 'month').format("YYYY-MM-DD")
    let endDate = validator.isISO8601(eDate) ? moment(eDate).format("YYYY-MM-DD") : moment(new Date()).add(0, 'days').format("YYYY-MM-DD")
    // console.log(beginDate)

    let searchParams = {
        areaNum: areaNum,
        boxNum: boxNum,
        devNum: devNum,
        beginDate: beginDate,
        endDate: endDate,
    }

    dbService.getAlarmList(searchParams, function(err, data){
        if(err){
            console.log(err)
            res.json({errorCode: -1,errorMsg: "获取告警信息失败"})
        }
        else{
            res.json(data)
        }
    })
}

exports.getAlarmListDT = function(req ,res){
    let param = req.query

    dbService.getAlarmListDT(param, function(err, data){
        if(err){
            console.log(err)
            res.json({errorCode: -1,errorMsg: "获取告警信息失败"})
        }
        else{
            res.json(data)
        }
    })
}

exports.renderAlarms = function(req, res){
    res.render('alarms', {title: "告警查询"})
}

exports.renderHistoryData = function(req, res){
    res.render('historydata', {title: "历史数据查询"})
}


exports.getDeviceData = function(req, res){
    let points = req.query.points.split('|')
    let date = req.query.date
    if(points && points.length > 0 && date) {
        dbService.getPointData(points, date, function (err, data) {
            if (err) {
                res.json('[]')
            }
            else {
                res.json(data)
            }
        })
    }
    else{
        res.json('[]')
    }
}

exports.renderDownload = function(req, res){
    res.render('download', {title: "历史数据下载"})
}


exports.getExcel = function(req, res){
    let param = req.query
    let excelData = {
        time: "", area_num: "", box_num: "", dev_num: "", hum_value: "", temp_value: "", valid: "", dehum_state: "", heat_state: "", dehum_total_time: "", heat_total_time: "", hum_set_value: "", hum_return_diff: "", hum_adjust_value: "", heat_start_temp: "", heat_return_diff: "", dehum_total_wh: "", heat_total_wh: "", upload_flag: ""
    }
    dbService.getDownloadData(param, function(err, data){
        if(!err && data){
            excelData = data
        }
        console.log("DOWNLOAD ROWS:",excelData.length)
        let wb = XLSX.utils.book_new()
        let ws = XLSX.utils.json_to_sheet(excelData)
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

        res.set({
            "Content-Disposition": "attachment; filename=" + moment().format('YYYYMMDDHHmmss') +".xlsx",
            "Content-Type": 'application/vnd.ms-excel'
        })

        let content = XLSX.write(wb, {
            type: 'buffer',
            bookType: 'xlsx'
        })
        // require('fs').writeFileSync('a.xls', content)
        res.send(content)
        // res.send(content.toString('base64'))
    });
}


exports.renderAdminIndex = function(req,res){
    dbService.getGlobalConfig(function(err,data){
        if(err){
            res.json(err)
        }
        else{
            // console.log(data)
            res.render('adminindex', { title: '除湿机管理后台-全局配置管理', globalConfig: data })
        }

    })
}

//更新全局配置表
exports.updateGlobalConfig = function(req, res){
    let reqConf = req.body
    let globalConfig = {
        poll_interval: reqConf.poll_interval,
        cloud_server_ip: reqConf.cloud_server_ip,
        cloud_db_name: reqConf.cloud_db_name,
        comm_mode: reqConf.comm_mode,
        serial_port: reqConf.serial_port,
        cloud_server_port: reqConf.cloud_server_port,
        token: reqConf.token
    }
    dbService.updateGlobalConfig(globalConfig, function(err, result){
        let data = {
            errorCode: (err) ? -1 : 200,
            errorMsg: (err) ? err : result
        }
        res.json(data)
    })
}

exports.renderAdminArea = function(req, res){
    res.render('adminarea', {title: '除湿机管理后台-区域管理'})
}

// 返回适配datatable的区域列表
exports.getAdminAreaList = function(req, res){
    let param = req.query;  //请求上来的参数
    dbService.getAdminAreaList(param, function(err, data){
        if(err){
            res.json(err);
        }
        else{
            res.json(data);
        }
    })
}

// 返回KV格式的区域列表
exports.getAreaList = function(req, res){
    dbService.getAreaList(function(err, data){
        if(err){
            res.json({data:[]});
        }
        else{
            res.json({data:data});
        }
    })
}

// 更新或者插入新的区域
exports.updateElseInsertArea = function(req, res){
    let area = req.body;
    let areaNum = parseInt(area.areaNum)
    if(areaNum){
        dbService.updateArea(area, function(err, result){
            let data = {
                errorCode: (err) ? -1 : 200,
                errorMsg: (err) ? err : result
            }
            res.json(data)
        })
    }
    else{
        dbService.insertArea(area, function(err, result){
            let data = {
                errorCode: (err) ? -1 : 200,
                errorMsg: (err) ? err : result
            }
            res.json(data)
        })
    }
}


exports.renderAdminBox = function(req, res){
    res.render('adminbox', {title: '除湿机管理后台-机柜管理'})
}

// 返回适配datatable的机柜列表
exports.getAdminBoxList = function(req, res){
    let param = req.query;  //请求上来的参数
    dbService.getAdminBoxList(param, function(err, data){
        if(err){
            res.json(err);
        }
        else{
            res.json(data);
        }
    })
}

// 返回kv形式的机柜列表（包含area_num）
exports.getBoxList = function(req, res){
    dbService.getBoxList(function(err, data){
        if(err){
            res.json({data:[]});
        }
        else{
            res.json({data:data});
        }
    })
}

// 更新或者插入新的机柜
exports.updateElseInsertBox = function(req, res){
    let box = req.body;
    let boxNum = parseInt(box.boxNum)
    if(boxNum){
        dbService.updateBox(box, function(err, result){
            let data = {
                errorCode: (err) ? -1 : 200,
                errorMsg: (err) ? err : result
            }
            res.json(data)
        })
    }
    else{
        dbService.insertBox(box, function(err, result){
            let data = {
                errorCode: (err) ? -1 : 200,
                errorMsg: (err) ? err : result
            }
            res.json(data)
        })
    }
}



exports.renderAdminDevice = function(req, res){
    res.render('admindevice', {title: '除湿机管理后台-除湿机管理'})
}

// 返回适配datatable的装置列表
exports.getAdminDeviceList = function(req, res){
    let param = req.query;  //请求上来的参数
    dbService.getAdminDeviceList(param, function(err, data){
        if(err){
            res.json(err);
        }
        else{
            res.json(data);
        }
    })
}

// 返回装置列表
exports.getDeviceList = function(req, res){
    dbService.getDeviceList(function(err, data){
        if(err){
            res.json({data:[]});
        }
        else{
            res.json({data:data});
        }
    })
}

// 更新或者插入新的装置
exports.updateElseInsertDevice = function(req, res){
    let device = req.body;
    let id = parseInt(device.id)
    if(id){
        dbService.updateDevice(device, function(err, result){
            let data = {
                errorCode: (err) ? -1 : 200,
                errorMsg: (err) ? err : result
            }
            res.json(data)
        })
    }
    else{
        dbService.insertDevice(device, function(err, result){
            let data = {
                errorCode: (err) ? -1 : 200,
                errorMsg: (err) ? err : result
            }
            res.json(data)
        })
    }
}


exports.renderAdminDevConfig = function(req, res){
    res.render('admindevconfig', {title: '除湿机管理后台-DEV_CONFIG管理'})
}

// 返回适配datatable的dev_config表
exports.getAdminDevConfig = function(req, res){
    let param = req.query;  //请求上来的参数
    dbService.getAdminDevConfig(param, function(err, data){
        if(err){
            res.json(err);
        }
        else{
            res.json(data);
        }
    })
}

// 返回适配datatable的sys_config_update_log表
exports.getSysConfigUpdateLog = function(req, res){
    let param = req.query;  //请求上来的参数
    dbService.getSysConfigUpdateLog(param, function(err, data){
        if(err){
            res.json(err);
        }
        else{
            res.json(data);
        }
    })
}

//重新生成dev_config表
exports.recreateDevConfig = function(req, res){
    dbService.recreateDevConfig(
        function(err, result){
            let data = {
                errorCode: (err) ? -1 : 200,
                errorMsg: (err) ? err : result
            }
            res.json(data)
        }
    )
}

//生成dev_config更新信号
exports.signalDevConfig = function(req, res){
    dbService.signalDevConfig(
        function(err, result){
            let data = {
                errorCode: (err) ? -1 : 200,
                errorMsg: (err) ? err : result
            }
            res.json(data)
        }
    )
}
