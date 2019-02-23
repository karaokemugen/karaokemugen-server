import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faIgloo, faTags, faTag, faMicrophoneAlt, faTv, faSignature,faChalkboardTeacher, faUserSecret, faLanguage, faCalendarAlt, faGlobe } from '@fortawesome/free-solid-svg-icons'

library.add(faPlay)
library.add(faIgloo)
library.add(faTags)
library.add(faTag)
library.add(faMicrophoneAlt)
library.add(faTv)
library.add(faSignature)
library.add(faChalkboardTeacher)
library.add(faUserSecret)
library.add(faLanguage)
library.add(faGlobe)
library.add(faCalendarAlt)

export default {
	karas: <FontAwesomeIcon icon="igloo" />,
	kara: <FontAwesomeIcon icon="igloo" />,
	tags: <FontAwesomeIcon icon="tags" />,
	tag: <FontAwesomeIcon icon="tag" />,
	singers: <FontAwesomeIcon icon="microphone-alt" />,
	singer: <FontAwesomeIcon icon="microphone-alt" />,
	series: <FontAwesomeIcon icon="tv" />,
	serie: <FontAwesomeIcon icon="tv" />,
	songwriters: <FontAwesomeIcon icon="signature" />,
	songwriter: <FontAwesomeIcon icon="signature" />,
	creators: <FontAwesomeIcon icon="chalkboard-teacher" />,
	creator: <FontAwesomeIcon icon="chalkboard-teacher" />,
	authors: <FontAwesomeIcon icon="user-secret" />,
	author: <FontAwesomeIcon icon="user-secret" />,
	languages: <FontAwesomeIcon icon="language" />,
	language: <FontAwesomeIcon icon="globe" />,
	years: <FontAwesomeIcon icon="calendar-alt" />,
	year: <FontAwesomeIcon icon="calendar-alt" />,
	video_play: <FontAwesomeIcon icon="play" />,
}