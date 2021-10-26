export const selectInbox = (uniqueKara: string) => `
	SELECT 
		pk_kid AS kid,
		name,
		fk_login_downloaded AS username_downloaded,
		downloaded_at,
		created_at,
		${uniqueKara ? `
			kara,
			extra_tags,
			lyrics,
			mediafile,
		` : ''}
		gitlab_issue,
		fix
	FROM inbox
	${uniqueKara ? ' WHERE pk_kid = $1 ' : ''}
`;

export const insertInbox = `
	INSERT INTO inbox(
		pk_kid,
		name,
		created_at,
		kara,
		extra_tags,
		lyrics,
		mediafile,
		gitlab_issue,
		fix
	) VALUES(
		:kid,
		:name,
		:created_at,
		:kara,
		:extra_tags,
		:lyrics,
		:mediafile,
		:gitlab_issue,
		:fix
	)
`;

export const updateInboxDownloaded = `
	UPDATE inbox SET fk_login_downloaded = $1, downloaded_at = $2
	WHERE pk_kid = $3
`;

export const deleteInbox = `
	DELETE FROM inbox WHERE pk_kid = $1
`;