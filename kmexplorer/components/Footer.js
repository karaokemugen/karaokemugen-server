import React from 'react'
import { i18n, withTranslation } from '../i18n'

class Footer extends React.Component {
	render() {
		return (
			<footer className="kmx-footer">
				<p>Karaoke Mugen Server - <a href="https://lab.shelter.moe/karaokemugen/karaokemugen-server">GIT</a> - <a href="http://karaokes.moe">{i18n.t('footer:home')}</a></p> 
				<p>{i18n.t('footer:software_under_license')} <a href="https://lab.shelter.moe/karaokemugen/karaokemugen-server/blob/master/LICENSE.md">MIT</a> / {i18n.t('footer:base_under_licence')} <a href="https://lab.shelter.moe/karaokemugen/karaokebase/blob/master/LICENSE.md">Creative Commons 4.0 BY-NC-SA</a></p>
			</footer>
		)
	}
}

export default withTranslation('footer')(Footer)
