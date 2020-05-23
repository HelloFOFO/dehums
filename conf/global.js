
var debug = require('./.debug');

if(debug){
    exports.serviceEndPoint = 'http://localhost:3000';
}else{
    exports.serviceEndPoint = 'http://localhost:3000';
}

//数据库配置
var db = {};
if(debug){
    //非生产环境
    db.slaveHost = process.env.db_slaveHost||'106.14.10.98';
    db.host      = process.env.db_host||'106.14.10.98';
    db.user      = 'gywsd';
    db.password  = 'gywsd@123qwe';
    db.database  = 'gywsd';
}else{
    //生产环境
    db.slaveHost = process.env.db_slaveHost||'106.14.10.98';
    db.host      = process.env.db_host||'106.14.10.98';
    db.user      = 'gywsd';
    db.password  = 'gywsd@123qwe';
    db.database  = 'gywsd';
}

module.exports = {db:db};
