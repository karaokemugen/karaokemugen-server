import Vue from 'vue';
import { config, library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon, FontAwesomeLayers } from '@fortawesome/vue-fontawesome';
import {
	faList,
	faTags,
	faFileImport,
	faLaptop,
	faChalkboardTeacher,
	faUserSecret,
	faQuestionCircle,
	faTag,
	faBox,
	faUpload,
	faCircle,
	faPlay,
	faTasks,
	faTv,
	faGlobe,
	faMicrophoneAlt,
	faSignature,
	faPhotoVideo,
	faProjectDiagram,
	faChess,
	faSignInAlt,
	faSignOutAlt,
	faEdit,
	faCloudDownloadAlt,
	faStar,
	faFileExport,
	faMeh,
	faMusic,
	faDatabase,
	faCloudUploadAlt,
	faUser,
	faBoxes,
	faLanguage,
	faCalendarAlt,
	faPen,
	faLock,
	faFolderPlus,
	faEraser,
	faPlus,
	faClosedCaptioning,
	faExternalLinkAlt,
	faFileVideo,
	faClock,
	faTachometerAlt,
	faSearch,
	faDice,
	faPortrait,
	faPersonBooth,
	faMinus,
	faImage,
	faChevronUp,
	faChevronDown,
	faHistory,
	faUserLock,
	faKey,
	faLink,
	faUsers,
	faUserShield,
	faUserCog,
	faHeart,
	faEye,
	faEyeSlash,
	faFilm,
	faExclamationTriangle,
	faLayerGroup
} from '@fortawesome/free-solid-svg-icons';
import {
	faTwitter,
	faInstagram,
	faDiscord,
	faTwitch
} from '@fortawesome/free-brands-svg-icons';

// This is important, we are going to let Nuxt.js worry about the CSS
config.autoAddCss = false;

library.add(
	faList,
	faTags,
	faFileImport,
	faLaptop,
	faChalkboardTeacher,
	faUserSecret,
	faQuestionCircle,
	faTag,
	faBox,
	faUpload,
	faCircle,
	faPlay,
	faTasks,
	faTv,
	faGlobe,
	faMicrophoneAlt,
	faSignature,
	faPhotoVideo,
	faProjectDiagram,
	faChess,
	faSignInAlt,
	faSignOutAlt,
	faEdit,
	faCloudDownloadAlt,
	faStar,
	faFileExport,
	faMeh,
	faMusic,
	faDatabase,
	faCloudUploadAlt,
	faUser,
	faBoxes,
	faLanguage,
	faCalendarAlt,
	faPen,
	faLock,
	faFolderPlus,
	faEraser,
	faPlus,
	faMinus,
	faClosedCaptioning,
	faExternalLinkAlt,
	faFileVideo,
	faClock,
	faTachometerAlt,
	faSearch,
	faDice,
	faPortrait,
	faPersonBooth,
	faImage,
	faChevronUp,
	faChevronDown,
	faHistory,
	faUserLock,
	faKey,
	faLink,
	faUsers,
	faTwitter,
	faInstagram,
	faDiscord,
	faTwitch,
	faHeart,
	faUserShield,
	faUserCog,
	faEye,
	faEyeSlash,
	faFilm,
	faExclamationTriangle,
	faLayerGroup);

// Register the component globally
Vue.component('FontAwesomeIcon', FontAwesomeIcon);
Vue.component('FontAwesomeLayers', FontAwesomeLayers);
