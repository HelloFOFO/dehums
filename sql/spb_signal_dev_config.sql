USE gywsd;
DROP procedure IF EXISTS spb_signal_dev_config;

DELIMITER $$
USE gywsd$$
CREATE PROCEDURE spb_signal_dev_config()
BEGIN
  --  更新 sys_config_update_log
  IF NOT EXISTS(SELECT * FROM sys_config_update_log WHERE id = 1) THEN
    INSERT INTO sys_config_update_log(id, dev_config_signal_time , insert_dt)
    VALUES(1,NOW(), NOW()) ;
  
  END IF;
  
  UPDATE sys_config_update_log
  SET        dev_config_signal_time = NOW()
  WHERE id = 1;
  
END$$

DELIMITER ;

