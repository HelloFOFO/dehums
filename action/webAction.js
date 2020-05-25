let dbService = require("./../service/dbService");

exports.renderHome = function(req,res){
    res.render('index', { title: 'DEHUMSSS' });
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
        result = {
            errorCode: err||0,
            errorMsg: result
        }
        res.json(result)
    })
}

exports.renderAdminArea = function(req, res){
    res.render('adminarea', {title: '除湿机管理后台-区域管理'})
}

exports.renderAdminDevice = function(req, res){
    res.render('admindevice', {title: '除湿机管理后台-除湿机管理'})
}

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

exports.updateElseInsertArea = function(req, res){
    let area = req.body;
    let areaNum = parseInt(area.areaNum)
    if(areaNum){
        dbService.updateArea(area, function(err){
            res.json(err)
        })
    }
    else{
        dbService.insertArea(area, function(err){
            res.json(err)
        })
    }
}