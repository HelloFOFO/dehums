ALTER TABLE global_config ADD id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST;
ALTER TABLE global_config ADD insert_dt datetime;
ALTER TABLE global_config DROP COLUMN update_dt;
ALTER TABLE global_config ADD update_dt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE dev_config ADD insert_dt datetime ;
ALTER TABLE dev_config ADD update_dt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE dev_config DROP PRIMARY KEY;
ALTER TABLE dev_config ADD id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST;
ALTER TABLE dev_config DROP COLUMN id;
ALTER TABLE dev_config ADD PRIMARY KEY PK_dev_config(area_num,box_num,dev_num);

DROP TABLE IF EXISTS sys_config_update_log;
CREATE TABLE sys_config_update_log(
id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
global_config_update_time datetime,
sys_area_update_time datetime,
sys_box_update_time datetime,
sys_device_update_time datetime,
insert_dt datetime,
update_dt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);



select * from global_config;
select * from sys_config_update_log;


-- 管理相关的表
-- 站点（1-N）区域（1-N）机柜（1-N）设备  （站点暂时还不需要）
-- Station         Area             Box              Device
-- DROP TABLE IF EXISTS sys_area;
CREATE TABLE sys_area(
area_num int NOT NULL AUTO_INCREMENT PRIMARY KEY,
area_name varchar(100),
insert_dt datetime,
update_dt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- DROP TABLE IF EXISTS sys_box;
CREATE TABLE sys_box(
box_num int NOT NULL AUTO_INCREMENT PRIMARY KEY,
box_name varchar(100),
area_num int,
box_ip  varchar(50),
box_port int,
insert_dt datetime,
update_dt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 设备表，box_num+dev_num也可以唯一确定
CREATE TABLE sys_device (
  id int NOT NULL AUTO_INCREMENT,
  box_num int(11) NOT NULL DEFAULT '1',
  dev_num int(11) NOT NULL DEFAULT '1',
  hum_set_value int(11) NOT NULL,
  hum_return_diff int(11) NOT NULL,
  hum_adjust_value int(11) NOT NULL,
  hum_high_limit int(11) NOT NULL,
  temp_high_limit int(11) NOT NULL,
  temp_low_limit int(11) NOT NULL,
  heat_start_temp int(11) NOT NULL DEFAULT '0',
  heat_return_diff int(11) NOT NULL DEFAULT '0',
  dev_type int(11) NOT NULL DEFAULT '0',
  hum_w int(11) NOT NULL DEFAULT '30',
  heat_w int(11) NOT NULL DEFAULT '30',
  insert_dt datetime DEFAULT NULL,
  update_dt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ;

INSERT INTO sys_device(box_num, dev_num, hum_set_value, hum_return_diff, hum_adjust_value, hum_high_limit, temp_high_limit, temp_low_limit, heat_start_temp, heat_return_diff, dev_type, hum_w, heat_w, insert_dt)
SELECT 1 AS box_num,d.dev_num,d.hum_set_value,d.hum_return_diff,d.hum_adjust_value,d.hum_high_limit,d.temp_high_limit,d.temp_low_limit
	 ,d.heat_start_temp,d.heat_return_diff,d.dev_type,d.hum_w,d.heat_w,d.insert_dt
FROM   dev_config d;
