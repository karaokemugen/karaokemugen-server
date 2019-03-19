import React from 'react';
import { i18n, withNamespaces } from '../i18n'
import PropTypes from 'prop-types';

class Page extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			seriesRequired: true,
			overwrite: false,
			subfileList: [],
			mediafileList: [],
			singers: [],
			authors: [],
			tags: ['TAG_ANIME', 'TAG_TVSHOW'],
			series: [],
			creators: [],
			songwriters: [],
			groups: [],
			songtype: 'OP',
			langs: ['jpn']
		};
	}

	componentDidMount() {
		//this.props.form.validateFields();
	}

	handleSubmit = (e) => {
		e.preventDefault();
		this.props.form.validateFields((err, values) => {
			if (!err) this.props.save(values);
		});
	};

	render() {

		return (
			<form
				onSubmit={this.handleSubmit}
				className='kara-form'>
			
				<input 
					label={(
						<span>Song title&nbsp;
						</span>
					)}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 8, offset: 0 }}
				>
				</input>
					<button type='primary' htmlType='submit' className='login-form-button'>
						Save and generate .kara file
					</button>
			</form>
		);
	}
}

Page.propTypes = {
	kara: PropTypes.object.isRequired,
	save: PropTypes.func.isRequired
};

export default withNamespaces(['common','tag'])(Page)