ALTER TABLE global_config ADD id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST;
ALTER TABLE global_config ADD insert_dt datetime;
ALTER TABLE global_config DROP COLUMN update_dt;
ALTER TABLE global_config ADD update_dt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE dev_config ADD insert_dt datetime ;
ALTER TABLE dev_config ADD update_dt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE dev_config DROP PRIMARY KEY;
ALTER TABLE dev_config ADD id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST;

DROP TABLE IF EXISTS sys_config_update_log;
CREATE TABLE sys_config_update_log(
id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
global_config_update_time datetime,
dev_config_update_time datetime,
insert_dt datetime,
update_dt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO sys_config_update_log(insert_dt) VALUES(CURRENT_DATE());



select * from global_config;
select * from sys_config_update_log;


-- 管理相关的表
-- 站点（1-N）区域（1-N）机柜（1-N）设备  （站点暂时还不需要）
-- Station         Area             Box              Device

CREATE TABLE sys_area(
area_num int NOT NULL AUTO_INCREMENT PRIMARY KEY,
area_name varchar(100),
insert_dt datetime,
update_dt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE sys_box(
box_num int NOT NULL AUTO_INCREMENT PRIMARY KEY,
box_name varchar(100),
box_ip  varchar(50),
box_port int,
insert_dt datetime,
update_dt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


