import React, {Component} from 'react';

import {Provider} from 'react-redux';
import {ConnectedRouter} from 'react-router-redux';
import {Redirect, Route, Switch} from 'react-router-dom';
import {Layout} from 'antd';
import {history, store} from './store';

import KMHeader from './layout/KMHeader';

import KaraForm from './pages/KaraForm';

import './App.css';

class App extends Component {

	render() {
		return (
			<Provider store={store}>
				<ConnectedRouter history={history}>
					<Layout className="layout">
						<KMHeader/>
						<Switch>
							<Redirect exact from='/' to='/karaimport'/>
							<Route path='/karaimport' component={KaraForm}/>
						</Switch>
					</Layout>
				</ConnectedRouter>
			</Provider>
		);
	}
}

export default App;
