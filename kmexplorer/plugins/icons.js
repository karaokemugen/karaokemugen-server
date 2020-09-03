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
	faClosedCaptioning
} from '@fortawesome/free-solid-svg-icons';

// This is important, we are going to let Nuxt.js worry about the CSS
config.autoAddCss = false;

library.add(faQuestionCircle);
library.add(faUpload);
library.add(faCircle);
library.add(faPlay);
library.add(faTasks);
library.add(faTv);
library.add(faGlobe);
library.add(faMicrophoneAlt);
library.add(faSignature);
library.add(faPhotoVideo);
library.add(faProjectDiagram);
library.add(faChess);
library.add(faLaptop);
library.add(faChalkboardTeacher);
library.add(faUserSecret);
library.add(faBox);
library.add(faTag);
library.add(faFileImport);
library.add(faTags);
library.add(faList);
library.add(faSignInAlt);
library.add(faSignOutAlt);
library.add(faEdit);
library.add(faCloudDownloadAlt);
library.add(faStar);
library.add(faFileExport);
library.add(faMeh);
library.add(faMusic);
library.add(faDatabase);
library.add(faCloudUploadAlt);
library.add(faUser);
library.add(faBoxes);
library.add(faLanguage);
library.add(faCalendarAlt);
library.add(faPen);
library.add(faLock);
library.add(faFolderPlus);
library.add(faEraser);
library.add(faPlus);
library.add(faClosedCaptioning);

// Register the component globally
Vue.component('font-awesome-icon', FontAwesomeIcon);
Vue.component('font-awesome-layers', FontAwesomeLayers);
