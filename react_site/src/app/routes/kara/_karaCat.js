import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import Page from '../../components/page';
import {Layout, Table, Input, Tag, Button} from 'antd';
import i18next from 'i18next';
import normalizeString from '../../components/normalizeString';
import preg_quote from '../../components/preg_quote';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import icons from '../../components/km/icons';

class KaraCat extends Component {
	constructor(props){
		super(props);
		this.state = {
			data_filtered: [],
			search_keywords: '',
		}
		this.handleSearchChange = this.handleSearchChange.bind(this);
		this.updateFilteredData = this.updateFilteredData.bind(this);
	}

	componentWillUpdate(nextProps, nextState) {
		let prev = JSON.stringify(this.props.data);
		let next = JSON.stringify(nextProps.data);

		if(prev!==next)
		{
			let newState = {
				data_filtered: this.filteredData(nextProps.data),
			};
			this.setState(newState);
		}
	}

	componentDidMount() {
		this.updateFilteredData();
	}

	//----------------------------------------------------------------------------------------------------------------

	filteredData(data) {
		let filtered = data;
		let q = normalizeString(this.state.search_keywords);
		filtered = filtered.filter((value,index) => {
			let v = null;
			if(value && value.key)
				v = value.key
			else
				v = value;

			if(v && v!=="no_tag")
			{
				if(q.length>0)
					return v.indexOf(q) >= 0
				return true;
			}
			return false;
		});
		filtered = filtered.map(function(value,i){
			if(value && value.key)
			{
				if(value.q)
				{
					return {key:value.key, value:(<span>{value.value} <small>{value.q}</small></span>)};
				}
				return value;
			}
			return {key:normalizeString(value), value:value}
		})
		return filtered;
	}

	updateFilteredData() {
		this.setState({data_filtered:this.filteredData(this.props.data)});
	}

	handleSearchChange(event) {
		//console.log(v.target.value);
		this.setState({ search_keywords : event.target.value });
		// delayed list update (avoir to many internal refresh)
		clearTimeout(this.handleSearchChange_delay);
		this.handleSearchChange_delay = setTimeout(this.updateFilteredData,500);
	}

	render() {
		// TODO connecter le player live
		// media file => MP4 et pas de tag R18
		return (
			<Page id="karaCat" data-type={this.props.data_type}>
				<div className="kara-cat-head">
					<h1><FontAwesomeIcon icon={this.props.page_icon} /> {this.props.page_title}</h1>
					<div className="kara-cat-search">
						<Input.Search
							placeholder=""
							onChange={this.handleSearchChange}
							enterButton={i18next.t('btn.search')}
							onSearch={function(){}}
							/>
					</div>
				</div>
				<div className="kara-cat-table">
					<Table
						loading={this.state.data_filtered.length===0 ? true:false}
						dataSource={this.state.data_filtered}
						columns={this.columns()}
						rowKey='key'
						theme="dark"
						pagination={{
							position:'top',
							defaultPageSize: 50,
							pageSizeOptions: ['10','25','50','100'],
							showTotal: (total, range) => {
								const to = range[1];
								const from = range[0];
								return `${from}-${to} / ${total}`;
							},
							showSizeChanger: true,
						}}
					/>
				</div>
			</Page>
		);
	}

	columns(){
		return [
			{
				title: this.props.page_title,
				dataIndex: 'value',
				key: 'key',
				render: (value, record)=> <Link to={"/kara/"+this.props.data_type+"/"+record.key}>{value}</Link>,
				sorter: (a, b) => -a.value.localeCompare(b.value),
			}
		]
	}
}

export default KaraCat