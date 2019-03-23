import Router from 'next/router'
import { i18n } from '../i18n'
import querystring from 'querystring';
import RuntimeConfig from '../utils/RuntimeConfig';
const BASE_URL = RuntimeConfig.BASE_URL;
const API_URL = RuntimeConfig.API_URL;

export default function(path,query,res){
	let url = BASE_URL + path+'?'+querystring.stringify(query);
	/*
  if(i18n.language != i18n.options.defaultLanguage)
		url = '/'+i18n.language+path+'?'+querystring.stringify(query);
  */

	if (res) {
      res.writeHead(302, {
        Location: url
      })
      res.end()
    } else {
      Router.push(url)
    }
    return {}
}