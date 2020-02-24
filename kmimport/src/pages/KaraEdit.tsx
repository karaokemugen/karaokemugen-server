import React, {Component} from 'react';
import {Layout, Modal} from 'antd';
import KaraForm from './KaraForm';
import axios from 'axios/index';
import i18next from 'i18next';
import { getApiUrl } from '../utils/kara';

class KaraEdit extends Component {

	state = {
		kara: null,
		save: () => {}
	};

	componentDidMount() {
		this.loadKara();
	}

	saveNew = (kara) => {
		axios.post(`${getApiUrl()}/api/karas/`, kara)
			.then(response => {
				Modal.success({
					title: i18next.t('ADD_SUCCESS'),
					content: <div><label>{i18next.t('ADD_SUCCESS_DESCRIPTION')}</label><a href={response.data}>{response.data}</a></div>,
				});			})
			.catch(error => {
				Modal.error({
					title: i18next.t('ADD_ERROR'),
					content: error.response.data,
				});
			});
	};

	saveUpdate = (kara) => {
		axios.put(`${getApiUrl()}/api/karas/${kara.kid}`, kara)
		.then(response => {
			Modal.success({
				title: i18next.t('ADD_SUCCESS'),
				content: <div><label>{i18next.t('ADD_SUCCESS_DESCRIPTION')}</label><a href={response.data}>{response.data}</a></div>,
			});
		})
		.catch(error => {
			Modal.error({
				title: i18next.t('ADD_ERROR'),
				content: error.response.data,
			});
		});
	};

	loadKara = () => {
		let url = window.location.pathname.split("/");
		let kid = url[url.length-1];
		if (kid !== '') {
			axios.get(`${getApiUrl()}/api/karas/${kid}`)
				.then(res => {
					var kara = res.data;
					this.setState({kara: kara, save: this.saveUpdate});
				})
				.catch(error => {
					Modal.error({
						title: i18next.t('LOAD_ERROR'),
						content: error.response.data,
					});
				});
		} else {
			this.setState({kara: {}, save: this.saveNew});
		}
	};
	

	render() {
		return (
			<Layout.Content style={{padding: '25px 50px'}}>
				{this.state.kara && (<KaraForm kara={this.state.kara} save={this.state.save} />)}
			</Layout.Content>
		);
	}
}

export default KaraEdit;