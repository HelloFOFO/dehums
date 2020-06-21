select * from alarm_type ;

select * from history_alarm limit 10;

select * from dev_config;

SELECT * FROM sys_area;

select * from newest_data limit 10;

select * from history_data h where DATEDIFF('2020-05-18', h.time) = 0  order by time desc limit 10;


SELECT * FROM sd_dehum_dd;



SELECT * FROM newest_data LIMIT 10;

SELECT CURRENT_DATE();

SELECT * FROM sd_dehum_dd;
call spb_update_sd_dehum_dd('2020-05-22');


call spq_summary_data();
call spq_summary_data_by_areanum(1);
call spq_summary_usage_data();
call spq_summary_device_usage_data(1,1,2);

SELECT * FROM history_alarm LIMIT 10;
SELECT * FROM history_data LIMIT 100;

call sqp_alarms(-1,-1,-1, null,null);
