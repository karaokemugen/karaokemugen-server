export const selectInbox = (uniqueKara: string, byUser: string) => `
	SELECT
		i.pk_inid AS inid,
		i.name,
		i.fk_login_downloaded AS username_downloaded,
		i.downloaded_at,
		i.created_at,
	    i.fk_kid as kid,
		ak.mediafile,
		ak.lyrics_infos,
		ak.karafile,
		ak.tags,
		i.gitlab_issue,
		i.contact,
		i.edited_kid,
		i.edited_kid is not null as fix,
		i.fk_login as username,
		i.modified_at,
		i.status,
		i.history,
		i.reject_reason
	FROM inbox i
	LEFT JOIN all_karas ak ON i.fk_kid = ak.pk_kid
	WHERE true
	  ${uniqueKara ? 'AND pk_inid = :inid' : ''}
	  ${byUser ? 'AND fk_login = :byUser' : ''}
`;

export const insertInbox = `
	INSERT INTO inbox(
		pk_inid,
		name,
		created_at,
		contact,
		fk_kid,
		edited_kid,
		fk_login,
		modified_at,
		status
	) VALUES(
		:inid,
		:name,
		:created_at,
		:contact,
		:kid,
		:edited_kid,
		:username,
		NOW(),
		'sent'
	)
	ON CONFLICT(pk_inid) DO UPDATE SET
		pk_inid = :inid,
		name = :name,
		created_at = :created_at,
		contact = :contact,
		fk_kid = :kid,
		edited_kid = :edited_kid,
		fk_login = :username,
		modified_at = NOW(),
		status = 'sent'
`;

export const updateInboxStatus = `
	UPDATE inbox SET status = $2, history = $3, reject_reason = $4, modified_at = NOW() WHERE pk_inid = $1
`;

export const updateInboxGitlabIssue = `
	UPDATE inbox SET gitlab_issue = $2 WHERE pk_inid = $1
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
	DELETE FROM inbox i
	WHERE i.pk_inid = $1
`;