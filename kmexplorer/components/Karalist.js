import React from 'react'
import { i18n } from '../i18n'
import Karaitem from './Karaitem';
import KaraSuggestion from '../components/KaraSuggestion';
import localForage from "localforage";

class Karalist extends React.Component {
	constructor (props) {
		super(props)
		this.state = {
			modal:false,
			gitlabEnabled: false
		}
	}

	async componentDidMount() {
		this.setState({gitlabEnabled: (await localForage.getItem('config')).Gitlab.Enabled, 
			liveURL: (await localForage.getItem('config')).KaraExplorer.LiveURL});
	}
	
	displayModal = () => {
		this.setState({modal:true})
	}
	hideModal = () => {
		this.setState({modal:false})
	}

	render() {
		if(this.props.updating) {
			return (
				<div className="kmx-karas-list">
					<p className="info">{i18n.t('karalist.update_in_progress')}</p>
				</div>
			)
		}
		else if(this.props.data && this.props.data.length>0) {
			return (
				<div className="kmx-karas-list">
					{this.props.data.map((item,i) => {
						return <Karaitem key={i} data={item} tags={this.props.tags} 
							liveURL={this.state.liveURL} filterTools={this.props.filterTools}/>
					})}
				</div>
			)
		} else {
			return (<>
				{this.state.modal ? <KaraSuggestion onClose={() => this.hideModal()} />:null}
				<div className="kmx-karas-list">
					<p className="error">{i18n.t('karalist.no_data')}</p>
				</div>
				{this.state.gitlabEnabled ?
					<div className="kara-suggestion" onClick={this.displayModal}>
						{i18n.t("karalist.kara_suggestion")}
					</div> : null
				}
				</>
			)
		}
	}
}

export default Karalist