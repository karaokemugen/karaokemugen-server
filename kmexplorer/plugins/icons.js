import Vue from 'vue';
import { config, library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon, FontAwesomeLayers } from '@fortawesome/vue-fontawesome';
import { faLaptop, faChalkboardTeacher, faUserSecret, faQuestionCircle, faTag, faBox, faUpload, faCircle, faPlay, faTasks, faTv, faGlobe, faMicrophoneAlt, faSignature, faPhotoVideo, faProjectDiagram, faChess } from '@fortawesome/free-solid-svg-icons';

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

// Register the component globally
Vue.component('font-awesome-icon', FontAwesomeIcon);
Vue.component('font-awesome-layers', FontAwesomeLayers);
