export default {
	error: {
		generic: "Error"
	},
	kara: {
		phrase: "{songtype} from {series}",
		notfound: "Karaoke not found",
		tagtypes: {
			series: "Series",
			langs: "Language | Languages",
			songtypes: "Song type | Song types",
			singers: "Singer | Singers",
			songwriters: "Songwriter | Songwriters",
			families: "Family | Families",
			origins: "Origin | Origins",
			genres: "Kind | Kinds",
			platforms: "Platform | Platforms",
			creators: "Creator | Creators",
			authors: "Kara author | Kara authors",
			groups: "Group | Groups",
			misc: "Miscellaneous"
		},
		add: 'Add to application',
		download: 'Download the karaoke with karabundle format',
		favorites: {
			add: 'Add to favorites',
			remove: 'Remove from favorites'
		},
		problem: {
			title: 'An issue with {title}?',
			btn: {
				report: 'Report an issue',
				edit: 'Purpose an edit'
			}
		},
		import: {
			description: "This form allows you to submit a karaoke to the Karaoke Mugen team. It will not be immediately integrated in the karaoke database because it requires a validation. Please be patient. Your karaoke may be modified if it doesn't comply to KM's rules.",
			attention: "ATTENTION:",
			check_in_progress: "Please check the list of karaokes currently being made before sending us a song. This'll avoid duplicate work, and the world will thus be a better place.",
			documentation_link: "Documentation",
			in_progress_link: "Karaokes In Progress List",
			license_reminder: "Your karaoke will be published with the {name} license",
			license_link: "Learn more about this license by clicking here.",
			add: "Add",
			choose_file: "Choose a file",
			add_file_media_error: "{name} is not a media file",
			add_file_lyrics_error: "{name} is not a subtitle file",
			add_file_success: "{name} file added successfully",
			comment: "Leave a comment?",
			comment_edit: "If you're submitting an edit, tell us who you are here!",
			submit: "Send karaoke",
			media_file: "Media file",
			media_file_tooltip: "Supported file formats: {formats}",
			lyrics_file: "Lyrics file",
			lyrics_file_toolitp: "Supported file formats: {formats}",
			title: "Song title",
			title_required: "Please enter a song title",
			title_tooltip: "If you don't know, put the name of the series here as well. In the case of an alternative version, name your title as: 'My title ~ Disco vers.' for example",
			series_tooltip: "TV series, movie title, video game title, etc.",
			series_singers_required: "Series or singers cannot be empty in the same time.",
			songtypes_required: "Song type is mandatory",
			songorder: "Song order",
			songorder_tooltip: "Opening/Ending number. If this is the only opening/ending in the series, leave blank.",
			langs_required: "Please choose a language",
			year: "Broadcast year",
			year_tooltip: "Year when the series was broadcasted or the video was produced",
			year_required: "Broadcast year is mandatory",
			songwriters_tooltip: "Songwriters compose lyrics AND music.",
			creators_tooltip: "Entity that created the series. Can be animation studio, movie studio, or game studio",
			authors_tooltip: "You should add yourself here ;)",
			authors_required: "Author of the kara is mandatory",
			groups_tooltip: "Download groups for this song. The song will be included in these download packs",
			created_at: "Creation date",
			modified_at: "Last updated date",
			add_success: "Karaoke sent successfully.",
			add_success_description: "An issue has been created on our tracker. You can check its progression at: ",
			add_error: "An error has occurred, karaoke has not been sent properly",
		}
	},
	layout: {
		loading: "Loading..."
	},
	footer: {
		home: "Project home",
		software_under_license: "Software under license",
		base_under_licence: "Karaoke base under license"
	},
	stats: {
		karaokes: "Karaoké | Karaokés",
		all_duration: "Duration of all karas",
		last_generation: "Last update",
		media_size: "Media Size"
	},
	duration: {
		days: "days",
		hours: "hours",
		minutes: "minutes",
		seconds: "seconds"
	},
	menu: {
		database: "Database",
		karas: "Songs",
		songtypes: "Types",
		tags: "Tags",
		miscs: "Miscs",
		groups: "Groups",
		families: "Families",
		origins: "Origins",
		genres: "Genres",
		platforms: "Platforms",
		singers: "Singers",
		series: "Series",
		songwriters: "Songwriters",
		creators: "Creators",
		authors: "Authors",
		languages: "Languages",
		years: "Years",
		community: "Community",
		kara_import: "Submit a kara",
		account: "Account",
		login: "Login",
		logout: "Logout",
		register: "Register",
		connection: "Connection",
		profile: "Profile"
	},
	search: {
		placeholder: "Series, singers, names...",
		sort: {
			a_z: "De A à Z",
			kara_count: "Kara count",
			recent: "Recent",
			most_played: "Most played",
			most_favorites: "Plus favoris",
			most_requested: "Plus demandés",
		},
		next: "Next page",
        previous: "Previous page",
		aria: {
			goto: "Go to page {0}",
			page: "Page {0}",
			sort: "Sort by"
		},
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
			submit: 'Signup'
		},
		profile: {
			title: 'Edit profile',
			fields: {
				username: {
					label: 'Username'
				},
				nickname: {
					label: 'Nickname',
					placeholder: 'LoveLiveFan93'
				},
				password: {
					label: 'Mot de passe',
					placeholder: 'EnVraiJePréfèreIdolM@ster'
				},
				password_confirmation: {
					label: 'Confirmation du mot de passe',
					placeholder: 'EnVraiJePréfèreIdolM@ster'
				},
				email: {
					label: 'Email',
					placeholder: 'test@shelter.moe'
				},
				
				url: {
					label: 'Url',
					placeholder: 'test@shelter.moe'
				},
				bio: {
					label: 'Biographie',
					placeholder: 'test@shelter.moe'
				},
			},
			submit: 'Sauvegarder',
			delete: 'Suppression du compte',
			series_name: {
				label: "Affichage des noms de série",
				original_name: "Nom original",
				song_lang: "Selon la langue de la chanson",
				user_lang: "Selon la langue de l'utilisateur",
				force_lang_series: "Forcer la langue des noms de séries",
				force_lang_series_main: "Langue des noms de séries",
				force_lang_series_fallback: "Langue de secours des noms de séries",
			}
		}
	},
	titles: {
		home: 'Home'
	}
}
