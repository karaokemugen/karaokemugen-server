import React from 'react'
import { i18n, withNamespaces } from '../i18n'

class Footer extends React.Component {
	render() {
		return (
			<footer>
			{i18n.t('footer:description')}
			</footer>
		)
	}
}

export default withNamespaces('common')(Footer)
