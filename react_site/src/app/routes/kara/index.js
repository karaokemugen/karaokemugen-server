import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import Page from '../../components/page';
import {Layout, Table, Input, Tag, Button} from 'antd';
import i18next from 'i18next';
import normalizeString from '../../components/normalizeString';
import preg_quote from '../../components/preg_quote';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import icons from '../../components/km/icons';

import languagesConverter from '@cospired/i18n-iso-languages';
languagesConverter.registerLocale(require("@cospired/i18n-iso-languages/langs/en.json"));
languagesConverter.registerLocale(require("@cospired/i18n-iso-languages/langs/fr.json"));

class Karas extends Component {
	constructor(props){
		super(props);
		this.state = {
			karas_filtered: [],
			search_keywords: '',
			karas: props.karas,
			url_hash: null,
		}
	}

	componentWillUpdate(nextProps, nextState) {
		let prev = this.props.karas ? this.props.karas.hash:'';
		let next = nextProps.karas ? nextProps.karas.hash:'';
		let prev_url_param = JSON.stringify(this.props.match.params).split('').reduce((prevHash, currVal) => (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0);
		let next_url_param = JSON.stringify(nextProps.match.params).split('').reduce((prevHash, currVal) => (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0);

		if(prev!==next)
		{
			let newState = {
				karas: nextProps.karas,
				karas_filtered: this.filteredKaras(nextProps.karas.list) ,
				url_hash: next_url_param,
			};
			this.setState(newState);
		}

		if(prev_url_param!==next_url_param)
		{
			setTimeout(() => {
				let newState = {
					karas_filtered: this.filteredKaras(nextProps.karas.list) ,
				};
				this.setState(newState);
			},100);
		}
	}

	componentDidMount() {
		this.updateFilteredKaras();
	}

	//----------------------------------------------------------------------------------------------------------------

	tagRestriction() {
		return this.props.match.params && this.props.match.params.tag ? this.props.match.params.tag : null;
	}
	songtypeRestriction() {
		return this.props.match.params && this.props.match.params.songtype ? this.props.match.params.songtype : null;
	}
	singerRestriction() {
		return this.props.match.params && this.props.match.params.singer ? this.props.match.params.singer : null;
	}
	serieRestriction() {
		return this.props.match.params && this.props.match.params.serie ? this.props.match.params.serie : null;
	}
	authorRestriction() {
		return this.props.match.params && this.props.match.params.author ? this.props.match.params.author : null;
	}
	songwriterRestriction() {
		return this.props.match.params && this.props.match.params.songwriter ? this.props.match.params.songwriter : null;
	}
	creatorRestriction() {
		return this.props.match.params && this.props.match.params.creator ? this.props.match.params.creator : null;
	}
	languageRestriction() {
		return this.props.match.params && this.props.match.params.language ? this.props.match.params.language : null;
	}
	yearRestriction() {
		return this.props.match.params && this.props.match.params.year ? this.props.match.params.year : null;
	}

	//----------------------------------------------------------------------------------------------------------------

	kara_tags_i18n() {
		return this.state.karas ? this.state.karas.tags.map((v,i) => { return {text:i18next.t('map:'+v.replace('tag_','tag.')), value:v} }) : [];
	}
	kara_types_i18n() {
		return this.state.karas ? this.state.karas.types.map((v,i) => { return {text:i18next.t('map:'+v.replace('type_','type.')), value:v} }) : [];
	}
	kara_languages_i18n() {
		let languages =  this.state.karas ? this.state.karas.languages.map((v,i) => {
			let t = languagesConverter.getName(v,this.props.currentLocale);
			if(t)
				return {text:t, value:v}
			return null;
		}) : [];
		return languages.filter(function(t,ti){ return t!==null; }).sort(function(a,b){ return a.text.localeCompare(b.text); });
	}

	kara_years() {
		return (this.state.karas ? this.state.karas.years.map((v,i) => { return {text:v, value:v}}) : []).reverse();
	}

	//----------------------------------------------------------------------------------------------------------------

	filteredKaras(list) {

		let filtered = list
		let q = normalizeString(this.state.search_keywords);
		let tag = this.tagRestriction();
		let songtype = this.songtypeRestriction();
		let singer = this.singerRestriction();
		let serie = this.serieRestriction();
		let author = this.authorRestriction();
		let songwriter = this.songwriterRestriction();
		let creator = this.creatorRestriction();
		let language = this.languageRestriction();
		let year = this.yearRestriction();
		filtered = filtered.filter((kara,index) => {
			let keep = true;
			if(tag && keep) { keep = keep && kara.misc.toLowerCase().indexOf('tag_'+tag) >=0; }
			if(songtype && keep) { keep = keep && kara.songtype.toLowerCase().indexOf('type_'+songtype) >=0; }
			if(singer  && keep) { keep = keep && (" "+kara.singer_normalized+" ").match(new RegExp('[ ,]'+preg_quote(singer)+'[ ,]')); }
			if(serie  && keep) { keep = keep && (" "+kara.serie_normalized+" ").match(new RegExp('[ ,]'+preg_quote(serie)+'[ ,]')); }
			if(author  && keep) { keep = keep && (" "+kara.author_normalized+" ").match(new RegExp('[ ,]'+preg_quote(author)+'[ ,]')); }
			if(songwriter  && keep) { keep = keep && (" "+kara.songwriter_normalized+" ").match(new RegExp('[ ,]'+preg_quote(songwriter)+'[ ,]')); }
			if(creator  && keep) { keep = keep && (" "+kara.creator_normalized+" ").match(new RegExp('[ ,]'+preg_quote(creator)+'[ ,]')); }
			if(language  && keep) { keep = keep && (" "+kara.language+" ").match(new RegExp('[ ,]'+preg_quote(language)+'[ ,]')); }
			if(year  && keep) { keep = keep && parseInt(kara.year) === parseInt(year); }
			if(q.length>0 && keep)
			{
				let ok = false;
				ok = ok || (kara.serie && kara.serie_normalized.indexOf(q) >= 0);
				ok = ok || (kara.singer && kara.singer_normalized.indexOf(q) >= 0);
				ok = ok || (kara.title && kara.title_normalized.indexOf(q) >= 0);
				keep = keep && ok;
			}
			return keep;
		});
		return filtered;
	}

	updateFilteredKaras() {
		this.setState({karas_filtered:this.filteredKaras(this.state.karas ? this.state.karas.list:[])});
	}

	handleSearchChange(self,v,q) {
		//console.log(v.target.value);
		self.setState({ search_keywords : v.target.value });
		// delayed list update (avoir to many internal refresh)
		clearTimeout(self.handleSearchChange_delay);
		self.handleSearchChange_delay = setTimeout(self.updateFilteredKaras.bind(self),500);
	}

	renderComaSeparatedItems(items) {
	    if(items.length<=1)
	      return items;

	    let r = []
	    for(let i=0; i<items.length-1; i++)
	    {
	      r.push(items[i]);
	      r.push(<span key={"coma_"+i}>, </span>);
	    }
	    r.push(items[items.length-1]);
	    return r;
	  }

	render() {
		// TODO connecter le player live
		// media file => MP4 et pas de tag R18
		return (
			<Page id="karas">
				<div className="tagRestriction">
					{this.tagRestriction() ? <Link to="/kara"><Button icon="close" type="danger" size="large"><span>{i18next.t('kara.tag')+i18next.t('syntax.colon')}</span>&nbsp;<strong>{i18next.t('map:tag.'+this.tagRestriction())}</strong></Button></Link> : null }
					{this.songtypeRestriction() ? <Link to="/kara"><Button icon="close" type="danger" size="large"><span>{i18next.t('kara.songtype')+i18next.t('syntax.colon')}</span>&nbsp;<strong>{i18next.t('map:type.'+this.songtypeRestriction())}</strong></Button></Link> : null }
					{this.singerRestriction() ? <Link to="/kara"><Button icon="close" type="danger" size="large"><span>{i18next.t('kara.singer')+i18next.t('syntax.colon')}</span>&nbsp;<strong>{this.singerRestriction()}</strong></Button></Link> : null }
					{this.serieRestriction() ? <Link to="/kara"><Button icon="close" type="danger" size="large"><span>{i18next.t('kara.serie')+i18next.t('syntax.colon')}</span>&nbsp;<strong>{this.serieRestriction()}</strong></Button></Link> : null }
					{this.authorRestriction() ? <Link to="/kara"><Button icon="close" type="danger" size="large"><span>{i18next.t('kara.author')+i18next.t('syntax.colon')}</span>&nbsp;<strong>{this.authorRestriction()}</strong></Button></Link> : null }
					{this.songwriterRestriction() ? <Link to="/kara"><Button icon="close" type="danger" size="large"><span>{i18next.t('kara.songwriter')+i18next.t('syntax.colon')}</span>&nbsp;<strong>{this.songwriterRestriction()}</strong></Button></Link> : null }
					{this.creatorRestriction() ? <Link to="/kara"><Button icon="close" type="danger" size="large"><span>{i18next.t('kara.creator')+i18next.t('syntax.colon')}</span>&nbsp;<strong>{this.creatorRestriction()}</strong></Button></Link> : null }
					{this.languageRestriction() ? <Link to="/kara"><Button icon="close" type="danger" size="large"><span>{i18next.t('kara.language')+i18next.t('syntax.colon')}</span>&nbsp;<strong>{this.languageRestriction()}</strong></Button></Link> : null }
					{this.yearRestriction() ? <Link to="/kara"><Button icon="close" type="danger" size="large"><span>{i18next.t('kara.year')+i18next.t('syntax.colon')}</span>&nbsp;<strong>{this.yearRestriction()}</strong></Button></Link> : null }
				</div>
				<div className="searchBar">
					<Input.Search
						placeholder=""
						onChange={this.handleSearchChange.bind(null,this)}
						enterButton={i18next.t('btn.search')}
						onSearch={function(){}}
						/>
				</div>
				<div className="karasTable">
					<Table
						loading={this.state.karas_filtered.length===0 ? true:false}
						dataSource={this.state.karas_filtered}
						columns={this.columns()}
						rowKey='kara_id'
						theme="dark"
						pagination={{
							position:'top',
							defaultPageSize: 10,
							pageSizeOptions: ['10','25','50','100'],
							showTotal: (total, range) => {
								const to = range[1];
								const from = range[0];
								return `${from}-${to} / ${total}`;
							},
							//total: this.state.karas_filtered.length,
							showSizeChanger: true,
							//showQuickJumper: true,
						}}
					/>
				</div>
			</Page>
		);
	}

	columns(){
		var r = []

		r.push({
				title: i18next.t('kara.language'),
				dataIndex: 'language',
				key: 'language',
				render: language => {
					if(language.indexOf(',')>=0)
						return i18next.t('map:language.MUL');
						let t = languagesConverter.getName(language,this.props.currentLocale)
						return t ? t : i18next.t('map:language.UNKNOWN');
					},
				filters: this.kara_languages_i18n(),
				filterMultiple: true,
				onFilter: (value, record) => record.language.toLowerCase().indexOf(value) >= 0,
			})

		r.push({
				title: i18next.t('kara.serie')+'/'+i18next.t('kara.singer'),
				dataIndex: 'serie',
				key: 'serie',
				render: (serie, record) => {
					let singer = record.singer && record.singer!=='NO_TAG' ? record.singer : false;

					if(singer)
					{
						singer = this.renderComaSeparatedItems(record.singer.split(',').map(function(t,ti){
							return <Link key={ti} to={"/kara/singer/"+normalizeString(t)}>{t}</Link>;
						}))
					}

					if(serie && singer)
						return <span><Link to={"/kara/serie/"+normalizeString(serie)}>{serie}</Link><br /><small>{singer}</small></span>
					else if(serie)
						return <span><Link to={"/kara/serie/"+normalizeString(serie)}>{serie}</Link></span>
					else if(singer)
						return <span><small>{singer}</small></span>
					else
						return ;
				},
			})

		if(!this.songtypeRestriction())
			r.push({
					title: i18next.t('kara.songtype'),
					dataIndex: 'songtype',
					key: 'songtype',
					render: (type, record) => {
						let r = [];
						type.split(',').forEach( (t,ti) => {
							t = t.toLowerCase();
							r.push(<Link key={ti} to={"/kara/songtype/"+t.replace('type_','')}><Tag>{i18next.t('map:'+t.replace('type_','type.'))}</Tag></Link>)
						});
						if(record.songorder)
							r.push(<small key="songorder">{record.songorder}</small>);
						return r;
					},
					filters: this.kara_types_i18n(),
					filterMultiple: true,
					onFilter: (value, record) => record.songtype.toLowerCase().indexOf(value) >= 0,
				})

		r.push({
				title: i18next.t('kara.title'),
				dataIndex: 'title',
				key: 'title',
				render: (title, record) => ( <em><Link to={"/kara/"+record.kid}>{title}</Link></em> ),
				sorter: (a, b) => a.title_sort.localeCompare(b.title_sort),
				defaultSortOrder:'ascend', // [ascend|descend]
			})

		if(!this.tagRestriction())
			r.push({
					title: i18next.t('kara.tag'),
					dataIndex: 'misc',
					key: 'tag',
					render: tag => {
						let r = [];
						tag.split(',').forEach( (t,ti) => {
							t = t.toLowerCase();
							r.push(<Link key={ti} to={"/kara/tag/"+t.replace('tag_','')}><Tag>{i18next.t('map:'+t.replace('tag_','tag.'))}</Tag></Link>)
						});
						return r;
					},
					filters: this.kara_tags_i18n(),
					filterMultiple: true,
					onFilter: (value, record) => record.misc.toLowerCase().indexOf(value) >= 0,
				})

		if(!this.yearRestriction())
			r.push({
					title: i18next.t('kara.year'),
					dataIndex: 'year',
					key: 'year',
					render: (year) => ( <Link to={"/kara/year/"+year}>{year}</Link> ),
					sorter: (a, b) => a.year - b.year,
					filters: this.kara_years(),
					filterMultiple: true,
					onFilter: (value, record) => record.year == value,
				})

		/*
		r.push({
				title: 'ID',
				dataIndex: 'kara_id',
				key: 'kara_id',
				sorter: (a, b) => a.kara_id - b.kara_id,
				defaultSortOrder:'descend',
			})
			*/

		return r;
	}
}

Karas.handleSearchChange_delay = null;

const mapStateToProps = state => ({
  karas: state.karas.database,
  currentLocale: state.i18n.currentLocale
});

export default connect(
  mapStateToProps,
  null
)(Karas);