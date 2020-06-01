import React from 'react'
import App from 'next/app'
import Head from 'next/head'
import { i18n, appWithTranslation } from '../i18n'
import axios from 'axios'
import '../styles/index.scss';
import Header from '../components/Header';
import Footer from '../components/Footer';
import tagsMap from '../components/tagsMap.js';
import localForage from "localforage";
import FilterTools from '../utils/filterTools';
import RuntimeConfig from '../utils/RuntimeConfig';
const API_URL = RuntimeConfig.API_URL;
const filterTools = new FilterTools();

class MyApp extends App {
	static async getInitialProps({ Component, router, ctx }) {
		let pageProps = {}

		const filterParams = filterTools.init(ctx.query);

		if (Component.getInitialProps) {
			pageProps = await Component.getInitialProps(ctx)
		}

		pageProps.filterParams = filterParams;
		pageProps.router = router;

		return { pageProps }
	}

	// constructor called only on server render
	constructor (props) {
		// on met à jour le "State" de l'applicatif
		// state sera conservé au fil de la navigation
		// (les props disparaissent après la génération coté serveur)
		super(props)
		this.state = {
			tags:null,
			years:null,
		}
	}

	async componentDidMount() {
		var response = await axios.get(API_URL+'/api/settings');
		if(response.status===200) {
			await localForage.setItem('config',response.data.config)
		}
		if(this.state.tags === null) {
			localForage.config({
				name        : 'KaraokeXplorer',
				description : 'KaraokeXplorer tags cache'
			});
			var tag_uptodate = false;
			var response = await axios.get(API_URL+'/api/karas/lastUpdate')
			if(response.status===200 && response.data !== null) {
				var tag_lastupdate = await localForage.getItem('tag_lastupdate');
				tag_uptodate = tag_lastupdate === new Date(response.data).getTime();
				if (!tag_uptodate)
					await localForage.setItem('tag_lastupdate', new Date(response.data).getTime());
			}

			var stats = await localForage.getItem('stats');
			if(stats===null || stats===undefined || !tag_uptodate) {
				var response = await axios.get(API_URL+'/api/karas/stats')
				if(response.status===200 && response.data!==null) {
					stats = response.data;
					stats.lastGeneration = await localForage.getItem('tag_lastupdate');
				}
				localForage.setItem('stats',stats)
			}
			if(stats!=null)
				this.setState({stats:stats});

			var tags = await localForage.getItem('tags');
			if(tags===null || !tag_uptodate) {
				tags = {};
				var response = await axios.get(API_URL+'/api/karas/tags')
				if(response.status===200 && response.data!==null && response.data.content) {
					response.data.content.map(v => {
						v.slug = filterTools.normalizeString(v.name)
						tags[''+v.tid] = v;
					});
				}
				localForage.setItem('tags',tags)
			}
			if(tags!=null)
				this.setState({tags:tags});

			// Récupération des années si nécéssaire
			var years = await localForage.getItem('years');
			if(years===null || !tag_uptodate) {
				years = {};
				var response = await axios.get(API_URL+'/api/karas/years')
				if(response.status===200 && response.data!==null && response.data) {
					response.data.map(v => {
						years[v.year] = v;
					});
				}
				localForage.setItem('years',years)
			}
			if(years!=null)
				this.setState({years:years});
		}
	}

	render() {
		const { Component, pageProps } = this.props

		return (
			<>
				<Head>
					<title key="title">{i18n.t('sitename')}</title>
					<meta name="viewport" content="width=device-width" />
				</Head>
				<Header {...pageProps} />
				<Component {...pageProps} stats={this.state.stats} tags={this.state.tags} years={this.state.years}  />
				<Footer {...pageProps} />
			</>
		)
	}
}

export default appWithTranslation(MyApp)