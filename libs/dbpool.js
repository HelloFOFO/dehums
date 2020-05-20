/**
 * Created by wucho on 5/4/15.
 */
var mysql = require('mysql');
var cfg = require('./../conf/global');

//master db上的连接池
var pool  = mysql.createPool({
    host       : cfg.db.host,
    user       : cfg.db.user,
    password   : cfg.db.password,
    database   : cfg.db.database,
    charset    : 'utf8'
    //charset    : 'utf8mb4', //如果用到emoji表情请使用此选项
    //connectionLimit :10     //池子里最多放多少connection，默认值是10
    //queueLimit : cfg.queueLimit //如果池子里connection不够了，那么最多允许多少个connection排队，默认值0表示是无限多个
});
//slave db上的连接池
var pool_slave = mysql.createPool({
    host       : cfg.db.slaveHost,
    user       : cfg.db.user,
    password   : cfg.db.password,
    database   : cfg.db.database,
    charset    : 'utf8'
    //charset    : 'utf8mb4', //如果用到emoji表情请使用此选项
    //connectionLimit :10     //池子里最多放多少connection，默认值是10
    //queueLimit : cfg.queueLimit //如果池子里connection不够了，那么最多允许多少个connection排队，默认值0表示是无限多个
});

//获取master数据库上的connection 用于写操作
exports.getConnection = function(callback) {
    pool.getConnection(function(err, connection) {
        callback(err, connection);
    });
};
//获取slave数据库上的connection 用于读操作
exports.getReadOnlyConnection = function(callback){
    pool_slave.getConnection(function(err, connection) {
        callback(err, connection);
    });
};
