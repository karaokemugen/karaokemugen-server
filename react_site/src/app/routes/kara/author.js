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

class RouteComponent extends Component {
	render() {
		return (
			<KaraCat page_icon={icons.author} page_title={i18next.t('kara.author_plural')} data={this.props.karas.authors_count} data_type="author"/>
		);
	}
}

RouteComponent.handleSearchChange_delay = null;

const mapStateToProps = state => ({
  karas: state.karas.database
});

export default connect(
  mapStateToProps,
  null
)(RouteComponent);