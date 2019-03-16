import React from 'react'
import { i18n, withNamespaces } from '../i18n'
import icons from '../components/Icons';


class Help extends React.Component {
	constructor (props) {
		super(props)
		this.state = {
		}
	}
	render() {
		return (
			<div className="kmx-help-panel-wrapper">
				<div className="kmx-help-panel">
					<button type="button" data-type="close" onClick={this.props.onClose}>Fermer</button>
					Panneau d'aide à compléter
				</div>
			</div>
		)
	}
}

export default withNamespaces('common')(Help)
