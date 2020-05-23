let pool  = require('./../libs/dbpool');
let async = require("async");

//只有接口里会用到的函数，为了写sql方便，不用拼字符串
let heredoc = function(fn) {
    return fn.toString().split('\n').slice(1,-1).join('\n') + '\n'
};

exports.getGlobalConfig = function(cb){
    async.auto({
            globalConfig:function(cb1){
                pool.getConnection(function (error, conn) {
                    if (error) {
                        console.log(error)
                        cb1("error_db_connect", null);
                    } else {
                        // 只取数据库中id为1的那一条
                        var sql = heredoc(function () {/*
                         select poll_interval, cloud_server_ip, cloud_db_name, comm_mode, serial_port, cloud_server_port, token, id, insert_dt, update_dt
                         from   global_config
                         where  id = 1;
                         */});
                        // console.log(sql)
                        conn.query(sql, function (error, rows) {
                            conn.release();
                            if (error) {
                                console.log(error)
                                cb1("error_db_query", null);
                            } else {
                                cb1(null, rows[0]);
                            }
                        });
                    }
                });
            }
        },function(err,results){
            if (err) {
                cb({"errorCode":-1,"errorMsg":'获取全局参数失败'},null);
            } else {
                cb(null,results.globalConfig);
            }
        }
    );
}

exports.updateGlobalConfig = function(conf, cb){
    console.log(conf)
    async.waterfall(
        [
            // 先判断全局配置表里是否有ID为1的记录
            function(cb){
                pool.getConnection(function (error, conn) {
                    if (error) {
                        cb("error_db_connect", "数据库连接失败");
                    } else {
                        // 只取数据库中id为1的那一条
                        var sql = heredoc(function () {/*
                         select id, poll_interval, cloud_server_ip, cloud_db_name, comm_mode, serial_port, cloud_server_port, token, insert_dt, update_dt
                         from   global_config
                         where  id = 1;
                         */});
                        conn.query(sql, function (error, rows) {
                            conn.release();
                            if (error) {
                                cb("error_db_query", "数据库查询失败");
                            } else {
                                cb(null, rows.length);
                            }
                        })
                    }
                })
            },
            //更新全局配置表
            function(count, cb) {
                pool.getConnection(function (error, conn) {
                    if (error) {
                        cb("error_db_connect", "数据库连接失败");
                    } else {
                        let sqlParams = [conf.poll_interval, conf.cloud_server_ip, conf.cloud_db_name, conf.comm_mode, conf.serial_port, conf.cloud_server_port, conf.token]
                        let sql = ""
                        if (count == 0) {
                            sql = heredoc(function () {/*
                         insert into global_config(id, poll_interval, cloud_server_ip, cloud_db_name, comm_mode, serial_port, cloud_server_port, token, insert_dt)
                         values(1, ?,?,?,?,?,?,?, NOW())
                         */});
                        }
                        else {
                            sql = heredoc(function () {/*
                         update global_config
                         set poll_interval = ?, cloud_server_ip = ?, cloud_db_name = ?, comm_mode = ?, serial_port = ?, cloud_server_port = ?, token = ?
                         where  id = 1
                         */});
                        }
                        conn.query(sql, sqlParams, function (err, rows) {
                            conn.release();
                            console.log(sql)
                            console.log(sqlParams)
                            if (err) {
                                console.log(err)
                                cb("error_db_query", "全局配置更新失败-1");
                            }
                            else {
                                cb(null, true)
                            }
                        })
                    }
                })
            },
            // 先判断 sys_config_update_log 表里是否有ID为1的记录
            function(bSucceeded, cb){
                if(bSucceeded){
                    pool.getConnection(function (error, conn) {
                        if (error) {
                            cb("error_db_connect", "数据库连接失败");
                        } else {
                            // 只取数据库中id为1的那一条
                            var sql = heredoc(function () {/*
                             select id
                             from   sys_config_update_log
                             where  id = 1;
                             */});
                            conn.query(sql, function (error, rows) {
                                conn.release();
                                if (error) {
                                    cb("error_db_query", "数据库查询失败");
                                } else {
                                    cb(null, rows.length);
                                }
                            })
                        }
                    })
                }
                else {
                    cb("global_config_update_error", "全局配置更新失败-2")
                }
            },
            //接着更新 sys_config_update_log 表
            function(count, cb){
                pool.getConnection(function (error, conn) {
                    if (error) {
                        cb("error_db_connect", "数据库连接失败");
                    } else {
                        let sqlParams = []
                        let sql = ""
                        if (count == 0) {
                            sql = heredoc(function () {/*
                             insert into sys_config_update_log(id, global_config_update_time, insert_dt)
                             values(1, NOW(), NOW())
                            */});
                        }
                        else {
                            sql = heredoc(function () {/*
                             update sys_config_update_log
                             set    global_config_update_time = NOW()
                             where  id = 1
                             */});
                        }
                        conn.query(sql, sqlParams, function (err, rows) {
                            conn.release();
                            if (err) {
                                cb("error_db_query", "全局配置更新失败-3");
                            }
                            else {
                                cb(null, "全局配置更新成功")
                            }
                        })
                    }
                })
            }
        ], function(err, result){
            cb(err, result)
        }
    );
};
