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
			orderBy:"quantity",
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

	updateOrder(mode) {
	    this.setState({
	    	orderBy: mode,
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
			if(tag.code=="songtype")
			{
				kmax = Math.max(kmax,tag.karacount);
				tag.real_name = i18n.t('tag:songtype.'+tag.name);
				if(keywords.length==0 || filterTools.keywordSearch(tag.real_name,keywords))
					tagList.push(tag);
			}
		}
		let total = tagList.length

		tagList = tagList.map(function(tag){
			return {
				key: tag.tag_id,
				name : tag.real_name,
				karacount : tag.karacount,
				link : "/karas?"+querystring.stringify(filterTools.clear().addTag('songtype',tag.tag_id,tag.slug).getQuery()),
				height : 100 * tag.karacount / kmax
			};
		})

		return (
			<div>
				<Head>
					<title key="title">{i18n.t('sitename')} - {i18n.t('category.types')}</title>
				</Head>

				<div className="kmx-filter-keyword">
					<form onSubmit={(event) => event.preventDefault()}>
						<input type="text" value={keywords} onChange={(event) => this.updateKeyword(event)} placeholder={i18n.t('form.tags_keywords_placeholder')} />
						<button type="submit"><i className="fa fa-search"></i></button>
					</form>
				</div>
				<DedicatedTagtList type="songtypes" tags={tagList} />
			</div>
			)
	}
}

export default withNamespaces(['common','tag'])(Page)