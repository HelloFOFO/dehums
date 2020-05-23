let dbService = require("./../service/dbService");

exports.renderHome = function(req,res){
    res.render('index', { title: 'DEHUMSSS' });
}

exports.renderAdminPage = function(req,res){
    dbService.getGlobalConfig(function(err,data){
        if(err){
            res.json(err)
        }
        else{
            // console.log(data)
            res.render('adminindex', { title: '除湿机管理后台', globalConfig: data })
        }

    })
}

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