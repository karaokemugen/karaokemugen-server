import React from 'react'
import { i18n, withTranslation } from '../i18n'
import Head from 'next/head'
import duration from '../components/date';
import prettyBytes from 'pretty-bytes';
import i18nRouterPush from '../utils/i18nRouterPush'
import FilterTools from '../utils/filterTools';
import Link from '../utils/I18nLink';
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
	
	refreshList(event) {
		event.preventDefault()
		event.stopPropagation()
		let q = filterTools.reset().getQuery()
		i18nRouterPush(q.path, q.query)
	  }
	
	  updateKeyword(event) {
		// local state update of the search input field
		filterTools.reset().setKeywords(event.target.value).save();
	  }

	render() {

		var count = {
			singer:0,
			creator:0,
			language:0,
			author:0,
			songwriter:0,
			serie:0,
			karas:0,
			duration:0,
			mediasize:0
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
			count.mediasize = this.props.stats.mediasize;
		}

		return (
			<div>
				<Head>
					<title key="title">{i18n.t('sitename')} - {i18n.t('category.home')}</title>
				</Head>

				<div className="kmx-filter-keyword">
					<form onSubmit={(event) => this.refreshList(event)}>
						<input type="text" onChange={(event) => this.updateKeyword(event)} placeholder={i18n.t('form.karas_keywords_placeholder')} />
						<button type="submit"><i className="fa fa-search"></i></button>
					</form>
				</div>

				<div className="km-home">
					<a href="http://karaokes.moe/"><img className="km-home--logo" src={require('../static/images/km-logo.png')} /></a>

					<ul className="km-home--stats">
						<li key="karas"><Link href={ "/karas?"}><div className="km-home--stats--link">
							<strong>{count.karas>0 ? count.karas : '-'}</strong> <span>{i18n.t("category.karas")}</span>
						</div></Link></li>
						<li key="serie"><Link href={ "/series?"}><div className="km-home--stats--link">
							<strong>{count.serie>0 ? count.serie : '-'}</strong> <span>{i18n.t("category.series")}</span>
						</div></Link></li>
						<li key="singer"><Link href={ "/singers?"}><div className="km-home--stats--link">
							<strong>{count.singer>0 ? count.singer : '-'}</strong> <span>{i18n.t("category.singers")}</span>
						</div></Link></li>
						<li key="creator"><Link href={ "/creators?"}><div className="km-home--stats--link">
							<strong>{count.creator>0 ? count.creator : '-'}</strong> <span>{i18n.t("category.creators")}</span>
						</div></Link></li>
						<li key="language"><Link href={ "/languages?"}><div className="km-home--stats--link">
							<strong>{count.language>0 ? count.language : '-'}</strong> <span>{i18n.t("category.languages")}</span>
						</div></Link></li>
						<li key="author"><Link href={ "/authors?"}><div className="km-home--stats--link">
							<strong>{count.author>0 ? count.author : '-'}</strong> <span>{i18n.t("category.authors")}</span>
						</div></Link></li>
						<li key="songwriter"><Link href={ "/songwriters?"}><div className="km-home--stats--link">
							<strong>{count.songwriter>0 ? count.songwriter : '-'}</strong> <span>{i18n.t("category.songwriters")}</span>
						</div></Link></li>
						<li key="mediasize"><span>{i18n.t("stats.media_size")}</span> : <strong>{count.mediasize>0 ? prettyBytes(Number(count.mediasize)) : '-'}</strong></li>
						<li className="km-home--stats--wide" key="lastGeneration"><span>{i18n.t("stats.last_generation")}</span> : <strong>{count.duration>0 ? new Date(count.lastGeneration).toLocaleString() : '-'}</strong></li>
						<li className="km-home--stats--wide" key="duration"><span>{i18n.t("stats.all_duration")} :</span> <strong>{count.duration>0 ? duration(count.duration) : '-'}</strong></li>
					</ul>
				</div>
			</div>
		);
	}
}

export default withTranslation(['common','tag'])(Page)