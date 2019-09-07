import React, {Component} from 'react';
import {Layout, Modal} from 'antd';
import KaraForm from './KaraForm';
import axios from 'axios/index';
import i18next from 'i18next';

const newKara = {
	kid: null,
	songorder: null,
	songtypes: null,
	serie: null,
	title: null,
	langs: null,
	singers: null,
	songwriters: null,
	year: null,
	creators: null,
	authors: null,
	misc: null,
	groups: null,
	created_at: null,
	families: null,
	platforms: null,
	genres: null,
	origins: null
};

class KaraEdit extends Component {

	state = {
		kara: null,
		save: () => {}
	};

	componentDidMount() {
		this.loadKara();
	}

	saveNew = (kara) => {
		axios.post('/api/karas/', kara)
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
		axios.put(`/api/karas/${kara.kid}`, kara)
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
			axios.get(`/api/karas/${kid}`)
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
			this.setState({kara: {...newKara}, save: this.saveNew});
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