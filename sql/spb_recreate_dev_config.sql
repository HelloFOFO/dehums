USE gywsd;
DROP procedure IF EXISTS spb_recreate_dev_config;

DELIMITER $$
USE gywsd$$
CREATE PROCEDURE spb_recreate_dev_config()
BEGIN
 -- 每次重新生成dev_config 时:
 -- 1、先把dev_config表的旧值插入sys_dev_config_bak，value_old_or_new设置为old；
 -- 2、清空dev_config表
 -- 3、根据sys_area/box/device表重新生成dev_config
 -- 4、新插入的值同时插入sys_dev_config_bak，value_old_or_new设置为new；
  DECLARE new_batch_id int;
  
  SELECT IFNULL(MAX(batch_id),0)+1 INTO new_batch_id FROM sys_dev_config_recreate_log;
  
  DROP TEMPORARY TABLE IF EXISTS tmp_dev_config_for_insert;
  
  -- 根据sys_area/box/device生成新的记录，放到临时表里，用于后面的更新操作
  CREATE TEMPORARY TABLE tmp_dev_config_for_insert AS
  SELECT a.area_num,d.box_num,b.box_name,d.dev_num,b.box_ip,b.box_port
                ,d.hum_set_value,d.hum_return_diff,d.hum_adjust_value,d.hum_high_limit,d.temp_high_limit,d.temp_low_limit
                ,d.heat_start_temp,d.heat_return_diff,d.dev_type,d.hum_w,d.heat_w
   FROM   sys_device d
                 INNER JOIN sys_box b  ON d.box_num = b.box_num
                 INNER JOIN sys_area a ON b.area_num = a.area_num;
   
   -- 先把旧的dev_config表做个备份
   INSERT INTO sys_dev_config_bak(batch_id, value_old_or_new, area_num, box_num, box_name, dev_num, box_ip, box_port, hum_set_value
                         , hum_return_diff, hum_adjust_value, hum_high_limit, temp_high_limit, temp_low_limit, heat_start_temp, heat_return_diff, dev_type, hum_w, heat_w
						 , insert_dt, update_dt)
   SELECT new_batch_id,'OLD' AS value_old_or_new,area_num, box_num, box_name, dev_num, box_ip, box_port, hum_set_value 
                , hum_return_diff, hum_adjust_value, hum_high_limit, temp_high_limit, temp_low_limit, heat_start_temp, heat_return_diff, dev_type, hum_w, heat_w
                , NOW(), NOW()
   FROM     dev_config;
  
   TRUNCATE TABLE dev_config;
   
   INSERT INTO dev_config(area_num, box_num, box_name, dev_num, box_ip, box_port, hum_set_value
                         , hum_return_diff, hum_adjust_value, hum_high_limit, temp_high_limit, temp_low_limit, heat_start_temp, heat_return_diff, dev_type, hum_w, heat_w
						 , insert_dt, update_dt)
   SELECT area_num, box_num, box_name, dev_num, box_ip, box_port, hum_set_value
			    , hum_return_diff, hum_adjust_value, hum_high_limit, temp_high_limit, temp_low_limit, heat_start_temp, heat_return_diff, dev_type, hum_w, heat_w
				, NOW(), NOW()
   FROM   tmp_dev_config_for_insert;
   
      -- 再把新的值也插入到 sys_dev_config_bak 中
   INSERT INTO sys_dev_config_bak(batch_id, value_old_or_new, area_num, box_num, box_name, dev_num, box_ip, box_port, hum_set_value
                         , hum_return_diff, hum_adjust_value, hum_high_limit, temp_high_limit, temp_low_limit, heat_start_temp, heat_return_diff, dev_type, hum_w, heat_w
						 , insert_dt, update_dt)
   SELECT new_batch_id,'NEW' AS value_old_or_new,area_num, box_num, box_name, dev_num, box_ip, box_port, hum_set_value
			    , hum_return_diff, hum_adjust_value, hum_high_limit, temp_high_limit, temp_low_limit, heat_start_temp, heat_return_diff, dev_type, hum_w, heat_w
				, NOW(), NOW()
   FROM   tmp_dev_config_for_insert;
   
   DROP TEMPORARY TABLE IF EXISTS tmp_dev_config_for_insert;
   
   INSERT INTO sys_dev_config_recreate_log(recreate_time) VALUES(NOW());

  --  更新 sys_config_update_log
  IF NOT EXISTS(SELECT * FROM sys_config_update_log WHERE id = 1) THEN
    INSERT INTO sys_config_update_log(id, dev_config_update_time , insert_dt)
    VALUES(1,NOW(), NOW()) ;
  
  END IF;
  
  UPDATE sys_config_update_log
  SET        dev_config_update_time = NOW()
  WHERE id = 1;
  
END$$

DELIMITER ;

