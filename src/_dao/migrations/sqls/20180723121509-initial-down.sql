/* Replace with your SQL commands */

DROP TABLE settings;
DROP TABLE kara_serie;
DROP TABLE kara_tag;
DROP TABLE serie_lang;
DROP TABLE serie;
DROP TABLE tag;
DROP TABLE kara;

DROP INDEX index_serie_lang_fk_id_serie;
DROP INDEX index_kara_serie_fk_id_serie;
DROP INDEX index_kara_serie_fk_id_kara;
DROP INDEX index_kara_tag_fk_id_tag;
DROP INDEX index_kara_tag_fk_id_kara;
