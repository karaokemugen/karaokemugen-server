import React from 'react'
import { i18n, withNamespaces } from '../i18n'
import Head from 'next/head'
import duration from '../components/date';
import prettyBytes from 'pretty-bytes';
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

				<div className="km-home">
					<a href="http://karaokes.moe/"><img className="km-home--logo" src={require('../static/images/km-logo.png')} /></a>

					<ul className="km-home--stats">
						<li key="karas"><strong>{count.karas>0 ? count.karas : '-'}</strong> <span>{i18n.t("category.karas")}</span></li>
						<li key="serie"><strong>{count.serie>0 ? count.serie : '-'}</strong> <span>{i18n.t("category.series")}</span></li>
						<li key="singer"><strong>{count.singer>0 ? count.singer : '-'}</strong> <span>{i18n.t("category.singers")}</span></li>
						<li key="creator"><strong>{count.creator>0 ? count.creator : '-'}</strong> <span>{i18n.t("category.creators")}</span></li>
						<li key="language"><strong>{count.language>0 ? count.language : '-'}</strong> <span>{i18n.t("category.languages")}</span></li>
						<li key="author"><strong>{count.author>0 ? count.author : '-'}</strong> <span>{i18n.t("category.authors")}</span></li>
						<li key="songwriter"><strong>{count.songwriter>0 ? count.songwriter : '-'}</strong> <span>{i18n.t("category.songwriters")}</span></li>
						<li key="mediasize"><span>{i18n.t("stats.media_size")}</span> : <strong>{count.mediasize>0 ? prettyBytes(Number(count.mediasize)) : '-'}</strong></li>
						<li className="km-home--stats--wide" key="lastGeneration"><span>{i18n.t("stats.last_generation")}</span> : <strong>{count.duration>0 ? new Date(count.lastGeneration).toLocaleString() : '-'}</strong></li>
						<li className="km-home--stats--wide" key="duration"><span>{i18n.t("stats.all_duration")} :</span> <strong>{count.duration>0 ? duration(count.duration) : '-'}</strong></li>
					</ul>
				</div>
			</div>
		);
	}
}

export default withNamespaces(['common','tag'])(Page)