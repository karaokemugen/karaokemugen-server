import React from 'react'
import { i18n, withTranslation } from '../i18n'
import icons from './Icons';
import axios from 'axios'
import RuntimeConfig from '../utils/RuntimeConfig';
import isoLanguages from '../components/isoLanguages';

const API_URL = RuntimeConfig.API_URL;

class KaraSuggestion extends React.Component {
	constructor (props) {
		super(props)
		this.state = {};
	}

	async componentDidMount() {
		var response = await axios.get(API_URL+'/api/karas/tags/3');
		var songtypes = response.data.content.map(tag => tag.i18n[isoLanguages(i18n.language)] || (tag.i18n['eng'] || tag.name))
		this.setState({songtypes: songtypes, songtype: songtypes[0]});
	}

	confirm = async () => {
		if (this.state.title && this.state.songtype && this.state.serie && this.state.username) {
			var response = await axios.post(API_URL+'/api/karas/suggest',
				{ title: this.state.title, type: this.state.songtype, serie : this.state.serie, link: this.state.link, username: this.state.username})
			if(response.status===200 && response.data !==null) {
				this.props.onClose();
			}
		}
	}

	render() {
		return (
			<div className="kmx-modal-wrapper">
				<div className="kmx-modal-panel">
					<div className="kmx-modal-header">
						<h4>{i18n.t("kara_suggestion.title")}</h4>
					</div>
					<div className="kmx-modal-content">
						<div>
							<label>{i18n.t("kara_suggestion.username")}</label>
							<input required={true} onChange={(e) => this.setState({username: e.target.value})}/>
						</div>
						<div>
							<label>{i18n.t("kara_suggestion.serie")}</label>
							<input required={true} onChange={(e) => this.setState({serie: e.target.value})}/>
						</div>
						<div>
							<label>{i18n.t("kara_suggestion.type")}</label>
							{this.state.songtypes ?
								<select onChange={(event) => this.setState({ songtype: event.target.value })}>
										{this.state.songtypes.map(type => {
											return <option key={type} value={type}>{type}</option>
										})}
								</select> : null
							}
						</div>
						<div>
							<label>{i18n.t("kara_suggestion.name")}</label>
							<input required={true} onChange={(e) => this.setState({title: e.target.value})}/>
						</div>
						<div>
							<label>{i18n.t("kara_suggestion.link")}</label>
							<input onChange={(e) => this.setState({link: e.target.value})}/>
						</div>
					</div>
					<div className="kmx-modal-footer">
						<button className="kmx-modal-abort" type="button" onClick={this.props.onClose}>
							{icons.abort}
						</button>
						<button className="kmx-modal-confirm" type="submit" onClick={this.confirm}>
							{icons.confirm}
						</button>
					</div>
				</div>
			</div>
		)
	}
}

export default withTranslation('common')(KaraSuggestion)
