
-- 查询全站统计信息
DROP PROCEDURE IF EXISTS spq_summary_data;
DELIMITER $$
CREATE PROCEDURE spq_summary_data()
BEGIN
DECLARE v_total,v_total_valid,v_total_working, v_cnt_alarms int DEFAULT -1;  


SELECT COUNT(1) AS total
              ,SUM(CASE WHEN n.valid = 1 THEN 1 ELSE 0 END)  AS total_valid
              ,SUM(CASE WHEN n.valid = 1 AND (n.dehum_state = 1 OR n.heat_state = 1) THEN 1 ELSE 0 END) AS total_working
              INTO v_total,v_total_valid,v_total_working
FROM     newest_data n;

SELECT COUNT(1) AS cnt_alarms INTO v_cnt_alarms
FROM    history_alarm
WHERE DATEDIFF(NOW(), time) = 0 AND status = 0;

SELECT v_total AS total,IFNULL(v_total_valid,0) AS total_valid,IFNULL(v_total_working,0) AS total_working,IFNULL(v_cnt_alarms,0) AS cnt_alarms;


END$$
DELIMITER ;


-- 查询区域的统计信息
DROP PROCEDURE IF EXISTS spq_summary_data_by_areanum;
DELIMITER $$
CREATE PROCEDURE spq_summary_data_by_areanum(v_area_num int)
BEGIN
DECLARE v_areaname varchar(100);
DECLARE v_total,v_total_valid,v_total_working, v_cnt_alarms int DEFAULT -1;  

SELECT area_name INTO v_areaname FROM sys_area WHERE area_num = v_area_num;

SELECT COUNT(1) AS total
              ,SUM(CASE WHEN n.valid = 1 THEN 1 ELSE 0 END)  AS total_valid
              ,SUM(CASE WHEN n.valid = 1 AND (n.dehum_state = 1 OR n.heat_state = 1) THEN 1 ELSE 0 END) AS total_working
              INTO v_total,v_total_valid,v_total_working
FROM     newest_data n
WHERE  v_area_num = n.area_num;

SELECT COUNT(1) AS cnt_alarms INTO v_cnt_alarms
FROM    history_alarm
WHERE DATEDIFF(NOW(), time) = 0 AND status = 0;


SELECT v_area_num AS area_num,v_areaname AS area_name,v_total AS total,IFNULL(v_total_valid,0) AS total_valid,IFNULL(v_total_working,0) AS total_working,IFNULL(v_cnt_alarms,0) AS cnt_alarms;

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


DROP PROCEDURE IF EXISTS spb_update_sd_dehum_dd;
DELIMITER $$
CREATE PROCEDURE spb_update_sd_dehum_dd(v_cal_dt date)
BEGIN

DELETE FROM sd_dehum_dd WHERE DATEDIFF(cal_dt , v_cal_dt) = 0;

SET @rank:=0;

INSERT INTO sd_dehum_dd(cal_dt, last_time, area_num, box_num, dev_num, hum_value, temp_value, valid
		   , dehum_state, heat_state, dehum_total_time, heat_total_time, hum_set_value, hum_return_diff, hum_adjust_value 
		   , heat_start_temp, heat_return_diff, dehum_total_wh, heat_total_wh)
SELECT v_cal_dt AS cal_dt,d.time AS last_time,d.area_num, d.box_num, d.dev_num, d.hum_value, d.temp_value, d.valid
			, d.dehum_state, d.heat_state, d.dehum_total_time, d.heat_total_time, d.hum_set_value, d.hum_return_diff, d.hum_adjust_value
			, d.heat_start_temp, d.heat_return_diff, d.dehum_total_wh, d.heat_total_wh
FROM(
SELECT h.*
              ,@rank:= CASE WHEN @current_area_num = h.area_num AND @current_box_num = h.box_num AND @current_dev_num = h.dev_num THEN @rank+1 ELSE 1 END AS rank
			  ,@current_area_num:= h.area_num,@current_box_num:= h.box_num,@current_dev_num:= h.dev_num
FROM     history_data h
WHERE  DATEDIFF(v_cal_dt, h.time) = 0 
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
              ,t.dehum_total_time,t.dehum_total_wh,t.heat_total_time,t.heat_total_wh
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


