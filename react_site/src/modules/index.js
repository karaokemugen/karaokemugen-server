import { combineReducers } from 'redux';

import auth from './auth';
import profile from './profile';
import i18n from './i18n';
import karas from './karas';

export default combineReducers({
	auth,
	profile,
	i18n,
	karas,
});
