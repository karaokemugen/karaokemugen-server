import Cookies from 'js-cookie';
import i18next from 'i18next';

// implement here the browser language detection and/or cookie based setting
i18next.init({
  debug: false,
  returnNull:false, // null is not a valid translation
  returnEmptyString:true, // empty string is a valid translation
  defaultNS:'message',
  nsSeparator:':',
  keySeparator:'.',
  resources: {
    fr: {
      message: require(`../i18n/fr/message.json`),
      map: require(`../i18n/fr/map.json`),
      karadownloader: require(`../i18n/fr/karadownloader.json`)
    },
    en: {
      message: require(`../i18n/en/message.json`),
      map: require(`../i18n/en/map.json`),
      karadownloader: require(`../i18n/en/karadownloader.json`)
    },
    /*
    // Load here some more locales
    en: { translation: require('./i18n/en.json') }
    en: { translation: require('./i18n/en.json') }
    en: { translation: require('./i18n/en.json') }
    */
  }
});


export const SET_CURRENT_LOCALE = 'i18n/SET_CURRENT_LOCALE';

const defaultLanguage = 'fr';
const initialState = {
  currentLocale: null
};

export default (state = initialState, action) => {
  switch (action.type) {
    case SET_CURRENT_LOCALE:
      return {
        ...state,
        currentLocale: action.locale
      };

    default:
      return state;
  }
};

export const setCurrentLocale = locale => dispatch =>
  new Promise(resolve => {
    i18next.changeLanguage(locale);

    dispatch({
      type: SET_CURRENT_LOCALE,
      locale
    });

    Cookies.set('website.locale', locale);

    resolve(locale);
  });

export const establishCurrentLocale = () => dispatch =>
  new Promise(resolve => {
    let localeFromCookie = Cookies.getJSON('website.locale');

    if (localeFromCookie) {
      dispatch(setCurrentLocale(localeFromCookie));
      resolve(localeFromCookie);
    } else {
      dispatch(setCurrentLocale(defaultLanguage));
      resolve(defaultLanguage);
    }
  });
