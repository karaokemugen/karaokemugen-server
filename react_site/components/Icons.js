import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faIgloo, faTags, faTag, faMicrophoneAlt, faTv, faSignature,faChalkboardTeacher, faUserSecret, faLanguage, faCalendarAlt, faGlobe } from '@fortawesome/free-solid-svg-icons'
import { faCreativeCommonsSampling } from '@fortawesome/free-brands-svg-icons'

export default {
	home: <FontAwesomeIcon icon={faIgloo} />,
	karas: <FontAwesomeIcon icon={faCreativeCommonsSampling} />,
	kara: <FontAwesomeIcon icon={faCreativeCommonsSampling} />,
	tags: <FontAwesomeIcon icon={faTags} />,
	tag: <FontAwesomeIcon icon={faTag} />,
	singers: <FontAwesomeIcon icon={faMicrophoneAlt} />,
	singer: <FontAwesomeIcon icon={faMicrophoneAlt} />,
	series: <FontAwesomeIcon icon={faTv} />,
	serie: <FontAwesomeIcon icon={faTv} />,
	songwriters: <FontAwesomeIcon icon={faSignature} />,
	songwriter: <FontAwesomeIcon icon={faSignature} />,
	creators: <FontAwesomeIcon icon={faChalkboardTeacher} />,
	creator: <FontAwesomeIcon icon={faChalkboardTeacher} />,
	authors: <FontAwesomeIcon icon={faUserSecret} />,
	author: <FontAwesomeIcon icon={faUserSecret} />,
	languages: <FontAwesomeIcon icon={faLanguage} />,
	language: <FontAwesomeIcon icon={faGlobe} />,
	years: <FontAwesomeIcon icon={faCalendarAlt} />,
	year: <FontAwesomeIcon icon={faCalendarAlt} />,
	video_play: <FontAwesomeIcon icon={faPlay} />,
}