alter table inbox
	drop column fk_kid;
alter table inbox
	drop column edited_kid;

alter table inbox
	add kara jsonb;
alter table inbox
	add extra_tags jsonb[];
alter table inbox
	add lyrics jsonb;
alter table inbox
	add mediafile text;
alter table inbox
	add fix boolean;


