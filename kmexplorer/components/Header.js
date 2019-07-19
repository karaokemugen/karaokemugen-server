import React from 'react'
import { i18n, withNamespaces } from '../i18n'
import querystring from 'querystring';
import FilterTools from '../utils/filterTools';
import RuntimeConfig from '../utils/RuntimeConfig';
import icons from '../components/Icons';
import Help from '../components/Help';
import Link from '../utils/I18nLink';

const BASE_URL = RuntimeConfig.BASE_URL;
const filterTools = new FilterTools();

class Header extends React.Component {

	constructor (props) {
		super(props)
		this.state = {
			help:false,
			dropdown:{
				tags:false,
			},
		}
	}

	displayHelp(){
		this.setState({help:true})
	}
	hideHelp(){
		this.setState({help:false})
	}

	toggleDropdown(k){
		let dropdown = this.state.dropdown;
		dropdown[k] = !dropdown[k];
		this.setState({dropdown:dropdown})
	}
	closeDropdown(k){
		let dropdown = this.state.dropdown;
		dropdown[k] = false;
		this.setState({dropdown:dropdown})
	}

	render() {
		var current_route = this.props.router ? this.props.router.route : '/';
		current_route = current_route ? current_route : '/';

		filterTools.setParams(this.props.filterParams);
		var query = querystring.stringify(filterTools.reset().setPage(0).getQuery());
		return (
			<div>
				{this.state.help ? <Help onClose={() => this.hideHelp()} />:null}
				<header className="kmx-header">
					<div className="kmx-filters-menu">
						<dl className="kmx-filters-menu--list">
							<dd key="index"      ><Link href={ "/?"            + query }><a className={current_route=="/"            ? "active":"inactive"}>{icons.home} {i18n.t('category.home')}</a></Link></dd>
							<dd key="karas"      ><Link href={ "/karas?"       + query }><a className={current_route=="/karas"       ? "active":"inactive"}>{icons.karas} {i18n.t('category.karas')}</a></Link></dd>
							<dd key="songtypes"  ><Link href={ "/songtypes?"   + query }><a className={current_route=="/songtypes"   ? "active":"inactive"}>{icons.songtypes} {i18n.t('category.songtypes')}</a></Link></dd>
							<dd key="tags">
								<button onClick={this.toggleDropdown.bind(this,'tags')}>{icons.tags} {i18n.t('category.tags')}</button>
								{
									this.state.dropdown.tags 
									? <dl className="kmx-filters-menu--dropdown">
										<dd onClick={this.closeDropdown.bind(this,'tags')} key="miscs"     ><Link href={ "/miscs?"     + query }><a className={current_route=="/miscs"       ? "active":"inactive"}>{icons.miscs} {i18n.t('category.miscs')}</a></Link></dd>
										<dd onClick={this.closeDropdown.bind(this,'tags')} key="groups"    ><Link href={ "/groups?"    + query }><a className={current_route=="/groups"      ? "active":"inactive"}>{icons.groups} {i18n.t('category.groups')}</a></Link></dd>
										<dd onClick={this.closeDropdown.bind(this,'tags')} key="families"  ><Link href={ "/families?"  + query }><a className={current_route=="/families"    ? "active":"inactive"}>{icons.families} {i18n.t('category.families')}</a></Link></dd>
										<dd onClick={this.closeDropdown.bind(this,'tags')} key="origins"   ><Link href={ "/origins?"   + query }><a className={current_route=="/origins"     ? "active":"inactive"}>{icons.origins} {i18n.t('category.origins')}</a></Link></dd>
										<dd onClick={this.closeDropdown.bind(this,'tags')} key="genres"    ><Link href={ "/genres?"    + query }><a className={current_route=="/genres"      ? "active":"inactive"}>{icons.genres} {i18n.t('category.genres')}</a></Link></dd>
										<dd onClick={this.closeDropdown.bind(this,'tags')} key="platforms" ><Link href={ "/platforms?" + query }><a className={current_route=="/platforms"   ? "active":"inactive"}>{icons.platforms} {i18n.t('category.platforms')}</a></Link></dd>
									</dl>
									: null
								}
							</dd>
							<dd key="singers"    ><Link href={ "/singers?"     + query }><a className={current_route=="/singers"     ? "active":"inactive"}>{icons.singers} {i18n.t('category.singers')}</a></Link></dd>
							<dd key="series"     ><Link href={ "/series?"      + query }><a className={current_route=="/series"      ? "active":"inactive"}>{icons.series} {i18n.t('category.series')}</a></Link></dd>
							<dd key="songwriters"><Link href={ "/songwriters?" + query }><a className={current_route=="/songwriters" ? "active":"inactive"}>{icons.songwriters} {i18n.t('category.songwriters')}</a></Link></dd>
							<dd key="creators"   ><Link href={ "/creators?"    + query }><a className={current_route=="/creators"    ? "active":"inactive"}>{icons.creators} {i18n.t('category.creators')}</a></Link></dd>
							<dd key="authors"    ><Link href={ "/authors?"     + query }><a className={current_route=="/authors"     ? "active":"inactive"}>{icons.authors} {i18n.t('category.authors')}</a></Link></dd>
							<dd key="languages"  ><Link href={ "/languages?"   + query }><a className={current_route=="/languages"   ? "active":"inactive"}>{icons.languages} {i18n.t('category.languages')}</a></Link></dd>
							<dd key="years"      ><Link href={ "/years?"       + query }><a className={current_route=="/years"       ? "active":"inactive"}>{icons.years} {i18n.t('category.years')}</a></Link></dd>
							<dd key="karaimport" ><a href={ "/import" }>{icons.kara_import} {i18n.t('category.kara_import')}</a></dd>
						</dl>
					</div>
					<div className="kmx-help-menu">
						<dl>
							<dd hidden={true} key="help"><a onClick={() => this.displayHelp('en')}>Aide</a></dd>
						</dl>
					</div>
					<div className="kmx-language-menu">
						<dl>
							<dd key="lng-en"><a onClick={() => i18n.changeLanguage('en')} className={i18n.language=="en" ? "active":""}>EN</a></dd>
							<dd key="lng-fr"><a onClick={() => i18n.changeLanguage('fr')} className={i18n.language=="fr" ? "active":""}>FR</a></dd>
						</dl>
					</div>
				</header>
			</div>
		)
	}
}

export default withNamespaces('common')(Header)
