import React, { Suspense } from 'react';
import KaraForm from './pages/KaraForm';
import {Layout, Menu} from 'antd';
import { useTranslation } from 'react-i18next';
import Spinner from 'react-spinner';

import './App.css';

function MyApp() {
	const { t, i18n } = useTranslation();

	return (
		<div className="import-kara">
			<Layout.Header style={{height: '56px'}}>
				<Menu
					theme="dark"
					mode="horizontal"
				>
					<Menu.Item><a href="/base">{t('HOME')}</a></Menu.Item>
					<Menu.Item className='label-lang' disabled>{<label>{t('LANG')}</label>}</Menu.Item>
					<Menu.Item key="lng-en" onClick={() => i18n.changeLanguage('en')}>EN</Menu.Item>
					<Menu.Item key="lng-fr" onClick={() => i18n.changeLanguage('fr')}>FR</Menu.Item>
				</Menu>
			</Layout.Header>
			<KaraForm translation={t}/>
		</div>
	);
}

export default function App() {
	return (
	  <Suspense fallback={<Spinner />}>
		<MyApp />
	  </Suspense>
	);
  }