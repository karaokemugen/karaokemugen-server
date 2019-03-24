import React, {Component} from 'react';
import {message, Tooltip, Button, Form, Icon, Input, InputNumber, Select, Upload} from 'antd';
import EditableTagGroup from './Components/EditableTagGroup';
import axios from 'axios/index';

class KaraForm extends Component {

	constructor(props) {
		super(props);
		this.state = {
			seriesRequired: true,
			overwrite: false,
			subfileList: [],
			mediafileList: [],
			singers: [],
			authors: [],
			tags: ['TAG_ANIME', 'TAG_TVSHOW'],
			series: [],
			creators: [],
			songwriters: [],
			groups: [],
			songtype: 'OP',
			langs: ['jpn']
		};
	}

	componentDidMount() {
		this.onChangeType(this.state.songtype);
		this.props.form.validateFields();
	}

	handleSubmit = (e) => {
		e.preventDefault();
		this.props.form.validateFields((err, values) => {
			if (!err) {
				axios.post('/api/karas/', values).then(function (response) {
					message.success(this.props.translation('ADD_SUCCESS'));
				  })
				  .catch(function (error) {
					console.log(error)
					message.error(this.props.translation('ADD_ERROR'));
				  });
			};
		});
	};

	isMediaFile = (filename) => {
		return new RegExp('^.+\\.(avi|mkv|mp4|webm|mov|wmv|mpg|ogg|m4a|mp3)$').test(filename);
	};

	onChangeOverwrite = (e) => {
		this.props.form.setFieldsValue({ overwrite: e.target.checked});
	};

	onChangeType = (e) => {
		this.setState({
			seriesRequired: !(e === 'MV' || e === 'LIVE')
		}, () => {
			this.props.form.validateFields(['series'], { force: true });
	  		this.props.form.validateFields(['singer'], { force: true });
    	}
		);
	}

	onMediaUploadChange = (info) => {
		let fileList = info.fileList;
		fileList = fileList.slice(-1);
		this.setState({ mediafileList: fileList });
		if (info.file.status === 'uploading') {
			this.props.form.setFieldsValue({ mediafile: null, mediafile_orig: null });
		} else if (info.file.status === 'done') {
			if (this.isMediaFile(info.file.name)) {
				this.props.form.setFieldsValue({
					mediafile: info.file.response.filename,
					mediafile_orig: info.file.response.originalname
				});
				message.success(this.props.translation('KARA.ADD_FILE_SUCCESS', {name: info.file.name}));
			} else {
				this.props.form.setFieldsValue({ mediafile: null });
				message.error(this.props.translation('KARA.ADD_FILE_MEDIA_ERROR', {name: info.file.name}));
				info.file.status = 'error';
				this.setState({ mediafileList: [] });
			}
		} else if (info.file.status === 'error') {
			this.props.form.setFieldsValue({ mediafile: null, mediafile_orig: null });
			this.setState({ mediafileList: [] });
		}
	};

	onSubUploadChange = (info) => {
		let fileList = info.fileList;
		fileList = fileList.slice(-1);
		this.setState({ subfileList: fileList });
		if (info.file.status === 'uploading') {
			this.props.form.setFieldsValue({ subfile: null, subfile_orig: null });
		} else if (info.file.status === 'done') {
			if (info.file.name.endsWith('.ass')) {
				this.props.form.setFieldsValue({
					subfile: info.file.response.filename,
					subfile_orig: info.file.response.originalname
				});
				message.success(this.props.translation('KARA.ADD_FILE_SUCCESS', {name: info.file.name}));
			} else {
				this.props.form.setFieldsValue({ subfile: null, subfile_orig: null });
				message.error(this.props.translation('KARA.ADD_FILE_LYRICS_ERROR', {name: info.file.name}));
				info.file.status = 'error';
				this.setState({ subfileList: [] });
			}
		} else if (info.file.status === 'error') {
			this.props.form.setFieldsValue({ subfile: null });
			this.setState({ subfileList: [] });
		}
	};

	render() {
		const {getFieldDecorator} = this.props.form;
		const t = this.props.translation;

		return (
			<Form
				onSubmit={this.handleSubmit}
				className='kara-form'
			>
				<Form.Item hasFeedback
					label={t('KARA.MEDIA_FILE')}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 6, offset: 0 }}
				>
					<Upload
						action='/api/karas/importfile'
						accept='video/*,audio/*'
						multiple={false}
						onChange={this.onMediaUploadChange}
						fileList={this.state.mediafileList}
					>
						<Button>
							<Icon type="upload" />{t('KARA.MEDIA_FILE')}
						</Button>
					</Upload></Form.Item>
				<Form.Item
					label={t('KARA.LYRICS_FILE')}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 6, offset: 0 }}
				>
					<Upload
						action='/api/karas/importfile'
						multiple={false}
						onChange={this.onSubUploadChange}
						fileList={this.state.subfileList}
					>
						<Button>
							<Icon type="upload" />{t('KARA.LYRICS_FILE')}
						</Button>
					</Upload></Form.Item>
				<Form.Item hasFeedback
					label={(
						<span>{t('KARA.TITLE')}&nbsp;
							<Tooltip title={t('KARA.TITLE_TOOLTIP')}>
								<Icon type="question-circle-o" />
							</Tooltip>
						</span>
					)}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 8, offset: 0 }}
				>
					{getFieldDecorator('title', {
						initialValue: this.state.title,
						rules: [{
							required: true,
							message: t('KARA.TITLE_REQUIRED')
						}],
					})(<Input
						onPressEnter={this.handleSubmit}
						placeholder={t('KARA.TITLE')}
						label={t('KARA.TITLE')}
					/>)}
				</Form.Item>
				<Form.Item hasFeedback
					label={(
						<span>{t('KARA.SERIES')}&nbsp;
							<Tooltip title={t('KARA.SERIES_TOOLTIP')}>
								<Icon type="question-circle-o" />
							</Tooltip>
						</span>
					)}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 14, offset: 0 }}
				>
					{getFieldDecorator('series', {
						initialValue: this.state.series,
						rules: [{
							required: this.state.seriesRequired,
							message: t('KARA.SERIES_REQUIRED')
						}]
					})(<EditableTagGroup
						search={'serie'}
						onChange={ (tags) => this.props.form.setFieldsValue({ series: tags.join(',') }) }
						translation={t}
					/>)}
				</Form.Item>
				<Form.Item
					label={t('KARA.TYPE')}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 3, offset: 0 }}
				>
					{getFieldDecorator('type', {
						rules: [{required: true}],
						initialValue: this.state.songtype
					})(<Select placeholder={'Song type'}
						onChange={ this.onChangeType }
					>
						<Select.Option value='AMV'>{t('TYPES.TYPE_AMV')}</Select.Option>
						<Select.Option value='CM'>{t('TYPES.TYPE_CM')}</Select.Option>
						<Select.Option value='ED'>{t('TYPES.TYPE_ED')}</Select.Option>
						<Select.Option value='IN'>{t('TYPES.TYPE_IN')}</Select.Option>
						<Select.Option value='OT'>{t('TYPES.TYPE_OT')}</Select.Option>
						<Select.Option value='PV'>{t('TYPES.TYPE_PV')}</Select.Option>
						<Select.Option value='LIVE'>{t('TYPES.TYPE_LIVE')}</Select.Option>
						<Select.Option value='OP'>{t('TYPES.TYPE_OP')}</Select.Option>
						<Select.Option value='MV'>{t('TYPES.TYPE_MV')}</Select.Option>
					</Select>)}
				</Form.Item>
				<Form.Item hasFeedback
					label={(
						<span>{t('KARA.ORDER')}&nbsp;
							<Tooltip title={t('KARA.ORDER_TOOLTIP')}>
								<Icon type="question-circle-o" />
							</Tooltip>
						</span>
					)}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 1, offset: 0 }}
				>
					{getFieldDecorator('order', {
						initialValue: this.state.order
					})(<InputNumber
						min={0}
						style={{ width: '100%' }}
					/>)}
				</Form.Item>
				<Form.Item hasFeedback
					label={t('KARA.LANGUAGES')}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 6, offset: 0 }}
				>
					{getFieldDecorator('lang', {
						rules: [{required: true}],
						initialValue: this.state.langs
					})(<EditableTagGroup
						search={'lang'}
						onChange={ (tags) => this.props.form.setFieldsValue({ lang: tags.join(',') }) }
						translation={t}
					/>)}
				</Form.Item>
				<Form.Item hasFeedback
					label={(
						<span>{t('KARA.YEAR')}&nbsp;
							<Tooltip title={t('KARA.YEAR_TOOLTIP')}>
								<Icon type="question-circle-o" />
							</Tooltip>
						</span>
					)}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 2, offset: 0 }}
				>
					{getFieldDecorator('year', {
						initialValue: this.state.year || 2010,
						rules: [{required: true}]
					})(<InputNumber
						onPressEnter={this.handleSubmit}
						min={0}
						placeholder='Year'
						style={{ width: '100%' }}
					/>)}
				</Form.Item>
				<Form.Item hasFeedback
					label={t('KARA.SINGERS')}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 6, offset: 0 }}
				>
					{getFieldDecorator('singer', {
						initialValue: this.state.singers,
						rules: [{
							required: !this.state.seriesRequired,
							message: t('KARA.SINGERS_REQUIRED')
						}]
					})(<EditableTagGroup
						tagType={2}
						search={'tag'}
						onChange={ (tags) => this.props.form.setFieldsValue({ singer: tags.join(',') }) }
						translation={t}
					/>)}
				</Form.Item>
				<Form.Item
					label={(
						<span>{t('KARA.SONGWRITERS')}&nbsp;
							<Tooltip title={t('KARA.SONGWRITERS_TOOLTIP')}>
								<Icon type="question-circle-o" />
							</Tooltip>
						</span>
					)}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 6, offset: 0 }}
				>
					{getFieldDecorator('songwriter', {
						initialValue: this.state.songwriters
					})(<EditableTagGroup
						tagType={8}
						search={'tag'}
						onChange={ (tags) => this.props.form.setFieldsValue({ songwriter: tags.join(',') }) }
						translation={t}
					/>)}
				</Form.Item>
				<Form.Item
					label={(
						<span>{t('KARA.CREATORS')}&nbsp;
							<Tooltip title={t('KARA.CREATORS_TOOLTIP')}>
								<Icon type="question-circle-o" />
							</Tooltip>
						</span>
					)}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 6, offset: 0 }}
				>
					{getFieldDecorator('creator', {
						initialValue: this.state.creators
					})(<EditableTagGroup
						tagType={4}
						search={'tag'}
						onChange={ (tags) => this.props.form.setFieldsValue({ creator: tags.join(',') }) }
						translation={t}
					/>)}
				</Form.Item>
				<Form.Item hasFeedback
					label={(
						<span>{t('KARA.KARA_AUTHORS')}&nbsp;
							<Tooltip title={t('KARA.KARA_AUTHORS_TOOLTIP')}>
								<Icon type="question-circle-o" />
							</Tooltip>
						</span>
					)}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 6, offset: 0 }}
				>
					{getFieldDecorator('author', {
						initialValue: this.state.authors
					})(<EditableTagGroup
						tagType={6}
						search={'tag'}
						onChange={ (tags) => this.props.form.setFieldsValue({ author: tags.join(',') }) }
						translation={t}
					/>)}
				</Form.Item>
				<Form.Item
					label={(
						<span>{t('KARA.TAGS')}&nbsp;
							<Tooltip title={(<a href="http://mugen.karaokes.moe/docs/fr/contrib-guide/tags/">{t('KARA.TAGS_TOOLTIP')}</a>)}>
								<Icon type="question-circle-o" />
							</Tooltip>
						</span>
					)}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 10, offset: 0 }}
				>
					{getFieldDecorator('tags', {
						initialValue: this.state.tags
					})(<EditableTagGroup
						tagType={7}
						checkboxes={true}
						search={'tag'}
						onChange={ (tags) => this.props.form.setFieldsValue({ tags: tags.join(',') })}
						translation={t}
					/>)}
				</Form.Item>
				<Form.Item
					label={(
						<span>{t('KARA.GROUPS')}&nbsp;
							<Tooltip title={t('KARA.GROUPS_TOOLTIP')}>
								<Icon type="question-circle-o" />
							</Tooltip>
						</span>
					)}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 6, offset: 0 }}
				>
					{getFieldDecorator('groups', {
						initialValue: this.state.groups
					})(<EditableTagGroup
						tagType={9}
						search={'tag'}
						onChange={ (tags) => this.props.form.setFieldsValue({ groups: tags.join(',') }) }
						translation={t}
					/>)}
				</Form.Item>
				<Form.Item
					wrapperCol={{ span: 8, offset: 1 }}
				>
					<Button type='primary' htmlType='submit' className='login-form-button'>{t('SUBMIT')}</Button>
				</Form.Item>
				<Form.Item>
					{getFieldDecorator('karafile', {
						initialValue: this.state.karafile
					})(<Input type="hidden" />)}
				</Form.Item>
				<Form.Item>
					{getFieldDecorator('mediafile', {
						initialValue: this.state.mediafile
					})(<Input type="hidden" />)}
				</Form.Item>
				<Form.Item>
					{getFieldDecorator('mediafile_orig', {
						initialValue: null
					})(<Input type="hidden" />)}
				</Form.Item>
				<Form.Item>
					{getFieldDecorator('subfile_orig', {
						initialValue: null
					})(<Input type="hidden" />)}
				</Form.Item>
				<Form.Item>
					{getFieldDecorator('subfile', {
						initialValue: this.state.subfile
					})(<Input type="hidden" />)}
				</Form.Item>

			</Form>
		);
	}
}

export default Form.create()(KaraForm);
