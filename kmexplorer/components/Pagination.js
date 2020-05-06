import React from 'react'
import Link from '../utils/I18nLink';

class Pagination extends React.Component {
	render() {
		let total = this.props.total ? this.props.total : 0
		if(typeof this.props.data === 'object' && this.props.data.length > 0)
			total = this.props.data.length

		let size = this.props.size ? this.props.size : 10 // nombre d'élément par page
		let limit = this.props.limit ? this.props.limit : 7 // nombre de bouton maximum
		let current = this.props.current ? this.props.current : 0;
		let renderUrl = typeof this.props.renderUrl === 'function' ? this.props.renderUrl : (i) => { return '#'+i }
		let renderLabel = typeof this.props.renderLabel === 'function' ? this.props.renderLabel : (i) => { return i+1 }

		let max = Math.floor(total / size)
		if(max == total / size)
			max--;

		current = Math.min(max,current);

		limit = limit%2 ? limit : limit-1; // limit doit être impaire

		let nodes = []

		let delta = Math.floor((limit - 2)/2);
		let _from = Math.max(1,current - delta);
		let _to = Math.min(max,_from + limit - 3);
		if(max > limit)
			_to = Math.min(max - 1,_from + limit - 3);
		if(_to==max-1)
		{
			_from = Math.max(1,max - limit + 2);
		}

		// --------------------- BEFORE LOOP
		nodes.push(<Link key="previous" href={renderUrl(Math.max(0,current-1))}><a>«</a></Link>)

		nodes.push(<Link key={0} href={renderUrl(0)}><a className={current==0 ? 'current':''}>{renderLabel(0)}</a></Link>)

		if(_from > 1)
			nodes.push(<span key="space-before">...</span>)

		// --------------------- LOOP
		for(let i=_from; i<=_to; i++){
			nodes.push(<Link key={i} href={renderUrl(i)}><a className={current==i ? 'current':''}>{renderLabel(i)}</a></Link>)
		}

		// --------------------- AFTER LOOP

		if(max>limit)
		{
			if(_to < max - 1)
				nodes.push(<span key="space-after">...</span>)

			nodes.push(<Link key={max} href={renderUrl(max)}><a className={current==max ? 'current':''}>{renderLabel(max)}</a></Link>)
		}

		nodes.push(<Link key="next" href={renderUrl(Math.min(current+1,max))}><a>»</a></Link>)

		// --------------------- FINAL RENDER

		return (
			<div className="pagination">
				{nodes}
			</div>
		)
	}
}

export default Pagination