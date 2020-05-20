ALTER TABLE global_config ADD id INT NOT NULL AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE global_config ADD insert_dt datetime;
ALTER TABLE global_config ADD update_dt timestamp ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE dev_config ADD insert_dt datetime ;
ALTER TABLE dev_config ADD update_dt timestamp ON UPDATE CURRENT_TIMESTAMP;
