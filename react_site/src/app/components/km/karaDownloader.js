import React, { Component } from 'react';

import localForage from "localforage";
import axios from 'axios';
import i18next from 'i18next';
import normalizeString from '../normalizeString';

localForage.config({
    name        : 'KaraokeMugenServer-Karas',
    description : 'Karas database cache'
});

const required_version = 1.7;

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
    if(list.indexOf(t)<0 && t!=='no_tag' && t!=='tag_space')
      list.push(t);
  }
  return list;
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
		if(this.state.check_ls===null)
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
					var official_update_response = await axios.get('http://kara.moe/api/karas/lastUpdate')
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
				axios.get('http://kara.moe/api/karas',{
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
						hash: JSON.stringify(karas_raw).split('').reduce((prevHash, currVal) => (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0),
						list: karas_raw,
						tags: [],
						types: [],
						languages: [],
						singers: [],
						songwriters: [],
						authors: [],
						creators: [],
						series: [],
						years: [],
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
		let loopSize = 500; // batch size
		let count = karas.count + 0;
		for(let ki = karas.count; ki < Math.min(karas.count + loopSize, karas.list.length); ki++)
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

			karas.tags = _compileMultiple(karas.tags,kara.misc,true);
			karas.types = _compileMultiple(karas.types,kara.songtype,true);
			karas.languages = _compileMultiple(karas.languages,kara.language,true);
			karas.singers = _compileMultiple(karas.singers,kara.singer,false);
			karas.songwriters = _compileMultiple(karas.songwriters,kara.songwriter,false);
			karas.authors = _compileMultiple(karas.authors,kara.author,false);
			karas.creators = _compileMultiple(karas.creators,kara.creator,false);
			karas.series = _compileSingle(karas.series,kara.serie,false);
			karas.years = _compileSingle(karas.years,kara.year,false);

			karas.duration += kara.duration;
			karas.size += kara.mediasize;

			count++;
		}
		karas.count  = count;

		if(karas.count >= karas.list.length)
		{
			console.log(karas.list.length, karas.count);
			// final sort
			// tri sur les titre des karas
			// karas_raw = karas_raw.sort(function(a,b){ return a.title_sort.localeCompare(b.title_sort); })
			// tri sur les ID
			//karas.list = karas.list.sort(function(a,b){ return b.kara_id - a.kara_id; })
			karas.list = karas.list.sort(function(a,b){ return Date.parse(b.created_at) - Date.parse(a.created_at); })

			karas.tags = karas.tags.sort(function(a,b){ return a.localeCompare(b); })
			karas.types = karas.types.sort(function(a,b){ return a.localeCompare(b); })
			karas.languages = karas.languages.sort(function(a,b){ return a.localeCompare(b); })
			karas.singers = karas.singers.sort(function(a,b){ return a.localeCompare(b); })
			karas.songwriters = karas.songwriters.sort(function(a,b){ return a.localeCompare(b); })
			karas.authors = karas.authors.sort(function(a,b){ return a.localeCompare(b); })
			karas.creators = karas.creators.sort(function(a,b){ return a.localeCompare(b); })
			karas.series = karas.series.sort(function(a,b){ return a.localeCompare(b); })
			karas.years = karas.years.sort(function(a,b){ return a - b; })

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
			let percentCompleted = Math.floor((karas.count * 100) / karas.list.length);
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

/*
console.info('establishKaras :: Start');
   new Promise(async (resolve) => {
    var required_version = 1.61;
    var db_version = await localForage.getItem('db_version');
    var force_update = (!db_version || db_version < required_version)

    var karas_updated_at = await localForage.getItem('karas_updated_at');
    var karas_raw = false;
    var karas = false;

    dispatch(setProgress('initializing'));

    var official_update_response = await axios.get('http://kara.moe/api/karas/lastUpdate')
    var official_update_time = Date.parse(official_update_response.data)

    if(!official_update_time)
      official_update_time = (new Date()).getTime() - 3600*1000*24;

    if(!force_update && karas_updated_at > official_update_time)
    {
      console.info('establishKaras :: Local storage seems up to date');
      karas = await localForage.getItem('karas')
      if(!karas)
      {
        console.info('establishKaras :: Local storage error, fall back on API');
      }
    }
    if(force_update || !karas)
    {
      console.info('establishKaras :: Retrieve from API');
      dispatch(setProgress('loading'));
      karas_raw = await loadKaras()
      dispatch(setProgress('compiling'));
      karas = await compileData(karas_raw)
    }
    if(karas)
    {
      console.info('establishKaras :: Karas are now available');
      localForage.setItem('db_version',required_version);
      dispatch(setKaras(karas));
      //resolve(karas);
    }
    else
    {
      console.info('establishKaras :: Unable to retrieve karas from API');
      dispatch(setKaras(karas));
      //resolve({});
    }
  });
*/