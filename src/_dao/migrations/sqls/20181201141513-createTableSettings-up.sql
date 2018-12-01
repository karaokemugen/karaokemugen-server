/* Replace with your SQL commands */

CREATE TABLE settings
(
	setting CHARACTER VARYING,
	setting_value CHARACTER VARYING
);

CREATE UNIQUE INDEX idx_setting ON settings (setting);