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
		let pageSize = 50;
		let page = filterTools.getPage()
		let keywords = this.state.searchKeywords;

		let serieList = [];
		for (let id in this.props.series) {
			let serie = this.props.series[id];
			kmax = Math.max(kmax,serie.karacount);
			if(keywords.length==0 || filterTools.keywordSearch(serie.name,keywords))
				serieList.push(serie);
		}
		let total = serieList.length

		serieList.sort(function(a,b){
			return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
		})

		serieList = serieList.slice(page*pageSize,page*pageSize+pageSize);

		serieList = serieList.map(function(serie){
			return {
				key: serie.sid,
				name : serie.name,
				karacount : serie.karacount,
				link : "/?"+querystring.stringify(filterTools.clear().addTag('serie',serie.sid).getQuery()),
				height : 100 * serie.karacount / kmax
			};
		})

		return (
			<div>
				<Head>
					<title key="title">{i18n.t('sitename')} - {i18n.t('category.series')}</title>
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
					renderUrl={(i) => { return "/series?"+querystring.stringify(filterTools.reset().setPage(i).getQuery()); }}
					/>

				<DedicatedTagtList type="series" tags={serieList} />
			</div>
			)
	}
}

export default withNamespaces(['common','tag'])(Page)