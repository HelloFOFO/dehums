select * from alarm_type ;

select * from history_alarm limit 10;

select * from dev_config;

SELECT * FROM sys_area;

select * from sd_dehum_dd limit 10;

select * from history_data limit 10;

select * from history_data h where DATEDIFF('2020-05-18', h.time) = 0  order by time desc limit 10;


SELECT * FROM sd_dehum_dd;



SELECT * FROM newest_data LIMIT 10;

SELECT CURRENT_DATE();

SELECT * FROM sd_dehum_dd;
call spb_update_sd_dehum_dd('2020-06-21');


call spq_summary_data();
call spq_summary_data_by_areanum(1);
call spq_summary_usage_data();
call spq_summary_device_usage_data(1,1,2);

SELECT * FROM history_alarm LIMIT 10;
SELECT * FROM history_data LIMIT 100;

call sqp_alarms(1,1,-1, null,null);

SELECT *
FROM    history_alarm
WHERE DATEDIFF(NOW(), time) = 0 AND status = 0;

TRUNCATE TABLE newest_data;


call spq_summary_data_by_devinfo(1,2,1);

CALL spq_summary_data();

SELECT COUNT(1) AS total
              ,SUM(CASE WHEN n.valid = 1 THEN 1 ELSE 0 END)  AS total_valid
              ,SUM(CASE WHEN n.valid = 1 AND (n.dehum_state = 1 OR n.heat_state = 1) THEN 1 ELSE 0 END) AS total_working
              ,CASE WHEN ROUND((unix_timestamp(NOW())-unix_timestamp(MAX(time)))/60,0) >= 3 THEN 1 ELSE 0 END AS wsd_error
              ,MAX(time) AS wsd_last_time
              ,ROUND((unix_timestamp(NOW())-unix_timestamp(MAX(time)))/60,0)
FROM     newest_data n;


SELECT * FROM newest_data LIMIT 10;
SELECT * FROM history_data LIMIT 10;
SELECT * FROM sd_dehum_dd LIMIT 10;


SELECT cal_dt,COUNT(1)
FROM    sd_dehum_dd
GROUP  BY cal_dt
ORDER  BY 1 DESC;

SELECT * FROM sd_dehum_dd WHERE cal_dt = '2020-07-13' ;

call spq_summary_usage_data();

