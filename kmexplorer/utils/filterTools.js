import {deburr} from "lodash"
import {tagsMap,tagTypeFromId} from "../components/tagsMap.js"
import querystring from 'querystring';


// ?p=0&filter=keywords&q=y:1982!s:501!t:10,4488
// p = current page index
// filter = keywords filter
// q = extra search filter separated by "!"
// - y = year
// - s = serie
// - t = tags comma separated

export default class FilterTools {
	constructor() {
		this.empty ={
			page : 0,
			keywords : '',
			year : null,
			serie : null,
			tags : [],
			slug : null,
			orderBy : 'recent'
		}
		this.params ={
			page : 0,
			keywords : '',
			year : null,
			serie : null,
			tags : [],
			slug : null,
			orderBy : 'recent'
		}
		this.liveParams ={
			page : 0,
			keywords : '',
			year : null,
			serie : null,
			tags : [],
			slug : null,
			orderBy : 'recent'
		}
	}
	init(query){
		//console.log(query)
		query = query.path ? query.query : query;

		var slug = query.slug ? query.slug : null;
		var page = parseInt(query.p ? query.p : 0);
		var keywords = query.filter ? ''+query.filter : '';
		var extra = query.q ? '!'+query.q : '!';
		var orderBy = query.order ? ''+query.order : 'recent'
		//console.log(extra);
		var year = null;
		var serie = null;
		var tags = [];
		extra.split('!').forEach( function(v, i) {
			if(v.match(/^y:/))
				year = parseInt(v.replace(/^y:/,''));
			else if(v.match(/^s:/))
				serie = v.replace(/^s:/,'');
			else if(v.match(/^t:/))
				tags = v.replace(/^t:/,'').split(',');
		});
		var dedup_tags = tags.filter(function(elem, pos) {
			return tags.indexOf(elem) == pos;
		})
		/*
		dedup_tags = dedup_tags.map(function(v){
			return parseInt(v);
		})
		*/
		this.params = {
			page : page,
			keywords : keywords,
			year : year,
			serie : serie,
			tags : dedup_tags,
			slug : slug,
			orderBy : orderBy
		}
		this.reset()
		return this.params;
	}
	getParams(){
		return JSON.parse(JSON.stringify(this.params));
	}
	setParams(params){
		this.params = JSON.parse(JSON.stringify(params));
		this.reset();
	}
	clear(){
		this.liveParams = JSON.parse(JSON.stringify(this.empty));
		return this;
	}
	reset(){
		this.liveParams =  JSON.parse(JSON.stringify(this.params));
		return this;
	}
	save()
	{
		this.params =  JSON.parse(JSON.stringify(this.liveParams));
		return this;
	}
	setPage(v){
		if(this.liveParams)
			this.liveParams.page = v;
		return this;
	}
	getPage(){
		if(this.liveParams)
			return this.liveParams.page;
	}
	setKeywords(v){
		if(this.liveParams)
			this.liveParams.keywords = v;
		return this;
	}
	getKeywords(){
		if(this.liveParams)
			return this.liveParams.keywords;
	}
	setOrderBy(v){
		if(this.liveParams)
			this.liveParams.orderBy = v;
		return this;
	}
	getOrderBy(){
		if(this.liveParams)
			return this.liveParams.orderBy;
	}
	addTag(type,value,slug=null){

		this.liveParams.slug = slug ? this.normalizeString(""+slug) : null;
		this.liveParams.orderBy='search';
		//console.log(type,value,this.liveParams.tags)

		if(type=='year')
			this.liveParams.year = value;
		else if(type=='serie')
			this.liveParams.serie = value;
		else
		{
			let typeID = tagsMap[type].id || 0;
			if(this.liveParams.tags.indexOf(value+'~'+typeID)<0)
			{
				
				this.liveParams.tags.push(value+'~'+typeID);
			}
		}
		return this;
	}
	removeTag(type,value=null){
		if(type=='year')
			this.liveParams.year = null;
		else if(type=='serie')
			this.liveParams.serie = null;
		else if(this.liveParams.tags.indexOf(value)>=0)
			this.liveParams.tags.splice(this.liveParams.tags.indexOf(value),1);
		return this;
	}
	getQuery(mode=null){
		if(mode!==null)
		{
			let query = {
				p:this.liveParams.page,
			};

			let _query = querystring.stringify(query);
			return {
				path:"/"+mode,
				query:query,
				query_string:_query,
				url:"/"+mode+"?"+_query,
			};
		}

		let query = {
			p:this.liveParams.page,
			filter:this.liveParams.keywords,
			order: this.liveParams.orderBy,
		};

		let q_count = 0;
		if(this.liveParams.year) q_count++;
		if(this.liveParams.serie) q_count++;
		if(this.liveParams.tags && this.liveParams.tags.length>0)
			q_count += this.liveParams.tags.length;

		if(q_count>1)
		{
			let q = [];
			if(this.liveParams.year)
				q.push('y:'+this.liveParams.year);
			if(this.liveParams.serie)
				q.push('s:'+this.liveParams.serie);
			if(this.liveParams.tags && this.liveParams.tags.length>0)
				q.push('t:'+this.liveParams.tags.join(','));

			query.q = q.join('!');

			let _query = querystring.stringify(query);
			return {
				path:"/karas",
				query:query,
				query_string:_query,
				url:"/karas?"+_query,
			};
		}
		else
		{
			let code = null;
			let value = null;
			let slug = this.liveParams.slug;

			if(this.liveParams.year)
			{
				code = 'year';
				value = this.liveParams.year;
				slug = null
			}
			else if(this.liveParams.serie)
			{
				code = 'serie';
				value = this.liveParams.serie;
			}
			else if(this.liveParams.tags && this.liveParams.tags.length>0)
			{
				let tagFilter = this.liveParams.tags[0];
				var typeId = parseInt(tagFilter.replace(/^.*~/,''));
				let type = tagTypeFromId(typeId)
				if(type)
				{
					code = type.code;
					value = tagFilter;
				}
			}

			if(code!==null)
			{
				let _path = "/karas"+(code ? "/"+code:"")+(slug ? "/"+slug:"")+(value ? "/"+value:"")
				let _query = querystring.stringify(query);
				return {
					path:_path,
					query:query,
					query_string:_query,
					url:_path+"?"+_query,
				};
			}

			let _query = querystring.stringify(query);
			return {
				path:"/karas",
				query:query,
				query_string:_query,
				url:"/karas?"+_query,
			};
		}

		
	}
	getApiQuery(pageSize){
		let q = [];
		if(this.liveParams.year)
			q.push('y:'+this.liveParams.year);
		if(this.liveParams.serie)
			q.push('s:'+this.liveParams.serie);
		if(this.liveParams.tags && this.liveParams.tags.length>0)
			q.push('t:'+this.liveParams.tags.join(','));
		return {
			from:this.liveParams.page * pageSize,
			size:pageSize,
			filter:this.liveParams.keywords,
			q:q.join('!'),
		}
	}

	// String Search helpers
	keywordSearch(string,keyword) {
		return this.normalizeString(string).indexOf(this.normalizeString(keyword))>=0;
	}

	normalizeString(str) {
		return typeof str === "string" ? deburr(str.toLowerCase()).replace(/[\/?%~'"«»]+/g,'') : '';
	}

};