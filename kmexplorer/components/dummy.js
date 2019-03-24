import React from 'react'
import { i18n, Link, withNamespaces } from '../i18n'

class Dummy extends React.Component {
	render() {
		return (
			<div className="dummy-component">
				<p>Starter component</p>
				<p>{i18n.t('Namespace:Prefix.ChainToTranslate')}</p>
			</div>
		)
	}
}

export default withNamespaces('common')(Dummy)