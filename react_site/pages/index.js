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
import duration from '../utils/date';
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

		var count = {
			singer:0,
			songtype:0,
			creator:0,
			language:0,
			author:0,
			misc:0,
			group:0,
			songwriter:0,
			serie:0,
			karas:0,
			duration:0
		};
		if(this.props.stats)
		{
			count.singer = this.props.stats.singers;
			count.creator = this.props.stats.creators;
			count.language = this.props.stats.languages;
			count.author = this.props.stats.authors;
			count.songwriter = this.props.stats.songwriters;
			count.serie = this.props.stats.series;
			count.karas = this.props.stats.karas;
			count.duration = this.props.stats.duration;
			count.lastGeneration = this.props.stats.lastGeneration;
		}
		if(this.props.tags)
		{
			for (let i in this.props.tags)
			{
				let t = this.props.tags[i];
				if(t.code==='misc') count.misc++;
				if(t.code==='songtype') count.songtype++;
				if(t.code==='group') count.group++;
			}
		}

		return (
			<div>
				<Head>
					<title key="title">{i18n.t('sitename')} - {i18n.t('category.home')}</title>
				</Head>

				<div className="km-home">
					<img className="km-home--logo" src={require('../static/images/km-logo.png')} />

					<ul className="km-home--stats">
						<li key="karas"><strong>{count.karas>0 ? count.karas : '-'}</strong> <span>{i18n.t("category.karas")}</span></li>
						<li key="serie"><strong>{count.serie>0 ? count.serie : '-'}</strong> <span>{i18n.t("category.series")}</span></li>
						<li key="singer"><strong>{count.singer>0 ? count.singer : '-'}</strong> <span>{i18n.t("category.singers")}</span></li>
						<li key="creator"><strong>{count.creator>0 ? count.creator : '-'}</strong> <span>{i18n.t("category.creators")}</span></li>
						<li key="language"><strong>{count.language>0 ? count.language : '-'}</strong> <span>{i18n.t("category.languages")}</span></li>
						<li key="author"><strong>{count.author>0 ? count.author : '-'}</strong> <span>{i18n.t("category.authors")}</span></li>
						<li key="misc"><strong>{count.misc>0 ? count.misc : '-'}</strong> <span>{i18n.t("category.tags")}</span></li>
						<li key="songwriter"><strong>{count.songwriter>0 ? count.songwriter : '-'}</strong> <span>{i18n.t("category.songwriters")}</span></li>
						<li className="km-home--stats--wide" key="lastGeneration"><span>{i18n.t("stats.last_generation")}</span> : <strong>{count.duration>0 ? count.lastGeneration.toLocaleString() : '-'}</strong></li>
						<li className="km-home--stats--wide" key="duration"><span>{i18n.t("stats.all_duration")} :</span> <strong>{count.duration>0 ? duration(count.duration) : '-'}</strong></li>
					</ul>
				</div>
			</div>
		);
	}
}

export default withNamespaces(['common','tag'])(Page)