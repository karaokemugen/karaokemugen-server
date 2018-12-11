import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import Page from '../../components/page';
import logo from '../../assets/logo.png';
import i18next from 'i18next';

class Karas extends Component {

	render() {
		console.log(this.props);
		if(this.props.karas && this.props.karas.count>0)
		{
			let karas = this.props.karas;

			let minYear = 999999
			let maxYear = 0;
			karas.years.forEach(function(t,ti){
				minYear = Math.min(t,minYear)
				maxYear = Math.max(t,maxYear)
			})

			let days = Math.floor(karas.duration / (3600*24));
			let hours = Math.floor((karas.duration - days*(3600*24)) / (3600));
			let minutes = Math.floor((karas.duration - days*(3600*24) - hours*(3600)) / 60);
			let seconds = (karas.duration - days*(3600*24) - hours*(3600) - minutes*(60));
			let duration = i18next.t("stats.{{days}}d{{hours}}h{{minutes}}m{{seconds}}s",{
				days:days,
				hours:hours,
				minutes:minutes,
				seconds:seconds,
			});
			let colonChar = i18next.t("syntax.colon")
			return (
				<Page id="homepage">
					<p><img src={logo} alt="Homepage" style={{ width: '400px' }} /></p>
					<dl className="stats">
						<dt>STATISTIQUES</dt>
						<dd key="update_time"><span>{i18next.t("stats.karasUpdateTime")+colonChar}</span> <strong>{karas.update_time}</strong></dd>
						<dd key="karas"><span>{i18next.t("stats.karasCount")+colonChar}</span> <Link to="/kara">{karas.count}</Link></dd>
						<dd key="singers"><span>{i18next.t("stats.singersCount")+colonChar}</span> <Link to="/kara/singer">{karas.singers.length}</Link></dd>
						<dd key="languages"><span>{i18next.t("stats.languagesCount")+colonChar}</span> <Link to="/kara/language">{karas.languages.length}</Link></dd>
						<dd key="songwriters"><span>{i18next.t("stats.songwritersCount")}:</span> <Link to="/kara/songwriter">{karas.songwriters.length}</Link></dd>
						<dd key="authors"><span>{i18next.t("stats.authorsCount")+colonChar}</span> <Link to="/kara/author">{karas.authors.length}</Link></dd>
						<dd key="creators"><span>{i18next.t("stats.creatorsCount")+colonChar}</span> <Link to="/kara/creator">{karas.creators.length}</Link></dd>
						<dd key="series"><span>{i18next.t("stats.seriesCount")+colonChar}</span> <Link to="/kara/serie">{karas.series.length}</Link></dd>
						<dd key="years"><strong>{i18next.t("stats.karasFrom{{minYear}}to{{maxYear}}",{minYear:minYear,maxYear:maxYear})}</strong></dd>
						<dd key="size"><span>{i18next.t("stats.size")+colonChar}</span> <strong>{Math.round(karas.size/(1024*1024*1024))} Go</strong></dd>
						<dd key="duration"><span>{i18next.t("stats.duration")+colonChar}</span> <strong>{duration}</strong></dd>
					</dl>
				</Page>
			);
		}
		return null;
	}
}

Karas.handleSearchChange_delay = null;

const mapStateToProps = state => ({ karas: state.karas.database });

export default connect(
  mapStateToProps,
  null
)(Karas);