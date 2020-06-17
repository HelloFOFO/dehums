select * from alarm_type ;

select * from history_alarm limit 10;

select * from dev_config;


select * from newest_data limit 10;

select * from history_data h where DATEDIFF('2020-05-18', h.time) = 0  order by time desc limit 10;


SELECT * FROM sd_dehum_dd;



SET @rank:=0;
SELECT *
FROM(
SELECT h.*
              ,@rank:= CASE WHEN @current_area_num = h.area_num AND @current_box_num = h.box_num AND @current_dev_num = h.dev_num THEN @rank+1 ELSE 1 END AS rank
			  ,@current_area_num:= h.area_num,@current_box_num:= h.box_num,@current_dev_num:= h.dev_num
FROM     history_data h
WHERE  DATEDIFF('2020-05-18', h.time) = 0 
ORDER  BY h.area_num ASC,h.box_num ASC,h.dev_num ASC,time DESC
) d
WHERE  rank = 1;


SELECT CURRENT_DATE() AS cal_dt
              ,SUM(dehum_total_time) AS dehum_total_time,SUM(dehum_total_wh) AS dehum_total_wh
              ,SUM(heat_total_time) AS heat_total_time,SUM(heat_total_wh) AS heat_total_wh
FROM    newest_data n
WHERE DATEDIFF(CURRENT_DATE(), time ) = 0;


SELECT * FROM newest_data LIMIT 10;

SELECT CURRENT_DATE();

SELECT * FROM sd_dehum_dd;
call spb_update_sd_dehum_dd('2020-05-22');


call spq_summary_data();
call spq_summary_data_by_areanum(1);
call spq_summary_usage_data();

SELECT * FROM history_alarm LIMIT 10;
SELECT * FROM history_data LIMIT 100;