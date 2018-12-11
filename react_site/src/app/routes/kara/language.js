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
import KaraCat from './_karaCat.js';

import languagesConverter from '@cospired/i18n-iso-languages';
languagesConverter.registerLocale(require("@cospired/i18n-iso-languages/langs/en.json"));
languagesConverter.registerLocale(require("@cospired/i18n-iso-languages/langs/fr.json"));

class RouteComponent extends Component {

	kara_languages_i18n() {
	let languages =  this.props.karas ? this.props.karas.languages.map((v,i) => {
		let t = languagesConverter.getName(v,this.props.currentLocale);
		if(t)
			return {key:v, value:t}
		return null;
	}) : [];
	return languages.filter(function(t,ti){ return t!==null; }).sort(function(a,b){ return a.value.localeCompare(b.value); });
}

	render() {
		return (
			<KaraCat page_icon={icons.language} page_title={i18next.t('kara.language_plural')} data={this.kara_languages_i18n()} data_type="language"/>
		);
	}
}

RouteComponent.handleSearchChange_delay = null;

const mapStateToProps = state => ({
  karas: state.karas.database,
  currentLocale: state.i18n.currentLocale
});

export default connect(
  mapStateToProps,
  null
)(RouteComponent);