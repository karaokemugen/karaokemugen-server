export default {
	error: {
		generic: 'Error',
		private_profile: 'The profile is private.',
		home: 'Go home'
	},
	kara: {
		phrase: '{songtype} from {series}',
		meta: '{songtitle} from {serieSinger}',
		notfound: 'Karaoke not found',
		tagtypes: {
			series: 'Series',
			langs: 'Language | Languages',
			songtypes: 'Song type | Song types',
			singers: 'Singer | Singers',
			songwriters: 'Songwriter | Songwriters',
			families: 'Family | Families',
			origins: 'Origin | Origins',
			genres: 'Genre | Genres',
			platforms: 'Platform | Platforms',
			creators: 'Creator | Creators',
			authors: 'Karaokes author | Karaokes authors',
			groups: 'Group | Groups',
			misc: 'Miscellaneous',
			versions: 'Version | Versions'
		},
		singers_by: 'Sung by',
		songwriters_by: 'Composed by',
		creators_by: 'Created by',
		authors_by: 'Karaoke created by',
		duration: 'Duration ',
		created_at: 'Created ',
		download: 'Download',
		live: 'Open in a new tab',
		live_unavailable: 'You cannot play this karaoke in your browser. Either the video is in an unsupported format in browsers, or it has been disabled for legal reasons.',
		lyrics: {
			show: 'Show lyrics',
			hide: 'Hide lyrics'
		},
		favorites: {
			add: 'Add to favorites',
			remove: 'Remove from favorites'
		},
		set_banner: {
			btn: 'Use as profile banner',
			forbidden_label: 'You cannot use this karaoke as your profile banner.'
		},
		problem: {
			title: 'An issue with {title}?',
			btn: {
				report: 'Report an issue',
				edit: 'Suggest an edit'
			},
			form: {
				title: 'Report an issue',
				subtitle: 'We do our best to have a high-quality database, but sometimes some issues are there. Thanks for help!',
				type: {
					label: 'Problem type',
					time: 'Lyrics not synchronised',
					quality: 'Low quality video'
				},
				comment: {
					label: 'Comment',
					placeholder: 'After 2 minutes, the lyrics is not synchronised'
				},
				username: {
					label: 'Your name',
					placeholder: 'IAmMeticulous'
				},
				submit: 'Submit',
				thanks: {
					text: 'Thanks! We will address this issue as soon as possible: {url}',
					btn: 'Close'
				}
			}
		},
		import: {
			description: 'This form allows you to submit a karaoke to the Karaoke Mugen team. It will not be immediately integrated in the karaoke database because it requires a validation. Please be patient. Your karaoke may be modified if it doesn\'t comply to KM\'s rules.',
			attention: 'ATTENTION:',
			check_in_progress: 'Please check the list of karaokes currently being made before sending us a song. This\'ll avoid duplicate work, and the world will thus be a better place.',
			documentation_link: 'Documentation',
			in_progress_link: 'Karaokes In Progress List',
			license_reminder: 'Your karaoke will be published with the {name} license',
			license_link: 'Learn more about this license by clicking here.',
			add: 'Add',
			create: 'Create',
			choose_file: 'Choose a file',
			add_file_media_error: '{name} is not a media file',
			add_file_lyrics_error: '{name} is not a subtitle file',
			add_file_success: '{name} file added successfully',
			comment: 'Leave a comment?',
			comment_edit: 'If you\'re submitting an edit, tell us who you are here!',
			comment_tooltip: 'If you want to add a message for the integrators or just say thanks, say it here!',
			submit: 'Send karaoke',
			media_file: 'Media file',
			media_file_required: 'Media file is mandatory',
			media_file_tooltip: 'Supported file formats: {formats}',
			lyrics_file: 'Lyrics file',
			lyrics_file_tooltip: 'Supported file formats: {formats}',
			lyrics_file_missing: 'The lyrics file is missing, this is appropriate only if you are sending an MKV file or a karaoke without lyrics (?).',
			title: 'Title',
			title_required: 'Please enter a english song title',
			title_eng_required: 'Le titre anglais est obligatoire',
			title_tooltip: 'If you don\'t know, put the name of the series here as well. In the case of an alternative version, name your title as: \'My title ~ Disco vers.\' for example',
			series_tooltip: 'TV series, movie title, video game title, etc.',
			series_singers_required: 'Series or Sung by cannot be empty in the same time.',
			songtypes_required: 'Song type is mandatory',
			songorder: 'Song order',
			songorder_invalid: 'Song order is invalid',
			songorder_tooltip: 'Opening/Ending number. If this is the only opening/ending in the series, leave blank.',
			langs_required: 'Please choose a language',
			year: 'Broadcast year',
			year_tooltip: 'Year when the series was broadcasted or the video was produced',
			year_required: 'Broadcast year is mandatory',
			year_invalid: 'Broadcast year is invalid',
			songwriters_tooltip: 'Songwriters compose lyrics AND music.',
			creators_tooltip: 'Entity that created the series. Can be animation studio, movie studio, or game studio',
			authors_tooltip: 'You should add yourself here ;)',
			authors_required: 'Author of the karaoke is mandatory',
			groups_tooltip: 'Download groups for this song. The song will be included in these download packs',
			created_at: 'Creation date',
			add_success: 'Your karaoke has been successfully sent!',
			add_success_description: 'An issue has been created on our tracker. You can check its progression at {url}',
			add_error: 'An error has occurred, karaoke has not been sent properly',
			restart: 'Submit new karaoke',
			i18n_select: 'Add a language',
			i18n_delete: 'Remove language'
		},
		stats: {
			favorited: 'Added to favorites by {number} users',
			requested: 'Requested {number} times',
			played: 'Played {number} times'
		}
	},
	layout: {
		loading: 'Loading...',
		empty: 'We looked everywhere, we didn\'t find anything.',
		suggest: 'Can\'t find what you\'re looking for?',
		suggest_open: 'Suggest us!',
		remove_tags: 'Did you try removing some of the filter tags from the search?',
		end_favorites: 'This is the end of favorites.',
		end_my_favorites: 'This is the end of your favorites.',
		explore: 'Go add some!',
		results: '{count} result | {count} results',
		slogan: 'This song is available on the Karaoke Mugen songbase!',
		end_users: 'You\'ve reached the end of the user list (congratulations!).'
	},
	footer: {
		home: 'Project home',
		software_under_license: 'Software under license',
		base_under_licence: 'Karaoke base under license'
	},
	stats: {
		karaokes: 'Karaoke | Karaokes',
		all_duration: 'Duration of all karaokes',
		last_generation: 'Last update',
		media_size: 'Media Size'
	},
	duration: {
		days: 'days',
		hours: 'hours',
		minutes: 'minutes',
		seconds: 'seconds'
	},
	menu: {
		add_repository: 'Add this repository to your app',
		random: 'Launch a dice',
		database: 'Database',
		karas: 'Songs',
		songtypes: 'Types',
		tags: 'Tags',
		miscs: 'Miscs',
		groups: 'Groups',
		families: 'Families',
		origins: 'Origins',
		genres: 'Genres',
		platforms: 'Platforms',
		versions: 'Versions',
		singers: 'Singers',
		series: 'Series',
		songwriters: 'Songwriters',
		creators: 'Creators',
		authors: 'Authors',
		langs: 'Languages',
		years: 'Years',
		community: 'Community',
		join_kara: 'Join a karaoke party',
		search_users: 'Search users',
		kara_import: 'Submit a kara',
		account: 'Account',
		login: 'Login',
		logout: 'Logout',
		register: 'Register',
		connection: 'Login',
		profile: 'Edit your profile',
		switch_language: 'Switch language'
	},
	profile: {
		favorites: 'Favorites',
		you: ' (that\'s you!)',
		edit: 'Edit profile',
		favorites_count: '{x} favorite | {x} favorites'
	},
	search: {
		placeholder: {
			kara: 'Series, singers, names...',
			user: 'Username...',
			tag: 'Tag name...'
		},
		sort: {
			a_z: 'De A à Z',
			kara_count: 'Karaoke count',
			recent: 'By date added',
			most_played: 'Most played',
			most_favorites: 'Plus favoris',
			most_requested: 'Plus demandés'
		},
		next: 'Next page',
		previous: 'Previous page',
		aria: {
			goto: 'Go to page {0}',
			page: 'Page {0}',
			sort: 'Sort by'
		},
		types: {
			karaokes: 'Songs',
			users: 'Users',
			favorites: 'User\'s favorites'
		}
	},
	modal: {
		login: {
			title: 'Login',
			subtitle: 'Login to view your favorites and edit your profile!',
			fields: {
				username: {
					label: 'Username',
					placeholder: 'LoveLiveFan93'
				},
				password: {
					label: 'Password',
					placeholder: 'ActuallyIdolM@sterIsBetter'
				},
				forgot_password: {
					label: 'Forgot password?',
					error: 'Could not reset your password: contact the the server\'s administrator your account belongs to.',
					success: 'An email has been sent with a link to reset your password.'
				}
			},
			submit: 'Login'
		},
		signup: {
			title: 'Signup',
			subtitle: 'Signup to view your favorites and edit your profile!',
			fields: {
				username: {
					label: 'Username',
					placeholder: 'LoveLiveFan93'
				},
				password: {
					label: 'Password',
					placeholder: 'ActuallyIdolM@sterIsBetter'
				},
				password_confirmation: {
					label: 'Password Confirmation',
					placeholder: 'ActuallyIdolM@sterIsBetter'
				},
				email: {
					label: 'Email',
					placeholder: 'test@shelter.moe'
				}
			},
			passwords_mismatch: 'Passwords do not match',
			submit: 'Signup'
		},
		profile: {
			title: 'Edit profile',
			headers: {
				profile: 'About',
				privacy: 'Privacy',
				lang: 'Language preferences',
				password: 'Change password'
			},
			fields: {
				username: {
					label: 'Username'
				},
				nickname: {
					label: 'Nickname',
					placeholder: 'LoveLiveFan93'
				},
				password: {
					label: 'Password',
					placeholder: 'EnVraiJePréfèreIdolM@ster'
				},
				password_confirmation: {
					label: 'Password confirmation',
					placeholder: 'EnVraiJePréfèreIdolM@ster'
				},
				email: {
					label: 'Email',
					placeholder: 'test@shelter.moe'
				},
				url: {
					label: 'Website',
					placeholder: 'https://karaokes.moe'
				},
				bio: {
					label: 'Biography',
					placeholder: 'It\' s my life'
				},
				location: {
					label: 'Location'
				},
				discord: {
					label: 'Discord',
					placeholder: 'Karak#1423'
				},
				twitter: {
					label: 'Twitter',
					placeholder: 'KaraokeMugen'
				},
				instagram: {
					label: 'Instagram',
					placeholder: 'karaokemugen'
				},
				twitch: {
					label: 'Twitch',
					placeholder: 'KaraokeLive'
				},
				banner: {
					label: 'Banner',
					remove: 'Reset to the default banner',
					change: 'To change your banner, go to the page of a karaoke and click the "Use as profile banner" button.'
				},
				flag_public: {
					label: 'Public profile',
					checkbox: 'Make my profile public',
					desc: 'By default, your account is visible via the user search and shows all the above informations with the exception of the e-mail address. If you uncheck this box, your account will not be available anymore in the search results (you will be the only one to be able to see it, once you\'ve logged in).'
				},
				flag_displayfavorites: {
					label: 'Favorites',
					checkbox: 'Show my favorites',
					desc: 'Along with showing your public profile, you can showcase your favorites (therefore your taste) to everyone eyes. This option is disabled by default, you can check it if you want. To show your favorites, your profile must be public in the first place.'
				},
				flag_sendstats: {
					label: 'Stats',
					checkbox: 'Use my favorites and karaokes requests for stats'
				},
				lang_prefs: {
					main_song_name_lang: 'Song name display preference',
					fallback_song_name_lang: 'Fallback song name display preference'
				}
			},
			passwords_mismatch: 'Passwords do not match',
			submit: 'Save',
			delete: 'Delete account',
			select_avatar: 'Select an avatar'
		},
		add_repository: {
			button: 'Repository :',
			label: 'Add this repository to your Karaoke Mugen app!',
			desc: 'You can add this repository to your Karaoke Mugen app by clicking on the button below. If Karaoke Mugen is not installed on your computer, this button will have no effect.',
			download: 'The application can be downloaded here.',
			manual: 'To manually add this repository, open your Karaoke Mugen application, add the {repository} repository to it, checking "{online}".',
			online: 'Online',
			add: 'Add',
			cancel: 'Cancel'
		},
		delete_account: {
			label: 'Do you really want to delete your account?',
			add: 'Delete the account',
			cancel: 'Cancel'
		},
		suggest: {
			title: 'Suggestion',
			subtitle: 'You couldn\'t find what you\'ve searched for? You can still fill a suggestion ',
			fields: {
				title: {
					label: 'Title',
					placeholder: 'JINGO JUNGLE'
				},
				series: {
					label: 'Series / Singer',
					placeholder: 'Yôjo Senki: Saga of Tanya the Evil'
				},
				type: {
					label: 'Type'
				},
				link: {
					label: 'Link',
					placeholder: 'https://www.youtube.com/watch?v=5VRyiaszGtA'
				},
				name: {
					label: 'Your name',
					placeholder: 'Magic anonymous'
				}
			},
			submit: 'Submit',
			submitted: {
				subtitle: 'Message heard loud and clear!',
				text: 'Your suggestion was received, you can check its status by clicking {here}.',
				here: 'here',
				close: 'Fermer'
			}
		},
		download: {
			label: 'Download the karaoke',
			cancel: 'Cancel',
			karabundle: 'Download data (.json)',
			subtitles: 'Download lyrics (.{format})',
			media: 'Download media (.{format})'
		},
		crop_avatar: {
			label: 'Crop avatar',
			add: 'Add',
			cancel: 'Cancel'
		},
		join_kara: {
			label: 'Join a karaoke party',
			desc: 'Enter a code to join a existing karaoke party',
			add: 'Join',
			cancel: 'Cancel',
			help: 'Enter the session code (generally it\'s 4 letters) or the karaoke URL.',
			error: 'The code is invalid, please check what you typed.'
		},
		stats: {
			label: 'Use my favorites and karaokes requests for stats',
			desc: 'We use your favorites as well as the karaokes that you have requested during a session to make usage statistics (for example, to find out the most requested karaokes).',
			refuse_desc: 'If you do not want to participate, even if it\'s anonymous, in these usage statistics, please let us know. If you refuse, your data will be ignored by the server and not sent by the Karaoke Mugen Application.',
			change: 'You can change this at any time in your profile. Do you accept the usage of your stats?',
			yes: 'Yes',
			no: 'No'
		},
		set_banner: {
			label: 'Choose a banner',
			catch: 'Customize your profile with a wonderful banner! Scroll through the banners and confirm your choice.',
			cancel: 'Cancel',
			set: 'Use this image',
			next: 'Next image',
			previous: 'Previous image',
			one: 'There is only one banner for audio only karaokes.'
		}
	},
	titles: {
		home: 'Home'
	},
	toast: {
		LOG_ERROR: 'Incorrect credentials.',
		USER_ASCII_CHARACTERS_ONLY: 'Only alphanumeric characters in your username please (you can change your nickname later to whatever you wish.)',
		USER_CREATED: 'User successfully created',
		GENERATED_KARA: 'Karaoke sent successfully.',
		EDITED_KARA: 'Modification sent successfully.',
		CANNOT_GENERATE_KARA: 'Cannot send karaoke.',
		SUBFILE_FORMAT_UNKOWN: 'Subfile format unkown',
		CANNOT_EDIT_KARA: 'Cannot send modification.',
		FILE_UPLOADED: 'File uploaded.',
		USER_EDITED: 'User successfully edited',
		FUTURE_PROFILES: 'This button will be used to share your profile to everyone else, but that\'s for another moment!'
	}
};
