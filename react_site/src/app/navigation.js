import React from 'react';
import { Link } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import i18next from 'i18next';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import icons from './components/km/icons';
/*
{
	to: '/login',
	text: 'Login',
	auth: false,
	icon: 'login',
},
{
	to: '/private',
	text: 'Private',
	auth: true,
	icon: 'user',
},
{
	to: '/logout',
	text: 'Logout',
	auth: true,
	icon: 'logout',
},
*/

class Navigation extends React.Component {

	constructor(props){
		super(props);
		this.state = {
			collapsed: false,
		}

		this.onCollapse = this.onCollapse.bind(this);
		this.handleLocaleSelection = this.handleLocaleSelection.bind(this);
	}

	onCollapse(collapsed){
		this.setState({ collapsed });
	}

	handleLocaleSelection(lang){
		this.props.setLocale(lang);
	}

	render() {
		let links = [
			{
				to:"/",
				pattern:/^\/$/,
				title:i18next.t("nav.homepage"),
				icon:icons.homepage,
			},
			{
				to:"/kara",
				pattern:/^\/kara$/,
				title:i18next.t("nav.karas"),
				icon:icons.karas,
			},
			{
				to:"/kara/singer",
				pattern:/^\/kara\/singer/,
				title:i18next.t("kara.singer_plural"),
				icon:icons.singer,
			},
			{
				to:"/kara/serie",
				pattern:/^\/kara\/serie/,
				title:i18next.t("kara.serie_plural"),
				icon:icons.serie,
			},
			{
				to:"/kara/songwriter",
				pattern:/^\/kara\/songwriter/,
				title:i18next.t("kara.songwriter_plural"),
				icon:icons.songwriter,
			},
			{
				to:"/kara/creator",
				pattern:/^\/kara\/creator/,
				title:i18next.t("kara.creator_plural"),
				icon:icons.creator,
			},
			{
				to:"/kara/author",
				pattern:/^\/kara\/author/,
				title:i18next.t("kara.author_plural"),
				icon:icons.author,
			},
			{
				to:"/kara/language",
				pattern:/^\/kara\/language/,
				title:i18next.t("kara.language_plural"),
				icon:icons.language,
			},
		]
		return (
			<nav id="navigation">
				<ul className="nav-main">
					{
						links.map((link,i) => {
							let active = this.props.currentPath.match(link.pattern);
							return (
								<li key={i} className={active ? 'active':''}>
									<Link to={link.to}>
									 	<FontAwesomeIcon icon={link.icon} />
										{link.title}
									</Link>
								</li>
							)
						})
					}
				</ul>
				<ul className="nav-lng">
					<li key="lng-fr" className={this.props.currentLocale==='fr' ? 'active':''}><span onClick={this.handleLocaleSelection.bind(null,'fr')}>FR</span></li>
					<li key="lng-en" className={this.props.currentLocale==='en' ? 'active':''}><span onClick={this.handleLocaleSelection.bind(null,'en')}>EN</span></li>
				</ul>
			</nav>
		);
	}
}


export default Navigation