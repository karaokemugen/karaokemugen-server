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
		let pageSize = 100;
		let page = filterTools.getPage()
		let keywords = this.state.searchKeywords;

		let tagList = [];
		for (let id in this.props.tags) {
			let tag = this.props.tags[id];
			if(tag.code=="author")
			{
				if (tag.name === 'NO_TAG')
					tag.name = i18n.t('tag:no_tag');
				kmax = Math.max(kmax,tag.karacount);
				if(keywords.length==0 || filterTools.keywordSearch(tag.name,keywords))
					tagList.push(tag);
			}
		}
		let total = tagList.length

		tagList.sort(function(a,b){
			return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
		})

		tagList = tagList.slice(page*pageSize,page*pageSize+pageSize);

		tagList = tagList.map(function(tag){
			return {
				key: tag.tag_id,
				name : tag.name,
				karacount : tag.karacount,
				link : "/karas?"+querystring.stringify(filterTools.clear().addTag('author',tag.tag_id).getQuery()),
				height : 100 * tag.karacount / kmax
			};
		})

		return (
			<div>
				<Head>
					<title key="title">{i18n.t('sitename')} - {i18n.t('category.authors')}</title>
				</Head>

				<div className="kmx-filter-keyword">
					<form onSubmit={(event) => event.preventDefault()}>
						<input type="text" value={keywords} onChange={(event) => this.updateKeyword(event)} placeholder={i18n.t('form.tags_keywords_placeholder')} />
						<button type="submit"><i className="fa fa-search"></i></button>
					</form>
				</div>

				<Pagination
					total={total}
					size={pageSize}
					current={page}
					renderUrl={(i) => { return "/authors?"+querystring.stringify(filterTools.reset().setPage(i).getQuery()); }}
					/>

				<DedicatedTagtList type="authors" tags={tagList} />
			</div>
			)
	}
}

export default withNamespaces(['common','tag'])(Page)