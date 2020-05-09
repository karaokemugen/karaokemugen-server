import React from 'react'
import { i18n, withTranslation } from '../i18n'
import icons from './Icons';
import axios from 'axios'
import RuntimeConfig from '../utils/RuntimeConfig';
const API_URL = RuntimeConfig.API_URL;

class KaraProblem extends React.Component {
	constructor (props) {
		super(props)
		this.state = {
			type: "quality"
		};
	}

	confirm = async () => {
		if (this.state.comment && this.state.username) {
			var response = await axios.post(`${API_URL}/api/karas/${this.props.kid}/problem`,
				{type: this.state.type, message : this.state.comment, author: this.state.username})
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
						<h4>{i18n.t("karaissue.gitlab")}</h4>
					</div>
					<div className="kmx-modal-content">
						<div>
							<label>{i18n.t("kara_problem.type")}</label>
							<select onChange={(event) => this.setState({ type: event.target.value })}>
										<option key="quality" value="quality">{i18n.t("kara_problem.media_issue")}</option>
										<option key="time" value="time">{i18n.t("kara_problem.time_issue")}</option>
							</select>
						</div>
						<div>
							<label>{i18n.t("kara_problem.username")}</label>
							<input required={true} onChange={(e) => this.setState({username: e.target.value})}/>
						</div>
						<div>
							<label>{i18n.t("kara_problem.comment")}</label>
							<input required={true} onChange={(e) => this.setState({comment: e.target.value})}/>
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

export default withTranslation('common')(KaraProblem)
