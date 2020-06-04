CREATE PROCEDURE spb_update_sys_config_update_from_systables()
BEGIN
  DECLARE max_update_dt_global_config timestamp;
  DECLARE max_update_dt_sys_area timestamp;
  DECLARE max_update_dt_sys_box timestamp;
  DECLARE max_update_dt_sys_device timestamp;
  
  
  SELECT MAX(update_dt) INTO max_update_dt_global_config FROM global_config;
  SELECT MAX(update_dt) INTO max_update_dt_sys_area FROM sys_area;
  SELECT MAX(update_dt) INTO max_update_dt_sys_box FROM sys_box;
  SELECT MAX(update_dt) INTO max_update_dt_sys_device FROM sys_device;
  
  IF NOT EXISTS(SELECT * FROM sys_config_update WHERE id = 1) THEN
    INSERT INTO sys_config_update(id, global_config_update_time,sys_area_update_time,  sys_box_update_time,sys_device_update_time , insert_dt)
    VALUES(1,max_update_dt_global_config,max_update_dt_sys_area, max_update_dt_sys_box, max_update_dt_sys_device, NOW()) ;
  
  END IF;
  
  
  UPDATE sys_config_update 
  SET        global_config_update_time = max_update_dt_global_config
				,sys_area_update_time = max_update_dt_sys_area
                ,sys_box_update_time = max_update_dt_sys_box
                ,sys_device_update_time = max_update_dt_sys_device
  WHERE id = 1;
  
END
