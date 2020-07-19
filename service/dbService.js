let pool  = require('./../libs/dbpool')
let async = require('async')
let _ = require('underscore')
let validator = require('validator')
let moment = require('moment')

//只有接口里会用到的函数，为了写sql方便，不用拼字符串
let heredoc = function(fn) {
    return fn.toString().split('\n').slice(1,-1).join('\n') + '\n'
};

exports.checkUserLogin = function(loginData, cb){
    async.auto(
        {
            checkExists:function(cb){
                pool.getConnection(function (error, conn) {
                    if (error) {
                        cb("数据库连接失败");
                    } else {
                        let sql = "SELECT username FROM sys_user WHERE username = ? AND pwd = ? AND is_valid = 'T' LIMIT 1"
                        let sqlParams = [loginData.userName, loginData.password]
                        conn.query(sql, sqlParams, function (err, rows) {
                            conn.release();
                            if (!err && rows.length == 1) {
                                cb(null);
                            }
                            else {
                                console.log(err)
                                cb("密码验证失败")
                            }
                        })
                    }
                })
            }
        },
        function(err){
            cb(err)
        }
    )
}

exports.updatePassword = function(d, cb){
    async.waterfall(
        [
            //判断用户名密码是否正确
            function(cb){
                pool.getConnection(function (error, conn) {
                    if (error) {
                        cb("数据库连接失败");
                    } else {
                        let sql = heredoc(function () {/*
                         select username
                         from   sys_user
                         where  username = ? and pwd = ?;
                         */});
                        conn.query(sql,[d.userName, d.passwordOld], function (error, rows) {
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
            //判断并更新sys_user表
            function(count, cb) {
                if(count == 1){
                    pool.getConnection(function (error, conn) {
                        if (error) {
                            cb("数据库连接失败");
                        } else {
                            let sql = heredoc(function () {/*
                             update sys_user
                             set    pwd = ?
                             where  username = ?
                             */});

                            conn.query(sql, [d.passwordNew, d.userName], function (err, rows) {
                                conn.release();
                                // console.log(sql)
                                if (err) {
                                    // console.log(err)
                                    cb("用户名密码更新错误-1");
                                }
                                else {
                                    cb(null)
                                }
                            })
                        }
                    })
                }
                else{
                    cb("用户名密码不匹配")
                }
            }
        ],function(err){
            cb(err)
        }
    )
}

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

// 返回全站的概览数据
exports.getStationSummary = function(cb){
    async.auto({
        summaryData:function(cb1){
            pool.getConnection(function (error, conn) {
                if (error) {
                    console.log(error)
                    cb1("error_db_connect", null);
                } else {
                    // 只取数据库中id为1的那一条
                    let sql = heredoc(function () {/*
                     call spq_summary_data()
                     */});
                    // console.log(sql)
                    conn.query(sql, function (error, rows) {
                        conn.release();
                        if (error || rows.length == 0) {
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
            cb({"errorCode":-1,"errorMsg":'获取概览数据失败'},null);
        } else {
            cb(null,results.summaryData[0]);
        }
    });
}


// 返回区域的概览数据
exports.getAreaSummary = function(areaNum, cb){
    async.auto({
        summaryData:function(cb1){
            pool.getConnection(function (error, conn) {
                if (error) {
                    console.log(error)
                    cb1("error_db_connect", null);
                } else {
                    // 只取数据库中id为1的那一条
                    let sql = heredoc(function () {/*
                     call spq_summary_data_by_areanum(?)
                     */});
                    let sqlParam = [areaNum]
                    // console.log(sql)
                    conn.query(sql, sqlParam, function (error, rows) {
                        conn.release();
                        if (error || rows.length == 0) {
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
            cb({"errorCode":-1,"errorMsg":'获取概览数据失败'},null);
        } else {
            cb(null,results.summaryData[0]);
        }
    });
}

exports.getDevices = function(params, cb){
    let page = params.page
    let pageSize = params.pageSize
    let areaNum = params.areaNum

    async.auto({
        paramCheck:function(cb){
            //TODO:参数检查
            cb(null,null);
        },
        deviceCount:['paramCheck',function(cb, dummy){
            //由于要分页，先得算算总数
            pool.getReadOnlyConnection(function (error, conn) {
                if(error){
                    cb("数据库连接失败", null);
                }else{
                    var sql = heredoc(function () {/*
                             select  count(*) as count
                             from    newest_data
                             __WHERE_CLAUSE__
                     */});
                    var sqlParams = [  ];//where条件后续添加
                    //这里查询条件比较烦，我还没想好怎么做
                    var whereClause = 'where 1=1';
                    if(areaNum)    {whereClause+=' and area_num =?';     sqlParams.push(areaNum)};
                    //最终将whereClause拼接上去
                    sql = sql.replace(/__WHERE_CLAUSE__/g,whereClause);

                    conn.query(sql, sqlParams, function (error, rows) {
                        conn.release();
                        if (error){
                            console.log(error)
                            cb("查询除湿机列表失败-2", null)
                        }else if(_.isEmpty(rows)){
                            cb("没有找到除湿机-1", null);
                        }else{
                            cb(null,rows[0]['count']);
                        }
                    });
                }
            });
        }],
        devices:['paramCheck',function(cb,dummy){
            //获取除湿机列表
            pool.getReadOnlyConnection(function (error, conn) {
                if(error){
                    cb("数据库连接失败", null);
                }else{
                    let sql = heredoc(function () {/*
                             select t.time, t.area_num,sa.area_name, t.box_num,sb.box_name, t.dev_num, t.hum_value, t.temp_value, t.valid
                                   ,t.dehum_state, t.heat_state, t.dehum_total_time, t.heat_total_time, t.hum_set_value, t.hum_return_diff
                                   ,t.hum_adjust_value, t.heat_start_temp, t.heat_return_diff
                                   ,ROUND(t.dehum_total_wh,2) AS dehum_total_wh, ROUND(t.heat_total_wh,2) AS heat_total_wh
                             from newest_data t
                                  LEFT JOIN sys_area sa ON t.area_num = sa.area_num
                                  LEFT JOIN sys_box  sb ON t.box_num = sb.box_num
                             __WHERE_CLAUSE__
                             __ORDERBY_CLAUSE__
                             limit ?,?
                     */});
                    let sqlParams = [   ];//where条件后续添加

                    //这里查询条件比较烦，我还没想好怎么做
                    let whereClause = 'where 1=1 ';
                    if(areaNum)    {whereClause+=' and t.area_num=?';     sqlParams.push(parseInt(areaNum))};

                    //最终将whereClause和orderClause拼接上去
                    sql = sql.replace(/__WHERE_CLAUSE__/g,whereClause)

                    sql = sql.replace(/__ORDERBY_CLAUSE__/,'order by box_num')
                    sqlParams = sqlParams.concat([ (page-1)*pageSize , pageSize]);
                    conn.query(sql, sqlParams, function (error, rows) {
                        // console.log(sql)
                        conn.release();
                        if (error){
                            console.log(error)
                            cb("查询除湿机列表失败-2", null);
                        }else if(rows.length==0){
                            //如果搜索结果不存在，则直接跳出
                            cb("没有找到除湿机-1", null);
                        } else{
                            cb(null, rows||[]);
                        }
                    });
                }
            });
        }]
    },function(error,results){
        if (error) {
            console.log(error)
            cb({"errorCode": -1, "errorMsg": "查询除湿机列表异常"});
        } else {
            cb(null, {"errorCode": 200, "errorMsg": "", data: results.devices,page:page,totalPage:Math.ceil(parseFloat(results.deviceCount)/pageSize),totalRecords:results.deviceCount});
        }
    });
}

// 返回全站的用量数据
exports.getStationSummaryUsage = function(cb){
    async.auto({
        summaryUsageData:function(cb1){
            pool.getConnection(function (error, conn) {
                if (error) {
                    console.log(error)
                    cb1("error_db_connect", null);
                } else {
                    // 只取数据库中id为1的那一条
                    let sql = heredoc(function () {/*
                     call spq_summary_usage_data()
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
            cb({"errorCode":-1,"errorMsg":'获取概览数据失败'},null);
        } else {
            cb(null,results.summaryUsageData);
        }
    });
}

// 返回除湿机的温湿度数据
exports.getDevice = function(deviceInfo, cb){
    async.auto({
        deviceInfo:function(cb1){
            pool.getConnection(function (error, conn) {
                if (error) {
                    console.log(error)
                    cb1("error_db_connect", null);
                } else {
                    // 只取数据库中id为1的那一条
                    let sql = heredoc(function () {/*
                     call spq_summary_data_by_devinfo(?,?,?)
                     */});
                    // console.log(sql)
                    let sqlParams = [deviceInfo.areaNum, deviceInfo.boxNum, deviceInfo.devNum]
                    conn.query(sql, sqlParams, function (error, rows) {
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
            cb({"errorCode":-1,"errorMsg":'获取概览数据失败'},null);
        } else {
            cb(null,results.deviceInfo[0]);
        }
    });
}

// 返回除湿机的温湿度数据
exports.getDeviceTempAndHum = function(deviceInfo, cb){
    async.auto({
        tempAndHum:function(cb1){
            pool.getConnection(function (error, conn) {
                if (error) {
                    console.log(error)
                    cb1("error_db_connect", null);
                } else {
                    let sql = heredoc(function () {/*
                     select time,hum_value,hum_set_value, hum_return_diff,temp_value,heat_start_temp,heat_return_diff
                     from   history_data
                     where  area_num = ? and box_num = ? and dev_num = ? and datediff(time,current_date()) = 0 and valid = 1
                     order  by time asc
                     */});
                    // console.log(sql)
                    let sqlParams = [deviceInfo.areaNum, deviceInfo.boxNum, deviceInfo.devNum]
                    conn.query(sql, sqlParams, function (error, rows) {
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
            cb({"errorCode":-1,"errorMsg":'获取概览数据失败'},null);
        } else {
            cb(null,results.tempAndHum);
        }
    });
}

// 返回除湿机的用电量统计数据
exports.getDeviceSummaryUsage = function(deviceInfo, cb){
    async.auto({
        summaryUsage:function(cb1){
            pool.getConnection(function (error, conn) {
                if (error) {
                    console.log(error)
                    cb1("error_db_connect", null);
                } else {
                    // 只取数据库中id为1的那一条
                    let sql = heredoc(function () {/*
                     call spq_summary_device_usage_data(?,?,?)
                     */});
                    // console.log(sql)
                    let sqlParams = [deviceInfo.areaNum, deviceInfo.boxNum, deviceInfo.devNum]
                    conn.query(sql, sqlParams, function (error, rows) {
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
            cb({"errorCode":-1,"errorMsg":'获取概览数据失败'},null);
        } else {
            cb(null,results.summaryUsage);
        }
    });
}

exports.getAlarmList = function(searchParams, cb){
    async.auto({
        alarms:function(cb1){
            pool.getConnection(function (error, conn) {
                if (error) {
                    console.log(error)
                    cb1("error_db_connect", null);
                } else {
                    // 只取数据库中id为1的那一条
                    let sql = heredoc(function () {/*
                     call spq_alarms(?,?,?,?,?)
                     */});
                    // console.log(sql)
                    let sqlParams = [searchParams.areaNum, searchParams.boxNum, searchParams.devNum, searchParams.beginDate, searchParams.endDate]
                    conn.query(sql, sqlParams, function (error, rows) {
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
            cb({"errorCode":-1,"errorMsg":'获取告警信息失败'},null);
        } else {
            cb(null,results.alarms);
        }
    });
}

exports.getAlarmListDT = function(param, cb){
    /*这是datatable自带的变量*/
    let draw   = param.sEcho;            //这个是请求时候带过来请求编号，原封不动的还给client
    let start  = parseInt(param.start)? parseInt(param.start):0  //起始行数(不是起始页数哦)，从0开始
    let length = parseInt(param.length)?parseInt(param.length):10; //每页的数据条数

    let areaNum = parseInt(param.areaNum)
    let boxNum = parseInt(param.boxNum)
    let devNum = parseInt(param.devNum)

    let bDate = param.beginDate? param.beginDate:""
    let eDate = param.endDate? param.endDate:""

    let beginDate = validator.isISO8601(bDate) ? moment(bDate).format("YYYY-MM-DD") : moment(new Date()).add(-1, 'month').format("YYYY-MM-DD")
    let endDate = validator.isISO8601(eDate) ? moment(eDate).add(1, 'days').format("YYYY-MM-DD") : moment(new Date()).add(1, 'days').format("YYYY-MM-DD")

    async.auto({
            checkParam: function (cb) {
                var whereClause = " and a.time >= '"+beginDate+"' AND a.time < '"+endDate+"' ";

                if(areaNum && areaNum != -1) whereClause += " and a.area_num = " + areaNum + " "
                if(boxNum && boxNum != -1) whereClause += " and a.box_num = " + boxNum + " "
                if(devNum && devNum != -1) whereClause += " and a.dev_num = " + devNum + " "

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
                           SELECT a.time, a.area_num, a.box_num, a.dev_num, a.type, a.status
                                      ,sa.area_name,sb.box_name
                                      ,t.type_name
                           FROM    history_alarm a
                                       LEFT JOIN sys_area sa ON a.area_num = sa.area_num
                                       LEFT JOIN sys_box     sb ON a.box_num = sb.box_num
                                       LEFT JOIN alarm_type t ON a.type = t.type_id
                           WHERE  1 = 1
                           __whereClause__
                         ) a

                         */});
                        sql = sql.replace(/__whereClause__/,results.checkParam);
                       // console.log(sql);
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
                           SELECT a.time, a.area_num, a.box_num, a.dev_num, a.type, a.status
                                      ,sa.area_name,sb.box_name
                                      ,t.type_name
                           FROM    history_alarm a
                                       LEFT JOIN sys_area sa ON a.area_num = sa.area_num
                                       LEFT JOIN sys_box     sb ON a.box_num = sb.box_num
                                       LEFT JOIN alarm_type t ON a.type = t.type_id
                           WHERE  1 = 1
                           __whereClause__
                           ORDER BY time DESC,a.area_num,a.box_num,a.dev_num
                           limit ?,?
                         */});
                        sql = sql.replace(/__whereClause__/,results.checkParam);
                       console.log(sql);
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
                console.log(err)
                cb({"errorCode":-1,"errorMsg":'获取告警列表失败'},null);
            }
            else{
                var data = {draw:draw,data:results.data,recordsTotal:results.total,recordsFiltered:results.total};
                cb(null,data);
            }
        }
    );
}

exports.getPointData = function(points, date, cb){
    async.concat(points,
        function(point, cb1){
            pool.getReadOnlyConnection(function(error,conn){
                if(error){
                    console.log("db connect error");
                    cb1(null, null);
                }
                else{
                    var sql = heredoc( function () {/*
                                 select __COLUMN__
                                 from   history_data
                                 where  area_num = ? AND box_num = ? AND dev_num = ? AND valid = 1 AND datediff(time,?) = 0 and valid = 1
                                 order  by time
                                 */});

                    var point_info = point.split('_')
                    var column_name = ""
                    var show_column_name = ""
                    switch(point_info[3]){
                        case "TEMP":
                            column_name = "temp_value"
                            show_column_name = "temp_value"
                            break;
                        case "TEMPSET":
                            column_name = "heat_start_temp"
                            show_column_name = "heat_start_temp"
                            break;
                        case "TEMPRETURN":
                            column_name = "heat_start_temp+heat_return_diff AS heat_return_value"
                            show_column_name = "heat_return_value"
                            break;
                        case "HUM":
                            column_name = "hum_value"
                            show_column_name = "hum_value"
                            break;
                        case "HUMSET":
                            column_name = "hum_set_value"
                            show_column_name = "hum_set_value"
                            break;
                        case "HUMRETURN":
                            column_name = "hum_set_value-hum_return_diff AS hum_return_value"
                            show_column_name = "hum_return_value"
                            break;
                        default:
                            column_name = "hum_value"
                    }
                    sql = sql.replace('__COLUMN__', column_name)

                    var sqlParams = []
                    sqlParams.push(point_info[0])
                    sqlParams.push(point_info[1])
                    sqlParams.push(point_info[2])
                    sqlParams.push(date)

                    conn.query( sql, sqlParams, function(err,rows){
                        conn.release();
                        if(err){
                            console.log("db query error");
                            cb1(null, null);
                        }
                        else{
                            var array_point = []
                            for(i=0; i<rows.length; i++)
                                array_point.push(rows[i][show_column_name])
                            var array_data = {
                                'point': point,
                                'data': array_point
                            }
                            cb1(null, array_data);
                        }
                    });
                }
            });
        },
        function(err, results){
            console.log(results.length)
            cb(null, results)
        }
    )
}

exports.getDownloadData = function(param, cb){
    async.auto({
        hisData:function(cb1){
            pool.getConnection(function (error, conn) {
                if (error) {
                    console.log(error)
                    cb1("error_db_connect", null);
                } else {
                    // 只取数据库中id为1的那一条
                    let sql = heredoc(function () {/*
                     SELECT time, area_num, box_num, dev_num, hum_value, temp_value, valid, dehum_state, heat_state, dehum_total_time, heat_total_time, hum_set_value, hum_return_diff, hum_adjust_value, heat_start_temp, heat_return_diff, dehum_total_wh, heat_total_wh, upload_flag
                     FROM   history_data
                     WHERE  area_num = ? AND box_num = ? AND dev_num = ?
                        AND time >= ?  AND time < DATE_ADD(?, INTERVAL 1 DAY )
                     */});
                    // console.log(sql)
                    let sqlParams = [param.areaNum, param.boxNum, param.devNum, param.beginDate, param.endDate]
                    conn.query(sql, sqlParams, function (error, rows) {
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
            cb({"errorCode":-1,"errorMsg":'获取概览数据失败'},null);
        } else {
            cb(null,results.hisData);
        }
    });
}


// 下面是管理相关的

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
                           ORDER  BY area_num
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
                           ORDER  BY a.area_num, b.box_num
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

// 返回所有装置列表
exports.getDeviceList = function(cb){
    async.auto({
            deviceList:function(cb1){
                pool.getConnection(function (error, conn) {
                    if (error) {
                        console.log(error)
                        cb1("error_db_connect", null);
                    } else {
                        let sql = heredoc(function () {/*
                           SELECT d.id,d.dev_num,d.hum_set_value,d.hum_return_diff,d.hum_adjust_value,d.hum_high_limit,d.temp_high_limit,d.temp_low_limit
                                 ,d.heat_start_temp,d.heat_return_diff,d.dev_type,d.hum_w,d.heat_w,d.insert_dt,d.update_dt
			                     ,d.box_num,b.box_name,b.box_ip,b.box_port,b.area_num
                                 ,a.area_name
                           FROM   sys_device d
                                  INNER JOIN sys_box b  ON d.box_num = b.box_num
                                  INNER JOIN sys_area a ON b.area_num = a.area_num
                           ORDER  BY a.area_num,b.box_num,d.dev_num
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
                cb(null,results.deviceList);
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


exports.job_update_sd_dehum_dd = function(){
    async.auto({
        do_update: function (cb1) {
            pool.getReadOnlyConnection(function(error,conn) {
                if (error) {
                    console.log("db connect error");
                    cb1("error_db_connect", null);
                }
                else {
                    var cal_dt = moment().add(-1, 'days').format('YYYY-MM-DD');
                    var sqlParams = [cal_dt]
                    var sql = heredoc( function () {/*
                     CALL spb_update_sd_dehum_dd(?)
                     */});
                    console.log(sql, sqlParams)
                    conn.query( sql, sqlParams, function(err){
                        conn.release();
                        if(err){
                            console.log("db query error");
                            cb1("error_db_query");
                        }
                        else{
                            cb1(null);
                        }
                    });

                }
            });
        }
    },function(err){
        if(err){
            console.log(err)
        }
    });
}