select * from global_config;


show create table global_config;
show create table history_data;
show create table dev_config;

select * from dev_config limit 10;




select * from global_config;
select * from sys_config_update_log;


select * from sys_area;
select * from sys_box;

SELECT b.box_num,b.box_name,b.box_ip,b.box_port,b.insert_dt,b.update_dt,b.area_num,a.area_name
FROM   sys_box b INNER JOIN sys_area a ON b.area_num = a.area_num;


SELECT d.id,d.dev_num,d.hum_set_value,d.hum_return_diff,d.hum_adjust_value,d.hum_high_limit,d.temp_high_limit,d.temp_low_limit
              ,d.heat_start_temp,d.heat_return_diff,d.dev_type,d.hum_w,d.heat_w,d.insert_dt,d.update_dt
			  ,d.box_num,b.box_name,b.box_ip,b.box_port,b.area_num
              ,a.area_name
FROM    dev_config d 
               LEFT JOIN sys_box b  ON d.box_num = b.box_num
               LEFT JOIN sys_area a ON b.area_num = a.area_num;
               
               
SELECT * FROM history_data LIMIT 10;
SELECT * FROM sys_device LIMIT 10;

SELECT d.id,d.dev_num,d.hum_set_value,d.hum_return_diff,d.hum_adjust_value,d.hum_high_limit,d.temp_high_limit,d.temp_low_limit
	 ,d.heat_start_temp,d.heat_return_diff,d.dev_type,d.hum_w,d.heat_w,d.insert_dt,d.update_dt
	 ,d.box_num,b.box_name,b.box_ip,b.box_port,b.area_num
	 ,a.area_name
FROM   sys_device d
	  LEFT JOIN sys_box b  ON d.box_num = b.box_num
	  LEFT JOIN sys_area a ON b.area_num = a.area_num;
      
      

select * from sys_config_update_log;
select * from sys_box order by update_dt desc;
select * from sys_device order by update_dt desc;
select * from sys_device order by id asc;
select * from sys_area;

SELECT MAX(update_dt) FROM sys_box;

SELECT MAX(update_dt) FROM sys_area;

SELECT * FROM dev_config;
SELECT * FROM  sys_dev_config_bak; 

SELECT IFNULL(MAX(batch_id),0) FROM sys_dev_config_recreate_log;


call spb_recreate_dev_config();

SELECT * FROM sys_dev_config_bak;
SELECT * FROM sys_dev_config_recreate_log;
SELECT * FROM sys_config_update_log;
SELECT * FROM dev_config;
SELECT a.area_num,d.box_num,b.box_name,d.dev_num,b.box_ip,b.box_port
			,d.hum_set_value,d.hum_return_diff,d.hum_adjust_value,d.hum_high_limit,d.temp_high_limit,d.temp_low_limit
			,d.heat_start_temp,d.heat_return_diff,d.dev_type,d.hum_w,d.heat_w
FROM   sys_device d
			 INNER JOIN sys_box b  ON d.box_num = b.box_num
			 INNER JOIN sys_area a ON b.area_num = a.area_num;

UPDATE sys_config_update_log SET dev_config_update_time = NULL;

SELECT * FROM sys_config_update_log;
