
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
    db.slaveHost = process.env.db_slaveHost||'127.0.0.1';
    db.host      = process.env.db_host||'127.0.0.1';
    db.user      = 'sow';
    db.password  = '90op()OP';
    db.database  = 'gywsd';
}else{
    //生产环境
    db.slaveHost = '127.0.0.1';
    db.host      = '127.0.0.1';
    db.user      = 'sow';
    db.password  = '90op()OP';
    db.database  = 'sowdb';
}

module.exports = {db:db};
