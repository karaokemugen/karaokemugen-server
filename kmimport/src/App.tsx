import React, { Suspense, Component } from 'react';
import {Layout, Menu} from 'antd';
import i18next from 'i18next';
import './App.css';
import KaraEdit from './pages/KaraEdit';

const Loader = () => (
	<div>loading...</div>
);

class MyApp extends Component {

	render() {    
		return (
			<div className="import-kara">
				<Layout.Header style={{height: '48px'}}>
					<Menu
						theme="dark"
						mode="horizontal"
					>
						<Menu.Item><a href="/base">{i18next.t('HOME')}</a></Menu.Item>
						<Menu.Item className='lang-label' disabled>{<label>{i18next.t('LANG')}</label>}</Menu.Item>
						<Menu.Item key="lng-en" onClick={() => i18next.changeLanguage('en', () => this.forceUpdate())}>EN</Menu.Item>
						<Menu.Item key="lng-fr" onClick={() => i18next.changeLanguage('fr', () => this.forceUpdate())}>FR</Menu.Item>
					</Menu>
				</Layout.Header>
				<div className="description"><label>{i18next.t('DESCRIPTION')}</label></div>
				<div className="description"><label><b>{i18next.t('ATTENTION')}</b> {i18next.t('CHECK_IN_PROGRESS')}</label></div>
				<div className="description">
					<ul>
						<li><a href="http://docs.karaokes.moe">{i18next.t('DOCUMENTATION_LINK')}</a></li>
						<li><a href="https://lab.shelter.moe/karaokemugen/karaokebase/issues?label_name%5B%5D=en+cours">{i18next.t('IN_PROGRESS_LINK')}</a></li>
					</ul>
				</div>
				<KaraEdit />
			</div>
		);
	}
}

export default function App() {
	return (
	  <Suspense fallback={<Loader />}>
		<MyApp />
	  </Suspense>
	);
  }
