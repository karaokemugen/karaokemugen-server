import React from 'react'
import App, { Container } from 'next/app'
import Head from 'next/head'
import { i18n, appWithTranslation } from '../i18n'
import axios from 'axios'
import '../styles/index.scss';
import Header from '../components/Header';
import tagsMap from '../components/tagsMap.js';
import localForage from "localforage";
import querystring from 'querystring';
import FilterTools from '../utils/filterTools';
import RuntimeConfig from '../utils/RuntimeConfig';
const BASE_URL = RuntimeConfig.BASE_URL;
const API_URL = RuntimeConfig.API_URL;
const filterTools = new FilterTools();

class MyApp extends App {
	static async getInitialProps({ Component, router, ctx }) {
		let pageProps = {}

		const filterParams = filterTools.init(ctx.query);

		if(ctx.req)
		{
			//console.log('server side');
			// Server-side only (req not define client side)
		}
		else
		{
			//console.log('client side');
		}

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
			series:null,
			years:null,
		}
	}

	async componentDidMount() {
		if(this.state.tags===null)
		{
			localForage.config({
				name        : 'KaraokeXplorer',
				description : 'KaraokeXplorer tags cache'
			});
			var tag_uptodate = false;
			var response = await axios.get(API_URL+'/api/karas/lastUpdate')
			if(response.status===200 && response.data!==null)
			{
				var tag_lastupdate = await localForage.getItem('tag_lastupdate');
				tag_uptodate = typeof(tag_lastupdate) === 'object' && tag_lastupdate === new Date(response.data).getTime();
				if (!tag_uptodate)
					await localForage.setItem('tag_lastupdate', new Date(response.data).getTime());
			}

			var stats = await localForage.getItem('stats');
			if(stats===null || stats===undefined || !tag_uptodate)
			{
				var response = await axios.get(API_URL+'/api/karas/stats')
				if(response.status===200 && response.data!==null)
				{
					stats = response.data;
					stats.lastGeneration = await localForage.getItem('tag_lastupdate');
				}
				localForage.setItem('stats',stats)
			}
			if(stats!=null)
				this.setState({stats:stats});

			// Recupération des Tags si nécéssaire
			var lsTagsToRetrieve = [
				{code:'singer', id:tagsMap.singer.id},
				{code:'songtype', id:tagsMap.songtype.id},
				{code:'creator', id:tagsMap.creator.id},
				{code:'language', id:tagsMap.language.id},
				{code:'author', id:tagsMap.author.id},
				{code:'misc', id:tagsMap.misc.id},
				{code:'group', id:tagsMap.group.id},
				{code:'songwriter', id:tagsMap.songwriter.id},
				{code:'group', id:tagsMap.group.id},
				{code:'family', id:tagsMap.family.id},
				{code:'origin', id:tagsMap.origin.id},
				{code:'genre', id:tagsMap.genre.id},
				{code:'platform', id:tagsMap.platform.id},
			]
			var tags = await localForage.getItem('tags');
			if(tags===null || !tag_uptodate)
			{
				tags = {};
				for(let i in lsTagsToRetrieve)
				{
					let el = lsTagsToRetrieve[i];
					//console.log(el.code,API_URL+'/api/karas/tags/'+el.id)
					var response = await axios.get(API_URL+'/api/karas/tags/'+el.id)
					if(response.status===200 && response.data!==null && response.data.content)
					{
						response.data.content.map((v,i)=>{
							//console.log(v)
							v.code = el.code
							v.slug = filterTools.normalizeString(v.name)
							tags[''+v.tid] = v;
						});
					}
				}
				localForage.setItem('tags',tags)
			}
			if(tags!=null)
				this.setState({tags:tags});

			// Récupération des séries si nécéssaire
			var series = await localForage.getItem('series');
			if(series===null || !tag_uptodate)
			{
				series = {};
				var response = await axios.get(API_URL+'/api/karas/series')
				if(response.status===200 && response.data!==null && response.data.content)
				{
					response.data.content.map((v,i)=>{
						series[v.sid] = v;
					});
				}
				localForage.setItem('series',series)
			}
			if(series!=null)
				this.setState({series:series});

			// Récupération des années si nécéssaire
			var years = await localForage.getItem('years');
			if(years===null || !tag_uptodate)
			{
				years = {};
				var response = await axios.get(API_URL+'/api/karas/years')
				if(response.status===200 && response.data!==null && response.data)
				{
					response.data.map((v,i)=>{
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
			<Container>
				<Head>
					<title key="title">{i18n.t('sitename')}</title>
					<meta name="viewport" content="width=device-width" />
					<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.css" />
				</Head>
				<Header {...pageProps} />
				<Component {...pageProps} stats={this.state.stats} tags={this.state.tags} series={this.state.series} years={this.state.years}  />
			</Container>
		)
	}
}

export default appWithTranslation(MyApp)