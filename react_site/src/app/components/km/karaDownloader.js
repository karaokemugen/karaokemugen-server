import React, { Component } from 'react';

import localForage from "localforage";
import axios from 'axios';
import i18next from 'i18next';
import normalizeString from '../normalizeString';

localForage.config({
    name        : 'KaraokeMugenServer-Karas',
    description : 'Karas database cache'
});

const required_version = 1.71;

const print3State = function(v)
{
	if(v===null)
		return <span className="status-pending">{i18next.t("karadownloader:status.pending")}</span>;
	else if(v)
		return <span className="status-success">{i18next.t("karadownloader:status.success")}</span>;
	else
		return <span className="status-fail">{i18next.t("karadownloader:status.fail")}</span>;
}

const _compileMultiple = function(list,string,lowercase = false)
{
  string.split(',').forEach(function(t, ti) {
    list = _compileSingle(list,t,lowercase)
  });
  return list;
}

const _compileSingle = function(list,t,lowercase = false)
{
	if(t)
	{
		if(typeof t =='string')
		{
			t = t.trim();
			if(lowercase)
			t = t.toLowerCase();
		}
		if(t!=='no_tag' && t!=='tag_space')
		{
			if(typeof list[t] != "undefined")
			{
				list[t].q++;
			}
			else
			{
				list[t] = {
					key:normalizeString(t),
					value:t,
					q:1
				}
			}
		}
	}
	return list;
}

const _extractValueArray = function(countList)
{
	var r = [];
	for(let k in countList)
	{
		r.push(countList[k].value);
	}
	return r;
}
const _extractObjectArray = function(countList)
{
	var r = [];
	for(let k in countList)
	{
		r.push(countList[k]);
	}
	return r;
}

class KaraDownloader extends Component {
	constructor(props){
		super(props);
		this.state = {
			check_ls:null, // test du localstorage
			check_ls_version:null, // test de la version
			check_ls_update:null, // test de la version dispo
			retrieve_needed:null,
			retrieve_download:null,
			retrieve_build:null,
			karas_raw: null,
			karas: null,
			karas_update_time: null,
			instance_url: null,
		}
		this.bubbleKaras = this.bubbleKaras.bind(this);
	}

	bubbleKaras(karas) {
		if(this.props.onKaraReady && typeof this.props.onKaraReady === 'function')
		{
			this.props.onKaraReady(karas);
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if(this.state.instance_url===null)
		{
			var instance_path = window.location.protocol+'//'+window.location.hostname+(window.location.port ? ':'+window.location.port: '');
			axios.get(instance_path+'/api/karas/lastUpdate')
				.then(response => {
					this.setState({instance_url:instance_path});
				})
				.catch(()=>{
					this.setState({instance_url:'https://kara.moe'});
				})
		}
		else if(this.state.check_ls===null)
		{
			if(this.state.check_ls_version===null)
			{
				localForage.getItem('db_version').then(db_version => {
					setTimeout(() => {
						this.setState({check_ls_version: db_version >= required_version});
					},250);
				});
			}
			else if(this.state.check_ls_version!==null && this.state.check_ls_update===null)
			{
				localForage.getItem('karas_updated_at').then(async karas_updated_at => {
					var official_update_response = await axios.get(this.state.instance_url+'/api/karas/lastUpdate')
					var official_update_time = Date.parse(official_update_response.data)
					if(!official_update_time)
						official_update_time = (new Date()).getTime() - 3600*1000*24;

					setTimeout(() => {
						this.setState({
							karas_update_time: official_update_time,
							check_ls_update: karas_updated_at > official_update_time
						});
					},250);
				});
			}
			else
			{
				setTimeout(() => {
					this.setState({check_ls: this.state.check_ls_version && this.state.check_ls_update});
				},250);
			}
		}
		else if(this.state.check_ls===true && this.state.retrieve_needed===null )
		{
			this.setState({retrieve_needed: false});
			localForage.getItem('karas').then((karas) => {
				setTimeout(()=>{
					this.bubbleKaras(karas);
				},250)
			})
		}
		else if(this.state.check_ls===false && this.state.retrieve_needed===null )
		{
			this.setState({retrieve_needed: true});
		}
		else if(this.state.retrieve_needed===true)
		{
			if(this.state.retrieve_download===null)
			{
				// starting download database from api

				this.setState({retrieve_download: 0});
				axios.get(this.state.instance_url+'/api/karas',{
					onDownloadProgress: progressEvent => {
						let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
						this.setState({ retrieve_download: percentCompleted });
					}
				}).then(response =>{
					setTimeout(() => {
						this.setState({ karas_raw: response.data.content });
					},250);
				});
			}
			else if(this.state.retrieve_download===100 && this.state.karas_raw!==null && this.state.retrieve_build===null)
			{
				// starting building database from raw data
				if(this.state.karas_raw.length>0)
				{
					let karas_raw = this.state.karas_raw;
					let karas = {
						update_time:this.state.karas_update_time,
						instance_url:this.state.instance_url,
						hash: JSON.stringify(karas_raw).split('').reduce((prevHash, currVal) => (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0),
						list: karas_raw,
						tags: [],
						tags_count: {},
						types: [],
						types_count: {},
						languages: [],
						languages_count: {},
						singers: [],
						singers_count: {},
						songwriters: [],
						songwriters_count: {},
						authors: [],
						authors_count: {},
						creators: [],
						creators_count: {},
						series: [],
						series_count: {},
						years: [],
						years_count: {},
						size: 0,
						duration: 0,
						count: 0,
					};
					this.setState({ retrieve_build: 0 });
					setTimeout(() => {
						this.compileKaras(karas); // recursive procedure
					},250);
				}
				else
				{
					// Fail to load database
					this.setState({ karas: false });
				}
			}
		}
	}

	compileKaras(karas) {
		let loopSize = 1000; // batch size
		let count = karas.count + 0;
		let EndLoop = karas.list.length
		for(let ki = karas.count; ki < Math.min(karas.count + loopSize, EndLoop); ki++)
		{
			let kara = karas.list[ki];
			let t = null;

			karas.list[ki].title_normalized = normalizeString(kara.title,false);
			karas.list[ki].title_sort = karas.list[ki].title_normalized.replace(/[^a-z0-9]/g,'');
			karas.list[ki].serie_normalized = normalizeString(kara.serie,false);
			karas.list[ki].singer_normalized = normalizeString(kara.singer,true);
			karas.list[ki].author_normalized = normalizeString(kara.author,true);
			karas.list[ki].songwriter_normalized = normalizeString(kara.songwriter,true);
			karas.list[ki].creator_normalized = normalizeString(kara.creator,true);

			karas.tags_count = _compileMultiple(karas.tags_count,kara.misc,true);
			karas.types_count = _compileMultiple(karas.types_count,kara.songtype,true);
			karas.languages_count = _compileMultiple(karas.languages_count,kara.language,true);
			karas.singers_count = _compileMultiple(karas.singers_count,kara.singer,false);
			karas.songwriters_count = _compileMultiple(karas.songwriters_count,kara.songwriter,false);
			karas.authors_count = _compileMultiple(karas.authors_count,kara.author,false);
			karas.creators_count = _compileMultiple(karas.creators_count,kara.creator,false);
			karas.series_count = _compileSingle(karas.series_count,kara.serie,false);
			karas.years_count = _compileSingle(karas.years_count,kara.year,false);

			karas.duration += kara.duration;
			karas.size += kara.mediasize;

			count++;
		}
		karas.count  = count;

		if(karas.count >= EndLoop)
		{
			console.log(EndLoop, karas.count);
			// final sort
			// tri sur les titre des karas
			// karas_raw = karas_raw.sort(function(a,b){ return a.title_sort.localeCompare(b.title_sort); })
			// tri sur les ID
			//karas.list = karas.list.sort(function(a,b){ return b.kara_id - a.kara_id; })
			karas.list = karas.list.sort(function(a,b){ return Date.parse(b.created_at) - Date.parse(a.created_at); })

			karas.tags = _extractValueArray(karas.tags_count);
			karas.tags_count = _extractObjectArray(karas.tags_count);

			karas.types = _extractValueArray(karas.types_count);
			karas.types_count = _extractObjectArray(karas.types_count);

			karas.languages = _extractValueArray(karas.languages_count);
			karas.languages_count = _extractObjectArray(karas.languages_count);

			karas.singers = _extractValueArray(karas.singers_count);
			karas.singers_count = _extractObjectArray(karas.singers_count);

			karas.songwriters = _extractValueArray(karas.songwriters_count);
			karas.songwriters_count = _extractObjectArray(karas.songwriters_count);

			karas.authors = _extractValueArray(karas.authors_count);
			karas.authors_count = _extractObjectArray(karas.authors_count);

			karas.creators = _extractValueArray(karas.creators_count);
			karas.creators_count = _extractObjectArray(karas.creators_count);

			karas.series = _extractValueArray(karas.series_count);
			karas.series_count = _extractObjectArray(karas.series_count);

			karas.years = _extractValueArray(karas.years_count);
			karas.years_count = _extractObjectArray(karas.years_count);

			karas.tags = karas.tags.sort(function(a,b){ return a.localeCompare(b); })
			karas.types = karas.types.sort(function(a,b){ return a.localeCompare(b); })
			karas.languages = karas.languages.sort(function(a,b){ return a.localeCompare(b); })
			karas.singers = karas.singers.sort(function(a,b){ return a.localeCompare(b); })
			karas.songwriters = karas.songwriters.sort(function(a,b){ return a.localeCompare(b); })
			karas.authors = karas.authors.sort(function(a,b){ return a.localeCompare(b); })
			karas.creators = karas.creators.sort(function(a,b){ return a.localeCompare(b); })
			karas.series = karas.series.sort(function(a,b){ return a.localeCompare(b); })
			karas.years = karas.years.sort(function(a,b){ return a - b; })

			karas.tags_count = karas.tags_count.sort(function(a,b){ return a.key.localeCompare(b.key); })
			karas.types_count = karas.types_count.sort(function(a,b){ return a.key.localeCompare(b.key); })
			karas.languages_count = karas.languages_count.sort(function(a,b){ return a.key.localeCompare(b.key); })
			karas.singers_count = karas.singers_count.sort(function(a,b){ return  - (a.q - b.q) })
			karas.songwriters_count = karas.songwriters_count.sort(function(a,b){ return  - (a.q - b.q) })
			karas.authors_count = karas.authors_count.sort(function(a,b){ return  - (a.q - b.q) })
			karas.creators_count = karas.creators_count.sort(function(a,b){ return  - (a.q - b.q) })
			karas.series_count = karas.series_count.sort(function(a,b){ return - (a.q - b.q) })
			karas.years_count = karas.years_count.sort(function(a,b){ return a.key - b.key; })

			this.setState({ retrieve_build: 100 });

			setTimeout(()=>{
				this.bubbleKaras(karas);
			},250)

			// update LocalStorage
			localForage.setItem('karas', karas)
			localForage.setItem('karas_updated_at',(new Date()).getTime());
			localForage.setItem('db_version',required_version);
		}
		else
		{
			let percentCompleted = Math.floor((karas.count * 100) / EndLoop);
			this.setState({ retrieve_build: percentCompleted });
			setTimeout(() => {
				this.compileKaras(karas);
			},100);
		}
	}

	componentDidMount() {

	}

	render() {
		return (
			<div id="karaDatabaseDownloader">
				<div className="loader">
					<div className="inner rotate-one"></div>
					<div className="inner rotate-two"></div>
					<div className="inner rotate-three"></div>
				</div>
				<div className="check_log">
					<dl key="check_ls">
						<dd key="check_ls_version">{i18next.t("karadownloader:progress.check_ls_version")} {print3State(this.state.check_ls_version)}</dd>
						<dd key="check_ls_update">{i18next.t("karadownloader:progress.check_ls_update")} {print3State(this.state.check_ls_update)}</dd>
						<dd key="check_ls_result">{this.state.check_ls===null ? '-' : (this.state.check_ls ? i18next.t("karadownloader:progress.check_ls_ok") : i18next.t("karadownloader:progress.check_ls_fail"))}</dd>
					</dl>
					{
						this.state.retrieve_needed
						? (
							<dl key="retrieve">
								<dt key="retrieve_needed">{i18next.t("karadownloader:progress.retrieve_needed")}</dt>
								<dd key="retrieve_download">{i18next.t("karadownloader:progress.download_in_progress")} <span className="status-progress" data-value={this.state.retrieve_download}>{this.state.retrieve_download+"%"}</span></dd>
								{
									this.state.retrieve_build!==null
										? (<dd key="retrieve_building">{i18next.t("karadownloader:progress.building_in_progress")} <span className="status-progress" data-value={this.state.retrieve_build}>{this.state.retrieve_build+"%"}</span></dd>)
										:null
								}
							</dl>
						)
						: null
					}
				</div>
			</div>
		)
	}
}

export default KaraDownloader