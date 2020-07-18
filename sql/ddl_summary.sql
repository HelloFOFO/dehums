
-- 查询全站统计信息
DROP PROCEDURE IF EXISTS spq_summary_data;
DELIMITER $$
CREATE PROCEDURE spq_summary_data()
BEGIN
DECLARE v_total,v_total_valid,v_total_working, v_cnt_alarms int DEFAULT -1;  

DECLARE v_wsd_lasttime_duration int DEFAULT 0;
DECLARE v_wsd_lasttime datetime;


SELECT COUNT(1) AS total
              ,SUM(CASE WHEN n.valid = 1 THEN 1 ELSE 0 END)  AS total_valid
              ,SUM(CASE WHEN n.valid = 1 AND (n.dehum_state = 1 OR n.heat_state = 1) THEN 1 ELSE 0 END) AS total_working
              ,ROUND((unix_timestamp(NOW())-unix_timestamp(MAX(time)))/60,0) AS wsd_lasttime_duration
              ,MAX(time) AS wsd_last_time
              INTO v_total,v_total_valid,v_total_working,v_wsd_lasttime_duration,v_wsd_lasttime
FROM     newest_data n;

SELECT COUNT(1) AS cnt_alarms INTO v_cnt_alarms
FROM    history_alarm
WHERE DATEDIFF(NOW(), time) = 0 AND status = 0;

SELECT v_total AS total,IFNULL(v_total_valid,0) AS total_valid,IFNULL(v_total_working,0) AS total_working,IFNULL(v_cnt_alarms,0) AS cnt_alarms,
			   v_wsd_lasttime_duration AS wsd_lasttime_duration ,v_wsd_lasttime AS wsd_lasttime;

END$$
DELIMITER ;


-- 查询区域的统计信息
DROP PROCEDURE IF EXISTS spq_summary_data_by_areanum;
DELIMITER $$
CREATE PROCEDURE spq_summary_data_by_areanum(v_area_num int)
BEGIN
DECLARE v_areaname varchar(100);
DECLARE v_total,v_total_valid,v_total_working, v_cnt_alarms int DEFAULT -1;  

DECLARE v_wsd_lasttime_duration int DEFAULT 0;
DECLARE v_wsd_lasttime datetime;

SELECT area_name INTO v_areaname FROM sys_area WHERE area_num = v_area_num;

SELECT COUNT(1) AS total
              ,SUM(CASE WHEN n.valid = 1 THEN 1 ELSE 0 END)  AS total_valid
              ,SUM(CASE WHEN n.valid = 1 AND (n.dehum_state = 1 OR n.heat_state = 1) THEN 1 ELSE 0 END) AS total_working
              ,ROUND((unix_timestamp(NOW())-unix_timestamp(MAX(time)))/60,0) AS wsd_lasttime_duration
              ,MAX(time) AS wsd_last_time
              INTO v_total,v_total_valid,v_total_working,v_wsd_lasttime_duration,v_wsd_lasttime
FROM     newest_data n
WHERE  v_area_num = n.area_num;

SELECT COUNT(1) AS cnt_alarms INTO v_cnt_alarms
FROM    history_alarm
WHERE DATEDIFF(NOW(), time) = 0 AND area_num = v_area_num AND status = 0;


SELECT v_area_num AS area_num,v_areaname AS area_name,v_total AS total,IFNULL(v_total_valid,0) AS total_valid,IFNULL(v_total_working,0) AS total_working
			  ,IFNULL(v_cnt_alarms,0) AS cnt_alarms,v_wsd_lasttime_duration AS wsd_lasttime_duration ,v_wsd_lasttime AS wsd_lasttime;

END$$
DELIMITER ;



-- 查询区域的统计信息
DROP PROCEDURE IF EXISTS spq_summary_data_by_devinfo;
DELIMITER $$
CREATE PROCEDURE spq_summary_data_by_devinfo(v_area_num int,v_box_num int,v_dev_num int)
BEGIN
DECLARE v_areaname varchar(100);
DECLARE v_boxname varchar(100);
DECLARE v_cnt_alarms int DEFAULT -1;  

SELECT area_name INTO v_areaname FROM sys_area WHERE area_num = v_area_num;
SELECT box_name INTO v_boxname FROM sys_box WHERE box_num = v_box_num;

SELECT COUNT(1) AS cnt_alarms INTO v_cnt_alarms
FROM    history_alarm
WHERE DATEDIFF(NOW(), time) = 0 AND status = 0
	AND area_num = v_area_num
	AND box_num = v_box_num
	AND dev_num = v_dev_num;

SELECT v_area_num AS area_num,v_areaname AS area_name
              ,v_box_num AS box_num,v_boxname AS box_name
			  ,v_dev_num AS dev_num,IFNULL(v_cnt_alarms,0) AS cnt_alarms;

END$$
DELIMITER ;


-- 从 history_data 表里把每天每一台除湿机最后一条数据拿出来，放到一个单独的表里
-- 单独的表名 sd_dehum_dd
CREATE TABLE sd_dehum_dd(
  id int auto_increment,
  cal_dt date,
  last_time timestamp ,
  area_num int(11) ,
  box_num int(11) ,
  dev_num int(11) ,
  hum_value int(11) ,
  temp_value int(11) ,
  valid tinyint(4) ,
  dehum_state tinyint(4) ,
  heat_state tinyint(4) ,
  dehum_total_time double ,
  heat_total_time double ,
  hum_set_value int(11) ,
  hum_return_diff int(11) ,
  hum_adjust_value int(11) ,
  heat_start_temp int(11) ,
  heat_return_diff int(11) ,
  dehum_total_wh double ,
  heat_total_wh double ,
  primary key(id)
);

ALTER TABLE sd_dehum_dd ADD insert_dt datetime DEFAULT NULL;


DROP PROCEDURE IF EXISTS spb_update_sd_dehum_dd;
DELIMITER $$
CREATE PROCEDURE spb_update_sd_dehum_dd(v_cal_dt date)
BEGIN

DELETE FROM sd_dehum_dd WHERE DATEDIFF(cal_dt , v_cal_dt) = 0;

SET @rank:=0;
SET @current_area_num := 0;
SET @current_box_num := 0;
SET @current_dev_num := 0;

INSERT INTO sd_dehum_dd(cal_dt, last_time, area_num, box_num, dev_num, hum_value, temp_value, valid
		   , dehum_state, heat_state, dehum_total_time, heat_total_time, hum_set_value, hum_return_diff, hum_adjust_value 
		   , heat_start_temp, heat_return_diff, dehum_total_wh, heat_total_wh,insert_dt)
SELECT v_cal_dt AS cal_dt,d.time AS last_time,d.area_num, d.box_num, d.dev_num, d.hum_value, d.temp_value, d.valid
			, d.dehum_state, d.heat_state, d.dehum_total_time, d.heat_total_time, d.hum_set_value, d.hum_return_diff, d.hum_adjust_value
			, d.heat_start_temp, d.heat_return_diff, d.dehum_total_wh, d.heat_total_wh,NOW()
FROM(
SELECT h.*
              ,@rank:= CASE WHEN @current_area_num = h.area_num AND @current_box_num = h.box_num AND @current_dev_num = h.dev_num THEN @rank+1 ELSE 1 END AS rank
			  ,@current_area_num:= h.area_num,@current_box_num:= h.box_num,@current_dev_num:= h.dev_num
FROM     history_data h
WHERE  DATEDIFF(v_cal_dt, h.time) = 0 AND valid = 1
ORDER  BY h.area_num ASC,h.box_num ASC,h.dev_num ASC,time DESC
) d
WHERE  rank = 1;


END$$
DELIMITER ;


-- 查询全站每天的统计信息
DROP PROCEDURE IF EXISTS spq_summary_usage_data;
DELIMITER $$
CREATE PROCEDURE spq_summary_usage_data()
BEGIN

-- 创建一个临时表表用来储存0-9的数字
DROP TEMPORARY TABLE IF EXISTS num;
CREATE TEMPORARY TABLE num (i int);
INSERT INTO num (i) VALUES (0), (1), (2), (3), (4), (5), (6), (7);

SELECT dt.cal_dt
              ,CEIL(IFNULL(t.dehum_total_time,0)) AS dehum_total_time
              ,CEIL(IFNULL(t.dehum_total_wh,0)) AS dehum_total_wh
              ,CEIL(IFNULL(t.heat_total_time,0)) AS heat_total_time
              ,CEIL(IFNULL(t.heat_total_wh,0)) AS heat_total_wh
FROM   
(
SELECT DATE_SUB(CURRENT_DATE(), INTERVAL num.i DAY) AS cal_dt
FROM    num
) dt
LEFT JOIN
(
SELECT cal_dt
              ,SUM(dehum_total_time) AS dehum_total_time,SUM(dehum_total_wh) AS dehum_total_wh
              ,SUM(heat_total_time) AS heat_total_time,SUM(heat_total_wh) AS heat_total_wh
FROM    sd_dehum_dd n
WHERE DATEDIFF(NOW(), cal_dt ) <= 7
GROUP BY cal_dt
UNION ALL
SELECT CURRENT_DATE() AS cal_dt
              ,SUM(dehum_total_time) AS dehum_total_time,SUM(dehum_total_wh) AS dehum_total_wh
              ,SUM(heat_total_time) AS heat_total_time,SUM(heat_total_wh) AS heat_total_wh
FROM    newest_data n
WHERE DATEDIFF(CURRENT_DATE(), time ) = 0
) t ON dt.cal_dt = t.cal_dt
ORDER BY dt.cal_dt ASC;

DROP TEMPORARY TABLE IF EXISTS num;

END$$
DELIMITER ;



-- 查询指定除湿机每天的统计信息
DROP PROCEDURE IF EXISTS spq_summary_device_usage_data;
DELIMITER $$
CREATE PROCEDURE spq_summary_device_usage_data(v_area_num int,v_box_num int,v_dev_num int)
BEGIN

-- 创建一个临时表表用来储存0-9的数字
DROP TEMPORARY TABLE IF EXISTS num;
CREATE TEMPORARY TABLE num (i int);
INSERT INTO num (i) VALUES (0), (1), (2), (3), (4), (5), (6), (7);

SELECT dt.cal_dt
              ,CEIL(IFNULL(t.dehum_total_time,0)) AS dehum_total_time
              ,CEIL(IFNULL(t.dehum_total_wh,0)) AS dehum_total_wh
              ,CEIL(IFNULL(t.heat_total_time,0)) AS heat_total_time
              ,CEIL(IFNULL(t.heat_total_wh,0)) AS heat_total_wh
FROM   
(
SELECT DATE_SUB(CURRENT_DATE(), INTERVAL num.i DAY) AS cal_dt
FROM    num
) dt
LEFT JOIN
(
SELECT cal_dt
              ,SUM(dehum_total_time) AS dehum_total_time,SUM(dehum_total_wh) AS dehum_total_wh
              ,SUM(heat_total_time) AS heat_total_time,SUM(heat_total_wh) AS heat_total_wh
FROM    sd_dehum_dd n
WHERE DATEDIFF(NOW(), cal_dt ) <= 7 
      AND area_num = v_area_num
      AND box_num = v_box_num
      AND dev_num = v_dev_num
GROUP BY cal_dt
UNION ALL
SELECT CURRENT_DATE() AS cal_dt
              ,SUM(dehum_total_time) AS dehum_total_time,SUM(dehum_total_wh) AS dehum_total_wh
              ,SUM(heat_total_time) AS heat_total_time,SUM(heat_total_wh) AS heat_total_wh
FROM    newest_data n
WHERE DATEDIFF(CURRENT_DATE(), time ) = 0
      AND area_num = v_area_num
      AND box_num = v_box_num
      AND dev_num = v_dev_num
) t ON dt.cal_dt = t.cal_dt
ORDER BY dt.cal_dt ASC;

DROP TEMPORARY TABLE IF EXISTS num;

END$$
DELIMITER ;



-- 查询报警信息信息
DROP PROCEDURE IF EXISTS spq_alarms;
DELIMITER $$
CREATE PROCEDURE spq_alarms(v_area_num int,v_box_num int,v_dev_num int,v_begin_date date, v_end_date date)
BEGIN

SET v_begin_date= IFNULL(v_begin_date, DATE_ADD(CURRENT_DATE(), INTERVAL -1 MONTH));
SET v_end_date= IFNULL(v_end_date, CURRENT_DATE());

SELECT a.time, a.area_num, a.box_num, a.dev_num, a.type, a.status
              ,sa.area_name,sb.box_name
              ,t.type_name
FROM    history_alarm a
               LEFT JOIN sys_area sa ON a.area_num = sa.area_num
               LEFT JOIN sys_box     sb ON a.box_num = sb.box_num
			   LEFT JOIN alarm_type t ON a.type = t.type_id
WHERE  a.time >= v_begin_date 
       AND a.time < DATE_ADD(v_end_date,INTERVAL 1 DAY)
       AND (v_area_num = -1 OR v_area_num = a.area_num)
       AND (v_box_num = -1 OR v_box_num = a.box_num)
       AND (v_dev_num = -1 OR v_dev_num = a.dev_num)
ORDER  BY time DESC,a.area_num,a.box_num,a.dev_num;

END$$
DELIMITER ;





