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
                        let sql = heredoc(function () {/*
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
    // console.log(conf)
    async.waterfall(
        [
            // 先判断全局配置表里是否有ID为1的记录
            function(cb){
                pool.getConnection(function (error, conn) {
                    if (error) {
                        cb("数据库连接失败");
                    } else {
                        // 只取数据库中id为1的那一条
                        let sql = heredoc(function () {/*
                         select id, poll_interval, cloud_server_ip, cloud_db_name, comm_mode, serial_port, cloud_server_port, token, insert_dt, update_dt
                         from   global_config
                         where  id = 1;
                         */});
                        conn.query(sql, function (error, rows) {
                            conn.release();
                            if (error) {
                                cb("数据库查询失败");
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
                        cb("数据库连接失败");
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
                            // console.log(sql)
                            // console.log(sqlParams)
                            if (err) {
                                // console.log(err)
                                cb("全局配置更新失败-1");
                            }
                            else {
                                cb(null, true)
                            }
                        })
                    }
                })
            },
            //接着更新 sys_config_update_log 表
            function(bSucceeded, cb){
                if(bSucceeded){
                    pool.getConnection(function (error, conn) {
                        if (error) {
                            cb("数据库连接失败");
                        } else {
                            let sql = "CALL spb_update_sys_config_update_from_systables()"
                            conn.query(sql, function (err) {
                                conn.release();
                                if (err) {
                                    cb("全局配置更新失败-3");
                                }
                                else {
                                    cb(null, "全局配置更新成功")
                                }
                            })
                        }
                    })
                }
                else{
                    cb("全局配置更新失败-2")
                }
            }
        ], function(err, result){
            cb(err, result)
        }
    );
};

// 返回适配datatable的区域列表
exports.getAdminAreaList = function(param, cb){
    /*这是datatable自带的变量*/
    var draw   = param.sEcho;            //这个是请求时候带过来请求编号，原封不动的还给client
    var start  = parseInt(param.start);  //起始行数(不是起始页数哦)，从0开始
    var length = parseInt(param.length); //每页的数据条数

    async.auto({
            checkParam: function (cb) {
                var whereClause = "";
                // 这儿没有额外的查询条件
                cb(null,whereClause);
            },
            total: ['checkParam', function (cb1, results) {
                pool.getReadOnlyConnection(function(error,conn) {
                    if (error) {
                        cb1("error_db_connect", null);
                    }
                    else {
                        var sql = heredoc( function () {/*
                         select count(1) AS cnt
                         from
                         (
                           SELECT area_num,area_name,insert_dt,update_dt
                           FROM   sys_area
                         ) a
                         where  1 = 1
                         __whereClause__
                         */});
                        sql = sql.replace(/__whereClause__/,results.checkParam);
//                        console.log(sql);
                        conn.query( sql, function(err,rows){
                            conn.release();
                            if(err){
                                cb1("error_db_query",null);
                            }
                            else{
                                cb1(null,rows[0]['cnt']);
                            }
                        });

                    }
                });
            }],
            data: ['checkParam', function (cb2, results) {
                pool.getReadOnlyConnection(function(error,conn) {
                    if (error) {
                        console.log("db connect error");
                        cb2("error_db_connect", null);
                    }
                    else {
                        var sql = heredoc( function () {/*
                         SELECT * FROM
                         (
                           SELECT area_num,area_name,insert_dt,update_dt
                           FROM   sys_area
                         ) a
                         where  1 = 1
                         __whereClause__
                         order by area_num asc
                         limit ?,?
                         */});
                        sql = sql.replace(/__whereClause__/,results.checkParam);
//                        console.log(sql);
                        var sqlParams = [start,length];
                        conn.query( sql,sqlParams, function(err,rows){
                            conn.release();
                            if(err){
                                cb2("error_db_query",null);
                            }
                            else{
                                cb2(null,rows);
                            }
                        });
                    }
                });
            }]
        },function(err,results){
            if(err){
                cb({"errorCode":-1,"errorMsg":'获取区域列表失败'},null);
            }
            else{
                var data = {draw:draw,data:results.data,recordsTotal:results.total,recordsFiltered:results.total};
                cb(null,data);
            }
        }
    );
}

// 返回KV格式的区域列表
exports.getAreaList = function(cb){
    async.auto({
            areaList:function(cb1){
                pool.getConnection(function (error, conn) {
                    if (error) {
                        console.log(error)
                        cb1("error_db_connect", null);
                    } else {
                        let sql = heredoc(function () {/*
                           SELECT area_num AS areaId,area_name AS areaName,insert_dt,update_dt
                           FROM   sys_area
                         */});
                        // console.log(sql)
                        conn.query(sql, function (error, rows) {
                            conn.release();
                            if (error) {
                                console.log(error)
                                cb1("error_db_query", null);
                            } else {
                                cb1(null, rows);
                            }
                        });
                    }
                });
            }
        },function(err,results){
            if (err) {
                cb({"errorCode":-1,"errorMsg":'获取区域列表失败'},null);
            } else {
                cb(null,results.areaList);
            }
        }
    );
}

exports.updateArea = function(area, cb){
    let areaNum = parseInt(area.areaNum)
    let areaName = area.areaName
    let sql = "";
    let sqlParam = [];
    if(areaNum){
        async.waterfall(
            [
                //先判断是否有当前areaNum
                function(cb1){
                    let bExists = false;
                    sql = "SELECT area_num FROM sys_area WHERE area_num = ? ";
                    sqlParam.push(areaNum);
                    pool.getReadOnlyConnection(function(error,conn) {
                        if (error) {
                            cb1("数据库连接失败");
                        }
                        else {
                            conn.query( sql, sqlParam , function(err,rows){
                                conn.release();
                                if(err){
                                    cb1("数据库查询失败");
                                }
                                else{
                                    bExists = (rows.length == 1);
                                    cb1(null,bExists);
                                }
                            });
                        }
                    });
                },
                // 判断传过来的信息是否有效
                function(bExists, cb4){
                    if(bExists){
                        pool.getReadOnlyConnection(function(error,conn) {
                            if (error) {
                                cb4("数据库连接失败");
                            }
                            else {
                                //先清空之前的参数
                                sqlParam.splice(0,sqlParam.length);
                                sql = "SELECT * FROM sys_area WHERE area_name = ? AND area_num <> ?";

                                sqlParam.push(areaName)
                                sqlParam.push(areaNum);

                                conn.query( sql,sqlParam, function(err, rows){
                                    conn.release();
//                                    console.log(sql);
//                                    console.log(sqlParam);
                                    if(err){
                                        cb4("数据库查询失败");
                                    }
                                    else{
                                        let bValid = (rows.length == 0)
                                        cb4(null, bValid);
                                    }
                                });
                            }
                        });
                    }
                    else{
                        cb4("要更新的区域不存在")
                    }
                },
                // 执行更新数据库操作
                function(bValid, cb2){
                    if(bValid){
                        pool.getReadOnlyConnection(function(error,conn) {
                            if (error) {
                                cb2("数据库连接失败");
                            }
                            else {
                                //先清空之前的参数
                                sqlParam.splice(0,sqlParam.length);
                                sql = "UPDATE sys_area SET area_name = ? WHERE area_num = ?";

                                sqlParam.push(areaName)
                                sqlParam.push(areaNum);

                                conn.query( sql,sqlParam, function(err,rows){
                                    conn.release();
//                                    console.log(sql);
//                                    console.log(sqlParam);
                                    if(err){
                                        cb2("数据库查询失败");
                                    }
                                    else{
                                        cb2(null,true);
                                    }
                                });
                            }
                        });
                    }
                    else{
                        cb("已存在同名的区域")
                        console.log(area)
                    }
                },
                //接着更新 sys_config_update_log 表
                function(bSucceeded, cb){
                    if(bSucceeded){
                        pool.getConnection(function (error, conn) {
                            if (error) {
                                cb("数据库连接失败");
                            } else {
                                let sql = "CALL spb_update_sys_config_update_from_systables()"
                                conn.query(sql, function (err) {
                                    conn.release();
                                    if (err) {
                                        cb("区域更新失败-3");
                                    }
                                    else {
                                        cb(null, "区域更新成功")
                                    }
                                })
                            }
                        })
                    }
                    else{
                        cb("区域更新失败-2")
                    }
                }
            ],
            function(err,result){
                cb(err, result)
            }
        )
    }
    else{
        cb({"errorCode":-1,"errorMsg":'请输入正确的区域编号'})
    }
}

exports.insertArea = function(area, cb){
    let sql = "";
    let sqlParam = [];
    let areaName = area.areaName
    async.waterfall(
        [
            // 判断传过来的信息是否有效
            function(cb4){
                pool.getReadOnlyConnection(function(error,conn) {
                    if (error) {
                        cb4("数据库连接失败");
                    }
                    else {
                        //先清空之前的参数
                        sqlParam.splice(0,sqlParam.length);
                        sql = "SELECT * FROM sys_area WHERE area_name = ?";

                        sqlParam.push(areaName)

                        conn.query( sql,sqlParam, function(err, rows){
                            conn.release();
//                                    console.log(sql);
//                                    console.log(sqlParam);
                            if(err){
                                cb4("数据库查询失败");
                            }
                            else{
                                let bValid = (rows.length == 0)
                                cb4(null, bValid);
                            }
                        });
                    }
                });
            },
            // 执行更新数据库操作
            function(bValid, cb2){
                if(bValid){
                    pool.getReadOnlyConnection(function(error,conn) {
                        if (error) {
                            cb2("数据库连接失败");
                        }
                        else {
                            //先清空之前的参数
                            sqlParam.splice(0,sqlParam.length);
                            sql = "INSERT INTO sys_area(area_name,insert_dt) VALUES(?, NOW())";

                            sqlParam.push(areaName)

                            conn.query( sql,sqlParam, function(err){
                                conn.release();
                                if(err){
                                    cb2("数据库查询失败");
                                }
                                else{
                                    cb2(null,true);
                                }
                            });
                        }
                    });
                }
                else{
                    cb("已存在同名的区域")
                    console.log(area)
                }
            },
            //接着更新 sys_config_update_log 表
            function(bSucceeded, cb){
                if(bSucceeded){
                    pool.getConnection(function (error, conn) {
                        if (error) {
                            cb("数据库连接失败");
                        } else {
                            let sql = "CALL spb_update_sys_config_update_from_systables()"
                            conn.query(sql, function (err) {
                                conn.release();
                                if (err) {
                                    cb("区域新增失败-3");
                                }
                                else {
                                    cb(null, "区域新增成功")
                                }
                            })
                        }
                    })
                }
                else{
                    cb("区域新增失败-2")
                }
            }
        ],
        function(err,result){
            cb(err, result)
        }
    )
}

// 返回适配datatable的机柜列表
exports.getAdminBoxList = function(param, cb){
    /*这是datatable自带的变量*/
    var draw   = param.sEcho;            //这个是请求时候带过来请求编号，原封不动的还给client
    var start  = parseInt(param.start);  //起始行数(不是起始页数哦)，从0开始
    var length = parseInt(param.length); //每页的数据条数

    async.auto({
            checkParam: function (cb) {
                var whereClause = "";
                // 这儿没有额外的查询条件
                cb(null,whereClause);
            },
            total: ['checkParam', function (cb1, results) {
                pool.getReadOnlyConnection(function(error,conn) {
                    if (error) {
                        cb1("error_db_connect", null);
                    }
                    else {
                        var sql = heredoc( function () {/*
                         select count(1) AS cnt
                         from
                         (
                           SELECT box_num
                           FROM   sys_box
                         ) a
                         where  1 = 1
                         __whereClause__
                         */});
                        sql = sql.replace(/__whereClause__/,results.checkParam);
                        conn.query( sql, function(err,rows){
                            conn.release();
                            if(err){
                                console.log(sql)
                                cb1("error_db_query",null)
                            }
                            else{
                                cb1(null,rows[0]['cnt'])
                            }
                        });

                    }
                });
            }],
            data: ['checkParam', function (cb2, results) {
                pool.getReadOnlyConnection(function(error,conn) {
                    if (error) {
                        cb2("error_db_connect", null);
                    }
                    else {
                        var sql = heredoc( function () {/*
                         SELECT * FROM
                         (
                           SELECT b.box_num,b.box_name,b.box_ip,b.box_port,b.insert_dt,b.update_dt,b.area_num,a.area_name
                           FROM   sys_box b INNER JOIN sys_area a ON b.area_num = a.area_num
                         ) a
                         where  1 = 1
                         __whereClause__
                         order by box_num asc
                         limit ?,?
                         */});
                        sql = sql.replace(/__whereClause__/,results.checkParam);
                        var sqlParams = [start,length];
                        conn.query( sql,sqlParams, function(err,rows){
                            conn.release();
                            if(err){
                                cb2("error_db_query",null);
                                console.log(sql);
                            }
                            else{
                                cb2(null,rows);
                            }
                        });
                    }
                });
            }]
        },function(err,results){
            if(err){
                console.log(err)
                cb({"errorCode":-1,"errorMsg":'获取机柜列表失败'},null);
            }
            else{
                var data = {draw:draw,data:results.data,recordsTotal:results.total,recordsFiltered:results.total};
                cb(null,data);
            }
        }
    );
}

// 返回KV格式的机柜列表
exports.getBoxList = function(cb){
    async.auto({
            boxList:function(cb1){
                pool.getConnection(function (error, conn) {
                    if (error) {
                        console.log(error)
                        cb1("error_db_connect", null);
                    } else {
                        let sql = heredoc(function () {/*
                           SELECT b.box_num,b.box_name,b.box_ip,b.box_port,b.insert_dt,b.update_dt,b.area_num,a.area_name
                           FROM   sys_box b INNER JOIN sys_area a ON b.area_num = a.area_num
                         */});
                        // console.log(sql)
                        conn.query(sql, function (error, rows) {
                            conn.release();
                            if (error) {
                                console.log(error)
                                cb1("error_db_query", null);
                            } else {
                                cb1(null, rows);
                            }
                        });
                    }
                });
            }
        },function(err,results){
            if (err) {
                cb({"errorCode":-1,"errorMsg":'获取区域列表失败'},null);
            } else {
                cb(null,results.boxList);
            }
        }
    );
}

exports.updateBoxBak = function(box, cb){
    let boxNum = parseInt(box.boxNum)
    let sql = "";
    let sqlParam = [];
    if(boxNum){
        async.auto({
                checkExists: function (cb1) {
                    let bExists = false;
                    sql = "SELECT box_num FROM sys_box WHERE box_num = ? ";
                    sqlParam.push(boxNum);
                    pool.getReadOnlyConnection(function(error,conn) {
                        if (error) {
                            cb1("数据库连接失败", bExists);
                        }
                        else {
                            conn.query( sql, sqlParam , function(err,rows){
                                conn.release();
                                if(err){
                                    cb1("数据库操作失败",bExists);
                                }
                                else{
                                    bExists = (rows.length == 1);
                                    cb1(null,bExists);
                                }
                            });
                        }
                    });
                },
                doUpdate: ['checkExists', function (cb2, results) {
                    pool.getReadOnlyConnection(function(error,conn) {
                        if (error) {
                            cb2("数据库连接失败", null);
                        }
                        else {
                            if(!results.checkExists){
                                cb2("要更新的机柜不存在",null);
                                console.log(boxNum);
                            }
                            else{
                                //先清空之前的参数
                                sqlParam.splice(0,sqlParam.length);
                                sql = "UPDATE sys_box SET box_name = ?, area_num = ?, box_ip = ?, box_port = ? WHERE box_num = ?";

                                sqlParam.push(box.boxName)
                                sqlParam.push(box.areaNum)
                                sqlParam.push(box.boxIP)
                                sqlParam.push(box.boxPort)
                                sqlParam.push(boxNum)

                                conn.query( sql,sqlParam, function(err,rows){
                                    conn.release();
//                                    console.log(sql);
//                                    console.log(sqlParam);
                                    if(err){
                                        cb2("数据库操作失败",null);
                                    }
                                    else{
                                        cb2(null,null);
                                    }
                                });
                            }
                        }
                    });
                }]
            },function(err){
                if(err){
                    cb({"errorCode":-1,"errorMsg":err});
                }
                else{
                    cb({"errorCode":200,"errorMsg":'更新机柜信息成功'});
                }
            }
        );
    }
    else{
        cb({"errorCode":-1,"errorMsg":'请输入正确的机柜编号'})
    }
}

exports.updateBox = function(box, cb){
    let boxNum = parseInt(box.boxNum)
    let sql = ""
    let sqlParam = []
    if(boxNum){
        async.waterfall(
            [
                // 先判断是否存在boxNum
                function(cb1){
                    sql = "SELECT box_num FROM sys_box WHERE box_num = ? ";
                    sqlParam.push(boxNum);
                    pool.getReadOnlyConnection(function(error,conn) {
                        if (error) {
                            cb1("数据库连接失败");
                        }
                        else {
                            conn.query( sql, sqlParam , function(err,rows){
                                conn.release();
                                if(err){
                                    cb1("数据库操作失败");
                                }
                                else{
                                    let bExists = (rows.length == 1);
                                    cb1(null,bExists);
                                }
                            });
                        }
                    });
                },
                // 判断输入的参数是否有效
                // 1、是否同一区域存在同名的其他机柜
                function(bExists, cb2){
                    if(bExists){
                        sql = "SELECT * FROM sys_box WHERE box_name = ? AND area_num = ? AND box_num <> ?";
                        sqlParam.splice(0, sqlParam.length)
                        sqlParam.push(box.boxName)
                        sqlParam.push(box.areaNum)
                        sqlParam.push(boxNum);
                        pool.getReadOnlyConnection(function(error,conn) {
                            if (error) {
                                cb2("数据库连接失败");
                            }
                            else {
                                conn.query( sql, sqlParam , function(err,rows){
                                    conn.release();
                                    if(err){
                                        cb2("数据库操作失败");
                                    }
                                    else{
                                        let bValid = (rows.length == 0);
                                        cb2(null,bValid);
                                    }
                                });
                            }
                        });
                    }
                    else{
                        cb2("要更新的机柜不存在")
                        console.log(box)
                    }
                },
                function(bValid, cb3){
                    if(bValid){
                        pool.getReadOnlyConnection(function(error,conn) {
                            if (error) {
                                cb3("数据库连接失败");
                            }
                            else {
                                //先清空之前的参数
                                sqlParam.splice(0,sqlParam.length);
                                sql = "UPDATE sys_box SET box_name = ?, area_num = ?, box_ip = ?, box_port = ? WHERE box_num = ?";

                                sqlParam.push(box.boxName)
                                sqlParam.push(box.areaNum)
                                sqlParam.push(box.boxIP)
                                sqlParam.push(box.boxPort)
                                sqlParam.push(boxNum)

                                conn.query( sql,sqlParam, function(err){
                                    conn.release();
                                    if(err){
                                        cb3("数据库操作失败");
                                    }
                                    else{
                                        cb3(null,true);
                                    }
                                });
                            }
                        });
                    }
                    else{
                        cb3("当前区域存在同名的机柜")
                    }
                },
                //接着更新 sys_config_update_log 表
                function(bSucceeded, cb){
                    if(bSucceeded){
                        pool.getConnection(function (error, conn) {
                            if (error) {
                                cb("数据库连接失败");
                            } else {
                                let sql = "CALL spb_update_sys_config_update_from_systables()"
                                conn.query(sql, function (err) {
                                    conn.release();
                                    if (err) {
                                        cb("机柜更新失败-3");
                                    }
                                    else {
                                        cb(null, "机柜更新成功")
                                    }
                                })
                            }
                        })
                    }
                    else{
                        cb("机柜更新失败-2")
                    }
                }
            ],
            function(err, result){
                cb(err, result)
            }
        )
    }
    else{
        cb("请输入正确的机柜编号")
    }
}

exports.insertBox = function(box, cb){
    let sql = "";
    let sqlParam = [];
    async.waterfall(
        [
            // 判断输入的参数是否有效
            // 1、是否同一区域存在同名的其他机柜
            function(cb2){
                sql = "SELECT box_num FROM sys_box WHERE box_name = ? AND area_num = ?";
                sqlParam.splice(0, sqlParam.length)
                sqlParam.push(box.boxName)
                sqlParam.push(box.areaNum)
                pool.getReadOnlyConnection(function(error,conn) {
                    if (error) {
                        cb2("数据库连接失败");
                    }
                    else {
                        conn.query( sql, sqlParam , function(err,rows){
                            conn.release();
                            if(err){
                                cb2("数据库操作失败");
                            }
                            else{
                                let bValid = (rows.length == 0);
                                cb2(null,bValid);
                            }
                        });
                    }
                });
            },
            function(bValid, cb3){
                if(bValid){
                    pool.getReadOnlyConnection(function(error,conn) {
                        if (error) {
                            cb3("数据库连接失败");
                        }
                        else {
                            //先清空之前的参数
                            sqlParam.splice(0,sqlParam.length);
                            sql = "INSERT INTO sys_box(box_name, area_num, box_ip, box_port,insert_dt) VALUES(?,?,?,?, NOW())";

                            sqlParam.push(box.boxName)
                            sqlParam.push(box.areaNum)
                            sqlParam.push(box.boxIP)
                            sqlParam.push(box.boxPort)

                            conn.query( sql,sqlParam, function(err){
                                conn.release();
                                if(err){
                                    cb3("数据库操作失败");
                                }
                                else{
                                    cb3(null,true);
                                }
                            });
                        }
                    });
                }
                else{
                    cb3("当前区域存在同名的机柜")
                }
            },
            //接着更新 sys_config_update_log 表
            function(bSucceeded, cb){
                if(bSucceeded){
                    pool.getConnection(function (error, conn) {
                        if (error) {
                            cb("数据库连接失败");
                        } else {
                            let sql = "CALL spb_update_sys_config_update_from_systables()"
                            conn.query(sql, function (err) {
                                conn.release();
                                if (err) {
                                    cb("机柜新增失败-3");
                                }
                                else {
                                    cb(null, "机柜新增成功")
                                }
                            })
                        }
                    })
                }
                else{
                    cb("机柜新增失败-2")
                }
            }
        ],
        function(err, result){
            cb(err, result)
        }
    )
}

// 返回适配datatable的装置列表
exports.getAdminDeviceList = function(param, cb){
    /*这是datatable自带的变量*/
    let draw   = param.sEcho;            //这个是请求时候带过来请求编号，原封不动的还给client
    let start  = parseInt(param.start);  //起始行数(不是起始页数哦)，从0开始
    let length = parseInt(param.length); //每页的数据条数

    async.auto({
            checkParam: function (cb) {
                let whereClause = "";
                // 这儿没有额外的查询条件
                cb(null,whereClause);
            },
            total: ['checkParam', function (cb1, results) {
                pool.getReadOnlyConnection(function(error,conn) {
                    if (error) {
                        cb1("error_db_connect", null);
                    }
                    else {
                        let sql = heredoc( function () {/*
                         select count(1) AS cnt
                         from
                         (
                           SELECT id
                           FROM   sys_device
                         ) a
                         where  1 = 1
                         __whereClause__
                         */});
                        sql = sql.replace(/__whereClause__/,results.checkParam);
                        conn.query( sql, function(err,rows){
                            conn.release();
                            if(err){
                                console.log(sql)
                                cb1("error_db_query",null)
                            }
                            else{
                                cb1(null,rows[0]['cnt'])
                            }
                        });

                    }
                });
            }],
            data: ['checkParam', function (cb2, results) {
                pool.getReadOnlyConnection(function(error,conn) {
                    if (error) {
                        cb2("error_db_connect", null);
                    }
                    else {
                        let sql = heredoc( function () {/*
                         SELECT * FROM
                         (
                           SELECT d.id,d.dev_num,d.hum_set_value,d.hum_return_diff,d.hum_adjust_value,d.hum_high_limit,d.temp_high_limit,d.temp_low_limit
                                 ,d.heat_start_temp,d.heat_return_diff,d.dev_type,d.hum_w,d.heat_w,d.insert_dt,d.update_dt
			                     ,d.box_num,b.box_name,b.box_ip,b.box_port,b.area_num
                                 ,a.area_name
                           FROM   sys_device d
                                  LEFT JOIN sys_box b  ON d.box_num = b.box_num
                                  LEFT JOIN sys_area a ON b.area_num = a.area_num
                         ) a
                         where  1 = 1
                         __whereClause__
                         order by id asc
                         limit ?,?
                         */});
                        sql = sql.replace(/__whereClause__/,results.checkParam);
                        let sqlParams = [start,length];
                        conn.query( sql,sqlParams, function(err,rows){
                            conn.release();
                            if(err){
                                cb2("error_db_query",null);
                                console.log(sql);
                            }
                            else{
                                cb2(null,rows);
                            }
                        });
                    }
                });
            }]
        },function(err,results){
            if(err){
                console.log(err)
                cb({"errorCode":-1,"errorMsg":'获取装置列表失败'},null);
            }
            else{
                let data = {draw:draw,data:results.data,recordsTotal:results.total,recordsFiltered:results.total};
                cb(null,data);
            }
        }
    );
}

exports.updateDevice = function(device, cb){
    let id = parseInt(device.id)
    let sql = "";
    let sqlParam = [];
    if(id){
        async.waterfall(
            [
                //判断传过来的id是否存在
                function (cb1) {
                    let bExists = false;
                    sql = "SELECT id FROM sys_device WHERE id = ? ";
                    sqlParam.push(id);
                    pool.getReadOnlyConnection(function(error,conn) {
                        if (error) {
                            cb1("数据库连接失败");
                        }
                        else {
                            conn.query( sql, sqlParam , function(err,rows){
                                conn.release();
                                if(err){
                                    cb1("数据库操作失败");
                                }
                                else{
                                    bExists = (rows.length == 1);
                                    cb1(null,bExists);
                                }
                            });
                        }
                    });
                },
                //判断传过来的信息是否有效
                function(bExists, cb){
                    if(bExists){
                        sqlParam.splice(0,sqlParam.length);
                        // 判断是否存在另外一个id，机柜和装置号和要更新的信息一样的；这样是有问题的
                        sql = "SELECT box_num FROM sys_device WHERE id <> ? AND box_num = ? AND dev_num = ? ";
                        sqlParam.push(id, device.boxNum, device.devNum);
                        pool.getReadOnlyConnection(function(error,conn) {
                            if (error) {
                                cb("数据库连接失败");
                            }
                            else {
                                conn.query( sql, sqlParam , function(err,rows){
                                    conn.release();
                                    if(err){
                                        cb("数据库操作失败");
                                    }
                                    else{
                                        let bValid = (rows.length == 0);
                                        cb(null,bValid);
                                    }
                                });
                            }
                        });
                    }
                    else{
                        cb("要更新的除湿机ID不存在")
                    }
                },
                //更新sys_device表
                function(bValid, cb2){
                    if(bValid){
                        pool.getReadOnlyConnection(function(error,conn) {
                            if (error) {
                                cb2("数据库连接失败");
                            }
                            else {
                                //先清空之前的参数
                                sqlParam.splice(0,sqlParam.length);
                                sql = heredoc(function () {/*
                                UPDATE sys_device SET box_num= ?, dev_num= ?, hum_set_value= ?, hum_return_diff= ?, hum_adjust_value= ?
                                                    , hum_high_limit= ?, temp_high_limit= ?, temp_low_limit= ?, heat_start_temp= ?
                                                    , heat_return_diff= ?, dev_type= ?, hum_w= ?, heat_w= ?
                                WHERE id = ?
                                */});

                                sqlParam.push(device.boxNum)
                                sqlParam.push(device.devNum)

                                sqlParam.push(device.humSetValue)
                                sqlParam.push(device.humReturnDiff)
                                sqlParam.push(device.humAdjustValue)

                                sqlParam.push(device.humHighLimit)
                                sqlParam.push(device.tempHighLimit)
                                sqlParam.push(device.tempLowLimit)

                                sqlParam.push(device.heatStartTemp)
                                sqlParam.push(device.heatReturnDiff)
                                sqlParam.push(device.devType)

                                sqlParam.push(device.humW)
                                sqlParam.push(device.heatW)

                                sqlParam.push(id)

                                conn.query( sql,sqlParam, function(err,rows){
                                    conn.release();
                                    if(err){
                                        cb2("数据库操作失败");
                                    }
                                    else{
                                        cb2(null, true);
                                    }
                                });
                            }
                        })
                    }
                    else{
                        cb("该机柜已存在同样的装置号")
                    }
                },
                //接着更新 sys_config_update_log 表
                function(bSucceeded, cb){
                    if(bSucceeded){
                        pool.getConnection(function (error, conn) {
                            if (error) {
                                cb("数据库连接失败");
                            } else {
                                let sql = "CALL spb_update_sys_config_update_from_systables()"
                                conn.query(sql, function (err) {
                                    conn.release();
                                    if (err) {
                                        cb("除湿机更新失败-3");
                                    }
                                    else {
                                        cb(null, "除湿机更新成功")
                                    }
                                })
                            }
                        })
                    }
                    else{
                        cb("除湿机更新失败-2")
                    }
                }
            ],
            function(err, result){
                cb(err, result)
            }

        )
    }
    else{
        cb("请输入正确的装置ID")
    }
}

exports.insertDevice = function(device, cb){
    let sql = "";
    let sqlParam = [];
    async.waterfall(
        [
            // 先判断是否已经存在同一个box_num和dev_num的组合
            function(cb){
                pool.getConnection(function (error, conn) {
                    if (error) {
                        cb("error_db_connect", "数据库连接失败");
                    }
                    else {
                        sql = heredoc(function () {/*
                         select id
                         from   sys_device
                         where  box_num = ? AND dev_num = ?;
                         */});
                        sqlParam.push(device.boxNum)
                        sqlParam.push(device.devNum)
                        conn.query(sql,sqlParam, function (error, rows) {
                            conn.release();
                            if (error) {
                                cb("数据库查询失败");
                            } else {
                                cb(null, rows.length);
                            }
                        })
                    }
                })
            },
            function(count, cb){
                if(count > 0){
                    cb("已存在同样的除湿机")
                }
                else{
                    pool.getConnection(function (error, conn) {
                        if (error) {
                            cb("数据库连接失败");
                        }
                        else {
                            sql = heredoc(function () {/*
                             INSERT INTO sys_device(box_num, dev_num, hum_set_value, hum_return_diff, hum_adjust_value, hum_high_limit
                                                  , temp_high_limit, temp_low_limit, heat_start_temp, heat_return_diff, dev_type
                                                  , hum_w, heat_w, insert_dt)
                             VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
                             */});
                            sqlParam.splice(0,sqlParam.length);

                            sqlParam.push(device.boxNum)
                            sqlParam.push(device.devNum)

                            sqlParam.push(device.humSetValue)
                            sqlParam.push(device.humReturnDiff)
                            sqlParam.push(device.humAdjustValue)

                            sqlParam.push(device.humHighLimit)
                            sqlParam.push(device.tempHighLimit)
                            sqlParam.push(device.tempLowLimit)

                            sqlParam.push(device.heatStartTemp)
                            sqlParam.push(device.heatReturnDiff)
                            sqlParam.push(device.devType)

                            sqlParam.push(device.humW)
                            sqlParam.push(device.heatW)

                            conn.query(sql, sqlParam, function (error, rows) {
                                conn.release();
                                if (error) {
                                    cb("数据库查询失败");
                                } else {
                                    cb(null, true);
                                }
                            })
                        }
                    })
                }
            },
            //接着更新 sys_config_update_log 表
            function(bSucceeded, cb){
                if(bSucceeded){
                    pool.getConnection(function (error, conn) {
                        if (error) {
                            cb("数据库连接失败");
                        } else {
                            let sql = "CALL spb_update_sys_config_update_from_systables()"
                            conn.query(sql, function (err) {
                                conn.release();
                                if (err) {
                                    cb("除湿机新增失败-3");
                                }
                                else {
                                    cb(null, "除湿机新增成功")
                                }
                            })
                        }
                    })
                }
                else{
                    cb("除湿机新增失败-2")
                }
            }
        ],
        function(err,result){
            cb(err, result)
        }
    )
}


// 返回适配datatable的dev_config表
exports.getAdminDevConfig = function(param, cb){
    /*这是datatable自带的变量*/
    let draw   = param.sEcho;            //这个是请求时候带过来请求编号，原封不动的还给client
    let start  = parseInt(param.start);  //起始行数(不是起始页数哦)，从0开始
    let length = parseInt(param.length); //每页的数据条数

    async.auto({
            checkParam: function (cb) {
                let whereClause = "";
                // 这儿没有额外的查询条件
                cb(null,whereClause);
            },
            total: ['checkParam', function (cb1, results) {
                pool.getReadOnlyConnection(function(error,conn) {
                    if (error) {
                        cb1("error_db_connect", null);
                    }
                    else {
                        let sql = heredoc( function () {/*
                         select count(1) AS cnt
                         from
                         (
                           SELECT area_num,box_num
                           FROM   dev_config
                         ) a
                         where  1 = 1
                         __whereClause__
                         */});
                        sql = sql.replace(/__whereClause__/,results.checkParam);
                        conn.query( sql, function(err,rows){
                            conn.release();
                            if(err){
                                console.log(sql)
                                cb1("error_db_query",null)
                            }
                            else{
                                cb1(null,rows[0]['cnt'])
                            }
                        });

                    }
                });
            }],
            data: ['checkParam', function (cb2, results) {
                pool.getReadOnlyConnection(function(error,conn) {
                    if (error) {
                        cb2("error_db_connect", null);
                    }
                    else {
                        let sql = heredoc( function () {/*
                         SELECT * FROM
                         (
                           SELECT area_num, box_num, box_name, dev_num, box_ip, box_port, hum_set_value, hum_return_diff, hum_adjust_value
                                , hum_high_limit, temp_high_limit, temp_low_limit, heat_start_temp, heat_return_diff, dev_type
                                , hum_w, heat_w, insert_dt, update_dt
                           FROM   dev_config
                         ) a
                         where  1 = 1
                         __whereClause__
                         order by area_num asc,box_num asc,dev_num asc
                         limit ?,?
                         */});
                        sql = sql.replace(/__whereClause__/,results.checkParam);
                        let sqlParams = [start,length];
                        conn.query( sql,sqlParams, function(err,rows){
                            conn.release();
                            if(err){
                                cb2("error_db_query",null);
                                console.log(sql);
                            }
                            else{
                                cb2(null,rows);
                            }
                        });
                    }
                });
            }]
        },function(err,results){
            if(err){
                console.log(err)
                cb({"errorCode":-1,"errorMsg":'获取DEV_CONFIG信息失败'},null);
            }
            else{
                let data = {draw:draw,data:results.data,recordsTotal:results.total,recordsFiltered:results.total};
                cb(null,data);
            }
        }
    );
}

// 返回适配datatable的 sys_config_update_log 表
exports.getSysConfigUpdateLog = function(param, cb){
    /*这是datatable自带的变量*/
    let draw   = param.sEcho;            //这个是请求时候带过来请求编号，原封不动的还给client
    let start  = parseInt(param.start);  //起始行数(不是起始页数哦)，从0开始
    let length = parseInt(param.length); //每页的数据条数

    async.auto({
            checkParam: function (cb) {
                let whereClause = "";
                // 这儿没有额外的查询条件
                cb(null,whereClause);
            },
            total: ['checkParam', function (cb1, results) {
                pool.getReadOnlyConnection(function(error,conn) {
                    if (error) {
                        cb1("error_db_connect", null);
                    }
                    else {
                        let sql = heredoc( function () {/*
                         select count(1) AS cnt
                         from
                         (
                           SELECT id
                           FROM   sys_config_update_log
                         ) a
                         where  1 = 1
                         __whereClause__
                         */});
                        sql = sql.replace(/__whereClause__/,results.checkParam);
                        conn.query( sql, function(err,rows){
                            conn.release();
                            if(err){
                                console.log(sql)
                                cb1("error_db_query",null)
                            }
                            else{
                                cb1(null,rows[0]['cnt'])
                            }
                        });

                    }
                });
            }],
            data: ['checkParam', function (cb2, results) {
                pool.getReadOnlyConnection(function(error,conn) {
                    if (error) {
                        cb2("error_db_connect", null);
                    }
                    else {
                        let sql = heredoc( function () {/*
                         SELECT * FROM
                         (
                           SELECT id, global_config_update_time, sys_area_update_time, sys_box_update_time, sys_device_update_time
                                , dev_config_update_time, dev_config_signal_time, insert_dt, update_dt
                           FROM   sys_config_update_log
                         ) a
                         where  1 = 1
                         __whereClause__
                         order by id
                         limit ?,?
                         */});
                        sql = sql.replace(/__whereClause__/,results.checkParam);
                        let sqlParams = [start,length];
                        conn.query( sql,sqlParams, function(err,rows){
                            conn.release();
                            if(err){
                                cb2("error_db_query",null);
                                console.log(sql);
                            }
                            else{
                                cb2(null,rows);
                            }
                        });
                    }
                });
            }]
        },function(err,results){
            if(err){
                console.log(err)
                cb({"errorCode":-1,"errorMsg":'获取DEV_CONFIG信息失败'},null);
            }
            else{
                let data = {draw:draw,data:results.data,recordsTotal:results.total,recordsFiltered:results.total};
                cb(null,data);
            }
        }
    );
}

// 重新生成dev_config表，数据库里执行spb_recreate_dev_config
exports.recreateDevConfig = function(cb){
    async.auto(
        {
            doUpdate:function(cb){
                pool.getConnection(function (error, conn) {
                    if (error) {
                        cb("数据库连接失败");
                    } else {
                        let sql = "CALL spb_recreate_dev_config()"
                        conn.query(sql, function (err) {
                            conn.release();
                            if (err) {
                                cb("DEV_CONFIG重新生成失败");
                            }
                            else {
                                cb(null, "DEV_CONFIG重新生成成功")
                            }
                        })
                    }
                })
            }
        },
        function(err, results){
            cb(err, results.doUpdate)
        }
    )
}


// 生成dev_config表更新信号，数据库里执行 spb_signal_dev_config
exports.signalDevConfig = function(cb){
    async.auto(
        {
            doUpdate:function(cb){
                pool.getConnection(function (error, conn) {
                    if (error) {
                        cb("数据库连接失败");
                    } else {
                        let sql = "CALL spb_signal_dev_config()"
                        conn.query(sql, function (err) {
                            conn.release();
                            if (err) {
                                cb("DEV_CONFIG更新信号生成失败");
                            }
                            else {
                                cb(null, "DEV_CONFIG更新信号生成成功")
                            }
                        })
                    }
                })
            }
        },
        function(err, results){
            cb(err, results.doUpdate)
        }
    )
}