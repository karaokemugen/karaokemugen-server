import React from 'react'
import { i18n, Link, withNamespaces } from '../i18n'

import Karaitem from './Karaitem';

class Karalist extends React.Component {
	render() {
		if(this.props.updating)
		{
			return (
				<div className="kmx-karas-list">
					<p className="info">{i18n.t('karalist.upade_in_progress')}</p>
				</div>
			)
		}
		else if(this.props.data && this.props.data.length>0)
		{
			return (
				<div className="kmx-karas-list">
					{this.props.data.map((item,i) => {
						return <Karaitem key={i} data={item} filterTools={this.props.filterTools}/>
					})}
				</div>
			)
		}
		else
		{
			return (
				<div className="kmx-karas-list">
					<p className="error">{i18n.t('karalist.no_data')}</p>
				</div>
			)
		}
	}
}

export default withNamespaces('common')(Karalist)