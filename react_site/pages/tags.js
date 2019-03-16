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
		this.state = {
			searchKeywords:"",
		}
		filterTools.setParams(props.filterParams);
	}

	componentWillUpdate(nextProps, nextState) {
		filterTools.setParams(nextProps.filterParams);
	}

	updateKeyword(event) {
	    // local state update of the search input field
	    filterTools.reset().setKeywords(event.target.value).save();
	    this.setState({
	    	searchKeywords: event.target.value,
	    })
	}

	render() {
		let kmax = 1;
		let keywords = this.state.searchKeywords;

		let tagList = [];
		for (let id in this.props.tags) {
			let tag = this.props.tags[id];
			if(tag.code=="misc")
			{
				kmax = Math.max(kmax,tag.karacount);
				if (tag.name === 'NO_TAG')
					tag.real_name = i18n.t('tag:no_tag');
				else
					tag.real_name = i18n.t('tag:misc.'+tag.name);
				
				if(keywords.length==0 || filterTools.keywordSearch(tag.real_name,keywords))
					tagList.push(tag);
			}
		}
		let total = tagList.length

		tagList.sort(function(a,b){
			return a.real_name.toLowerCase().localeCompare(b.real_name.toLowerCase());
		})

		tagList = tagList.map(function(tag){
			return {
				key: tag.tag_id,
				name : tag.real_name,
				karacount : tag.karacount,
				link : "/karas?"+querystring.stringify(filterTools.clear().addTag('misc',tag.tag_id).getQuery()),
				height : 100 * tag.karacount / kmax
			};
		})

		return (
			<div>
				<Head>
				<title key="title">{i18n.t('sitename')} - {i18n.t('category.tags')}</title>
				</Head>
				<div className="kmx-filter-keyword">
					<form onSubmit={(event) => event.preventDefault()}>
						<input type="text" value={keywords} onChange={(event) => this.updateKeyword(event)} placeholder={i18n.t('form.tags_keywords_placeholder')} />
						<button type="submit"><i className="fa fa-search"></i></button>
					</form>
				</div>
				<DedicatedTagtList type="misc" tags={tagList} />
			</div>
			)
	}
}

export default withNamespaces(['common','tag'])(Page)