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
		};
		if(this.props.tags)
		{
			for (let i in this.props.tags)
			{
				let t = this.props.tags[i];
				if(t.code==='singer') count.singer++;
				if(t.code==='songtype') count.songtype++;
				if(t.code==='creator') count.creator++;
				if(t.code==='language') count.language++;
				if(t.code==='author') count.author++;
				if(t.code==='misc') count.misc++;
				if(t.code==='group') count.group++;
				if(t.code==='songwriter') count.songwriter++;
			}
		}
		if(this.props.series)
		{
			count.serie = Object.keys(this.props.series).length;
		}

		return (
			<div>
				<Head>
					<title key="title">{i18n.t('sitename')} - {i18n.t('category.home')}</title>
				</Head>

				<p key="serie">{count.serie>0 ? count.serie : '-'} {i18n.t("category.series")}</p>
				<p key="singer">{count.singer>0 ? count.singer : '-'} {i18n.t("category.singer")}</p>
				<p key="songtype">{count.songtype>0 ? count.songtype : '-'} {i18n.t("category.songtype")}</p>
				<p key="creator">{count.creator>0 ? count.creator : '-'} {i18n.t("category.creator")}</p>
				<p key="language">{count.language>0 ? count.language : '-'} {i18n.t("category.language")}</p>
				<p key="author">{count.author>0 ? count.author : '-'} {i18n.t("category.author")}</p>
				<p key="misc">{count.misc>0 ? count.misc : '-'} {i18n.t("category.tag")}</p>
				<p key="group">{count.group>0 ? count.group : '-'} {i18n.t("category.group")}</p>
				<p key="songwriter">{count.songwriter>0 ? count.songwriter : '-'} {i18n.t("category.songwriter")}</p>
			</div>
		);
	}
}

export default withNamespaces(['common','tag'])(Page)