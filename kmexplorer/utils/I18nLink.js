import React from 'react'
import Link from 'next/link'
import { i18n } from '../i18n'
import RuntimeConfig from '../utils/RuntimeConfig';
const BASE_URL = RuntimeConfig.BASE_URL;

export default class I18nLink extends React.Component {

	render() {
		var lng = this.props.lang ? this.props.lang : i18n.language;
		if(lng!='en' || this.props.lang)
			lng = '/' + lng;
		else
			lng = '';
		var url = this.props.href;
		return <Link href={url} as={BASE_URL + url}>{this.props.children}</Link>
	}
}