export default {
	error: {
		generic: 'Erreur',
		home: 'Aller à l\'accueil'
	},
	kara: {
		phrase: '{songtype} de {series}',
		meta: '{songtitle} de {serieSinger}',
		notfound: 'Karaoké non trouvé',
		tagtypes: {
			series: 'Série | Séries',
			langs: 'Langue | Langues',
			songtypes: 'Type de chanson | Types de chanson',
			singers: 'Chanteur | Chanteurs',
			songwriters: 'Compositeur | Compositeurs',
			families: 'Famille | Familles',
			origins: 'Origine | Origines',
			genres: 'Genre | Genres',
			platforms: 'Plateforme | Plateformes',
			creators: 'Créateur | Créateurs',
			authors: 'Auteur de karaokés | Auteurs de karaokés',
			groups: 'Groupe | Groupes',
			misc: 'Divers'
		},
		add: 'Télécharger dans l\'application',
		download: 'Télécharger le karaoké au format karabundle',
		favorites: {
			add: 'Ajouter aux favoris',
			remove: 'Retirer des favoris'
		},
		problem: {
			title: 'Un problème avec {title} ?',
			btn: {
				report: 'Signaler un problème',
				edit: 'Proposer une modification'
			},
			form: {
				title: 'Signaler un problème',
				subtitle: 'Nous faisons de notre mieux pour avoir une base de karaokés sans lacunes, cependant il en reste sûrement encore à certains endroits. Merci de votre aide !',
				type: {
					label: 'Type du problème',
					time: 'Paroles mal synchronisées',
					quality: 'Vidéo de mauvaise qualité'
				},
				comment: {
					label: 'Commentaire',
					placeholder: 'Les paroles se désynchronisent au bout de 2 minutes.'
				},
				username: {
					label: 'Votre nom',
					placeholder: 'MéticuleuxMoiÊtre'
				},
				submit: 'Envoyer',
				thanks: {
					text: 'Merci ! Nous allons résoudre le problème dès que possible, le problème est suivi à cette adresse : {url}',
					btn: 'Fermer'
				}
			}
		},
		import: {
			description: 'Ce formulaire permet d\'envoyer un karaoké à l\'équipe de Karaoke Mugen. Il ne sera pas intégré immédiatement dans la base de karaokés car il nécessite une validation préalable. Aussi, votre karaoké peut être modifié par l\'équipe de Karaoke Mugen s\'il ne convient pas aux normes. Reportez-vous à la documentation pour plus d\'information, section "Guide du contributeur" puis "Documents de référence".',
			attention: 'ATTENTION :',
			check_in_progress: 'Merci de vérifier la liste des karaokés en cours de réalisation avant de proposer un karaoké. Cela évitera à tout le monde de faire deux fois le travail, et le monde sera meilleur.',
			documentation_link: 'Documentation',
			in_progress_link: 'Liste des karaokés en cours',
			license_reminder: 'Votre karaoké sera publié avec la licence {name}',
			license_link: 'Renseignez-vous sur cette licence en cliquant ici.',
			add: 'Ajout',
			create: 'Créer',
			choose_file: 'Choisissez un fichier',
			add_file_media_error: '{name} n\'est pas un fichier vidéo',
			add_file_lyrics_error: '{name} n\'est pas un fichier de sous-titres',
			add_file_success: 'Le fichier {name} a été ajouté avec succès',
			comment_tooltip: 'Si vous voulez donner des indications aux mainteneurs de la base de karaokés ou simplement dire merci, faites-le ici !',
			comment: 'Un commentaire ?',
			comment_edit: 'N\'hésitez pas à signer votre correction pour qu\'on sache qui vous êtes !',
			submit: 'Envoyer ce karaoké',
			media_file: 'Fichier vidéo',
			media_file_required: 'Le fichier média est obligatoire',
			media_file_tooltip: 'Formats de fichier acceptés : {formats}',
			lyrics_file: 'Fichier de sous-titres',
			lyrics_file_tooltip: 'Format de fichier accepté : {formats}',
			title: 'Titre du morceau',
			title_required: 'Le titre est obligatoire',
			title_tooltip: 'Si vous ne le connaissez pas, mettez le nom de la série. Dans le cas d\'une version alternative, nommez votre titre ainsi : \'Mon titre ~ Disco vers.\' par exemple',
			series_tooltip: 'Série TV, nom de film, de jeu vidéo, etc.',
			series_singers_required: 'Les champs Séries et Chanteurs ne peuvent être vide en même temps.',
			songtypes_required: 'Le type de chanson est obligatoire',
			songorder: 'Numéro de chanson',
			songorder_invalid: 'Le numéro de chanson est invalide',
			songorder_tooltip: 'Numéro de l\'opening/ending/etc. Si c\'est le seul opening/ending dans la série, laissez vide.',
			langs_required: 'Choisissez une langue',
			year: 'Année de diffusion',
			year_tooltip: 'Année de la diffusion de la série ou de la vidéo',
			year_required: 'L\'année de diffusion est obligatoire',
			year_invalid: 'L\'année de diffusion est invalide',
			songwriters_tooltip: 'Compositeurs et paroliers',
			creators_tooltip: 'Entité qui a créé la série ou le clip. Peut être un studio d\'animation, de cinéma, de jeu vidéo, etc.',
			authors_tooltip: 'Vous devriez vous ajouter ici ;)',
			authors_required: 'L\'auteur du karaoké est obligatoire',
			groups_tooltip: 'Groupes de téléchargement pour ce morceau. Le morceau sera ajouté dans ces paquets pour le téléchargement',
			created_at: 'Date de création',
			modified_at: 'Date de dernière mise à jour',
			add_success: 'Votre karaoké est envoyé !',
			add_success_description: 'Un ticket a été crée sur notre outil de suivi. Vous pouvez consulter l\'avancement de l\'intégration de votre karaoké : {url}',
			add_error: 'Une erreur a eu lieu, le karaoké n\'a pas pu être envoyé'
		}
	},
	layout: {
		loading: 'Chargement...',
		suggest: 'Vous ne trouvez pas ?',
		suggest_open: 'Suggérez-le nous !',
		empty: 'C\'est la fin de vos favoris.',
		explore: 'Allez en ajouter !',
		results: '{count} résulat | {count} résultats',
		slogan: 'Ce son est disponible sur la base Karaoke Mugen !'
	},
	footer: {
		home: 'Accueil du projet',
		software_under_license: 'Logiciel sous licence ',
		base_under_licence: 'Base de karaokés sous licence'
	},
	stats: {
		karaokes: 'Karaoké | Karaokés',
		all_duration: 'Durée de tous les karas',
		last_generation: 'Dernière mise à jour',
		media_size: 'Taille des médias'
	},
	home: {
		noInstance: {
			title: 'Aucune instance de Karaoke Mugen ne fonctionne sur votre réseau local.',
			1: 'Vérifiez que vous êtes bien sur le même réseau Wi-Fi que sur le serveur.',
			2: 'Assurez-vous que l\'application Karaoke Mugen fonctionne. Merci de vérifier que le paramètre kara.moe est actif dans Options -> Karaoké -> URL d\'accès courte.',
			3: 'Si vous souhaitez juste consulter la base, vous pouvez ignorer cet avertissement.'
		}
	},
	duration: {
		days: 'jours',
		hours: 'heures',
		minutes: 'minutes',
		seconds: 'secondes'
	},
	menu: {
		add_repository: 'Ajouter ce dépôt à votre app',
		database: 'Base de données',
		karas: 'Chansons',
		songtypes: 'Types',
		tags: 'Tags',
		miscs: 'Divers',
		groups: 'Groupes',
		families: 'Familles',
		origins: 'Origines',
		genres: 'Genres',
		platforms: 'Plateformes',
		singers: 'Chanteurs',
		series: 'Séries',
		songwriters: 'Compositeurs',
		creators: 'Créateurs',
		authors: 'Auteurs',
		languages: 'Langues',
		years: 'Années',
		community: 'Communauté',
		kara_import: 'Envoyer un kara',
		account: 'Compte',
		favorites: 'Favoris',
		login: 'Se connecter',
		logout: 'Se déconnecter',
		register: 'S\'inscrire',
		connection: 'Connexion',
		profile: 'Profil'
	},
	search: {
		placeholder: 'Séries, chanteurs, noms...',
		sort: {
			a_z: 'De A à Z',
			kara_count: 'Nombre de chansons',
			recent: 'Mise à jour récente',
			most_played: 'Plus joués',
			most_favorites: 'Plus favoris',
			most_requested: 'Plus demandés'
		},
		next: 'Page suivante',
		previous: 'Page précédente',
		aria: {
			goto: 'Aller à la page {0}',
			page: 'Page {0}',
			sort: 'Trier par'
		}
	},
	modal: {
		login: {
			title: 'Se connecter',
			subtitle: 'Connectez-vous à votre compte en ligne pour voir vos favoris et éditer votre profil !',
			fields: {
				username: {
					label: 'Nom d\'utilisateur',
					placeholder: 'LoveLiveFan93'
				},
				password: {
					label: 'Mot de passe',
					placeholder: 'EnVraiJePréfèreIdolM@ster'
				},
				forgot_password: {
					label: 'Mot de passe oublié ?',
					error: 'Impossible de vous envoyer un email de réinitialisation : contactez l\'administrateur du serveur dont vous dépendez',
					success: 'Un email avec un lien pour réinitialiser votre mot de passe vous a été envoyé.'
				}
			},
			submit: 'Se connecter'
		},
		signup: {
			title: 'S\'inscrire',
			subtitle: 'Inscrivez-vous pour voir vos favoris et éditer votre profil !',
			fields: {
				username: {
					label: 'Nom d\'utilisateur',
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
				}
			},
			passwords_mismatch: 'Les mots de passe ne correspondent pas',
			submit: 'S\'inscrire'
		},
		profile: {
			title: 'Editer son profil',
			fields: {
				username: {
					label: 'Nom d\'utilisateur'
				},
				nickname: {
					label: 'Pseudo',
					placeholder: 'LoveLiveFan93'
				},
				password: {
					header: 'Changer le mot de passe',
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
					placeholder: 'https://karaokes.moe'
				},
				bio: {
					label: 'Biographie',
					placeholder: 'C\'est la vie'
				}
			},
			passwords_mismatch: 'Les mots de passe ne correspondent pas',
			submit: 'Sauvegarder',
			delete: 'Suppression du compte',
			series_name: {
				label: 'Affichage des noms de série',
				original_name: 'Nom original',
				song_lang: 'Selon la langue de la chanson',
				mode_admin: 'Selon la langue de Karaoke Mugen',
				user_lang: 'Selon la langue de l\'utilisateur',
				mode_no_pref: 'Pas de préférence',
				force_lang_series: 'Forcer la langue des noms de séries',
				force_lang_series_main: 'Langue des noms de séries',
				force_lang_series_fallback: 'Langue de secours des noms de séries'
			}
		},
		add_repository: {
			button: 'Dépôt :',
			label: 'Ajouter ce dépôt à votre application Karaoke Mugen !',
			desc: 'Vous pouvez ajouter ce dépôt à votre application Karaoke Mugen en cliquant sur le bouton ci-dessous. Si Karaoke Mugen n\'est pas installé sur votre ordinateur, ce bouton n\'aura aucun effet.',
			download: 'L\'application est téléchargeable ici.',
			manual: 'Pour ajouter manuellement ce dépôt, ouvrez votre application Karaoke Mugen, ajoutez-y le dépôt {repository}, cochant la case "{online}" puis rendez-vous dans le gestionnaire de téléchargements.',
			online: 'En ligne',
			add: 'Ajouter',
			cancel: 'Annuler'
		},
		suggest: {
			title: 'Suggestion',
			subtitle: 'Vous n\'avez pas trouvé votre bonheur ? Vous pouvez quand même nous formuler une recommandation.',
			fields: {
				title: {
					label: 'Titre',
					placeholder: 'JINGO JUNGLE'
				},
				series: {
					label: 'Série / Chanteur',
					placeholder: 'Yôjo Senki: Saga of Tanya the Evil'
				},
				type: {
					label: 'Type'
				},
				link: {
					label: 'Lien',
					placeholder: 'https://www.youtube.com/watch?v=5VRyiaszGtA'
				},
				name: {
					label: 'Votre nom',
					placeholder: 'Anonyme magique'
				}
			},
			submit: 'Envoyer',
			submitted: {
				subtitle: 'Message reçu !',
				text: 'Votre suggestion a été reçue, vous pouvez voir le suivi de cette suggestion en cliquant {here}.',
				here: 'ici',
				close: 'Fermer'
			}
		}
	},
	titles: {
		home: 'Accueil'
	},
	toast: {
		LOG_ERROR: 'Identifiants incorrects.',
		USER_CREATED: 'Utilisateur créé avec succès',
		GENERATED_KARA: 'Karaoké envoyé avec succès.',
		EDITED_KARA: 'Modification envoyée avec succès.',
		CANNOT_GENERATE_KARA: 'Impossible d\'envoyer le karaoké.',
		CANNOT_EDIT_KARA: 'Impossible d\'envoyer la modification.',
		FILE_UPLOADED: 'Fichier mis en ligne.',
		USER_EDITED: 'Utilisateur édité avec succès'
	}
};
