import React, {Component} from 'react';
import {connect} from 'react-redux';
import {push} from 'react-router-redux';
import {Menu} from 'antd';

class KMMenu extends Component {

	state = {
		current: '',
		connectOpenKeys: []
	};

	handleClick = (e) => {
		this.setState({
			current: e.key,
		});
	};

	render() {
		return (
			<div style={{display: 'flex', justifyContent: 'space-between'}}>
				<div>
					<Menu
						mode='horizontal'
						theme='dark'
						style={{ lineHeight: '56px' }}
					>
						<Menu.Item key='Kara Import'><a href='/karaimport'>Kara Import</a></Menu.Item>
						<Menu.Item key='Kara Base'><a href='http://kara.moe/base/'>Kara Base</a></Menu.Item>
					</Menu>
				</div>
			</div>
		);
	}
}

const mapDispatchToProps = (dispatch) => ({
	push: (url) => dispatch(push(url))
});

export default connect(null, mapDispatchToProps)(KMMenu);
