export const selectInbox = (uniqueKara: string) => `
	SELECT
		i.pk_inid AS inid,
		i.name,
		i.fk_login_downloaded AS username_downloaded,
		i.downloaded_at,
		i.created_at,
	    i.fk_kid as kid,
		${uniqueKara ? `
			ak.mediafile,
			ak.lyrics_infos,
			ak.karafile,
			ak.tags,
		` : ''}
		i.gitlab_issue,
		i.contact,
		i.edited_kid,
		i.edited_kid is not null as fix
	FROM inbox i
	${uniqueKara ? 'LEFT JOIN all_karas ak ON i.fk_kid = ak.pk_kid WHERE pk_inid = $1' : ''}
`;

export const insertInbox = `
	INSERT INTO inbox(
		pk_inid,
		name,
		created_at,
		gitlab_issue,
		contact,
		fk_kid,
		edited_kid
	) VALUES(
		:inid,
		:name,
		:created_at,
		:gitlab_issue,
		:contact,
		:kid,
		:edited_kid
	)
`;

export const updateInboxUnassign = `
    UPDATE inbox set fk_login_downloaded = NULL, downloaded_at = NULL
	WHERE pk_inid = $1
`;

export const updateInboxDownloaded = `
	UPDATE inbox SET fk_login_downloaded = $1, downloaded_at = $2
	WHERE pk_inid = $3
`;

export const deleteInbox = `
	DELETE FROM inbox WHERE pk_inid = $1
`;

export const clearInbox = `
	DELETE FROM inbox i USING kara k
	WHERE (i.fk_kid = k.pk_kid OR (i.edited_kid = k.pk_kid AND i.downloaded_at IS NOT NULL AND i.downloaded_at < k.modified_at)) AND k.repository != 'Staging'
	RETURNING i.gitlab_issue, k.pk_kid AS kid, k.mediafile, k.karafile, k.lyrics_infos;
`;
