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
select * from sys_area;




