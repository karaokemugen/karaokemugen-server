import React from 'react'
import { i18n, withNamespaces } from '../i18n'
import i18nRouterPush from '../utils/i18nRouterPush'
import Head from 'next/head'
import axios from 'axios'
import Pagination from '../components/Pagination';
import DedicatedTagtList from '../components/DedicatedTagList';
import tagsMap from '../components/tagsMap.js';
import querystring from 'querystring';
import FilterTools from '../utils/filterTools';
const filterTools = new FilterTools();


class Page extends React.Component {
	static async getInitialProps({ req, query, res }) {

		let namespacesRequired = ['common', 'tag'];

		return { namespacesRequired };
	}

	constructor (props) {
		super(props)
		this.state = {}
	}


	render() {
		return (
			<div>
				<Head>
					<title key="title">{i18n.t('sitename')} - {i18n.t('category.home')}</title>
				</Head>

				<p>TODO : add some real dashboard interface as homepage</p>
			</div>
		);
	}
}

export default withNamespaces(['common','tag'])(Page)