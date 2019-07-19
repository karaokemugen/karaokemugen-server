import React, { Component } from "react";
import {
	Button,
	Form,
	Icon,
	Input,
	InputNumber,
	message,
	Modal,
	Select,
	Tooltip,
	Upload
} from "antd";
import EditableTagGroup from "./Components/EditableTagGroup";
import axios from "axios/index";
import { getTagInLocale } from "../utils/kara";

interface KaraFormProps {
	form: any;
	translation: any;
}

interface Tag {
	tid: string;
	i18n: any[];
	short: string;
	name: string;
	types: any[];
	misc: any[]
}

interface KaraFormState {
	serieSingersRequired: Boolean;
	subfile: any[];
	mediafile: any[];
	singers: Tag[];
	authors: Tag[];
	misc: Tag[];
	series: any[];
	creators: Tag[];
	songwriters: Tag[];
	groups: Tag[];
	songtypes: Tag;
	langs: Tag[];
	families?: Tag[];
	genres?: Tag[];
	platforms?: Tag[];
	origins?: Tag[],
	created_at?: Date,
	modified_at?: Date,
	songtypesValue: Tag[]
}

class KaraForm extends Component<KaraFormProps, KaraFormState> {
	constructor(props) {
		super(props);
		this.getSongtypes();
		this.state = {
			serieSingersRequired: true,
			subfile: null,
			mediafile: null,
			songtypes: null,
			series: [],
			langs: null,
			singers: null,
			songwriters: null,
			creators: null,
			authors: null,
			misc: null,
			groups: null,
			created_at: null,
			families: null,
			platforms: null,
			genres: null,
			origins: null,
			songtypesValue: null
		};
	}

	getTagArray(value) {
		if (value) {
			return value.map(element => {
				return [element.tid, getTagInLocale(element), element.name]
			});
		} else {
			return [];
		}
	}

	getTagObject(value) {
		if (value) {
			return value.map(element => {
				if (element.length === 3) {
					return { tid: element[0], name: element[2] };
				} else if (element.length === 2) {
					return { tid: element[0], name: element[1] };
				} else {
					return null;
				}
			});
		}
		else {
			return [];
		}
	}

	getSongtypes = async () => {
		const res = await axios.get("/api/karas/tags/3");
		this.setState({ songtypesValue: this.getTagArray(res.data.content) });
	};

	componentDidMount() {
		this.props.form.validateFields();
	}

	handleSubmit = e => {
		e.preventDefault();
		const t = this.props.translation;
		this.props.form.validateFields((err, values) => {
			if (!err) {
				var kara = values;
				kara.singers = this.getTagObject(kara.singers);
				kara.authors = this.getTagObject(kara.authors);
				kara.misc = this.getTagObject(kara.misc);
				kara.creators = this.getTagObject(kara.creators);
				kara.songwriters = this.getTagObject(kara.songwriters);
				kara.groups = this.getTagObject(kara.groups);
				kara.langs = this.getTagObject(kara.langs);
				kara.families = this.getTagObject(kara.families);
				kara.platforms = this.getTagObject(kara.platforms);
				kara.genres = this.getTagObject(kara.genres);
				kara.origins = this.getTagObject(kara.origins);
				kara.songtypes = this.getTagObject(this.state.songtypesValue).filter(value => values.songtypes === value.tid);
				axios.post('/api/karas/', kara).then((response) => {
					Modal.success({
						title: t('ADD_SUCCESS'),
						content: <div><label>{t('ADD_SUCCESS_DESCRIPTION')}</label><a href={response.data}>{response.data}</a></div>,
					});
					this.setState({
						subfile: [],
						mediafile: []
					});
				})
					.catch((error) => {
						Modal.error({
							title: t('ADD_ERROR'),
							content: error.response.data,
						});
					});
			};
		});
	};

	isMediaFile = filename => {
		return new RegExp("^.+\\.(avi|mkv|mp4|webm|mov|wmv|mpg|ogg|m4a|mp3)$").test(
			filename
		);
	};

	onMediaUploadChange = info => {
		let fileList = info.fileList;
		fileList = fileList.slice(-1);
		this.setState({ mediafile: fileList });
		if (info.file.status === "uploading") {
			this.props.form.setFieldsValue({ mediafile: null, mediafile_orig: null });
		} else if (info.file.status === "done") {
			if (this.isMediaFile(info.file.name)) {
				this.props.form.setFieldsValue({
					mediafile: info.file.response.filename,
					mediafile_orig: info.file.response.originalname
				});
				message.success(this.props.translation('KARA.ADD_FILE_SUCCESS', { name: info.file.name }));
			} else {
				this.props.form.setFieldsValue({ mediafile: null });
				message.error(this.props.translation('KARA.ADD_FILE_MEDIA_ERROR', { name: info.file.name }));
				info.file.status = "error";
				this.setState({ mediafile: [] });
			}
		} else if (info.file.status === "error") {
			this.props.form.setFieldsValue({ mediafile: null, mediafile_orig: null });
			this.setState({ mediafile: [] });
		}
	};

	onSubUploadChange = info => {
		let fileList = info.fileList;
		fileList = fileList.slice(-1);
		this.setState({ subfile: fileList });
		if (info.file.status === "uploading") {
			this.props.form.setFieldsValue({ subfile: null, subfile_orig: null });
		} else if (info.file.status === "done") {
			if (info.file.name.endsWith(".ass")) {
				this.props.form.setFieldsValue({
					subfile: info.file.response.filename,
					subfile_orig: info.file.response.originalname
				});
				message.success(this.props.translation('KARA.ADD_FILE_SUCCESS', { name: info.file.name }));
			} else {
				this.props.form.setFieldsValue({ subfile: null, subfile_orig: null });
				message.error(this.props.translation('KARA.ADD_FILE_LYRICS_ERROR', { name: info.file.name }));
				info.file.status = "error";
				this.setState({ subfile: [] });
			}
		} else if (info.file.status === "error") {
			this.props.form.setFieldsValue({ subfile: null });
			this.setState({ subfile: [] });
		}
	};

	onChangeSingersSeries = (tags) => {
		this.setState({serieSingersRequired: (!tags || tags.length === 0)}, () => {
			this.props.form.validateFields(['series'], { force: true });
			this.props.form.validateFields(['singers'], { force: true });
		});
	}

	render() {
		const { getFieldDecorator } = this.props.form;
		const t = this.props.translation;

		return (
			<Form onSubmit={this.handleSubmit} className="kara-form">
				<Form.Item
					hasFeedback
					label={
						<span>{t('KARA.MEDIA_FILE')}&nbsp;
							<Tooltip title={t('KARA.MEDIA_FILE_TOOLTIP')}>
								<Icon type="question-circle-o" />
							</Tooltip>
						</span>
					}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 6, offset: 0 }}
				>
					<Upload
						action='/api/karas/importfile'
						accept='video/*,audio/*'
						multiple={false}
						onChange={this.onMediaUploadChange}
						fileList={this.state.mediafile}
					>
						<Button>
							<Icon type="upload" />{t('KARA.MEDIA_FILE')}
						</Button>
					</Upload>
				</Form.Item>
				<Form.Item
					label={
						<span>{t('KARA.LYRICS_FILE')}&nbsp;
							<Tooltip title={t('KARA.LYRICS_FILE_TOOLTIP')}>
								<Icon type="question-circle-o" />
							</Tooltip>
						</span>
					}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 6, offset: 0 }}
				>
					<Upload
						action='/api/karas/importfile'
						multiple={false}
						onChange={this.onSubUploadChange}
						fileList={this.state.subfile}
					>
						<Button>
							<Icon type="upload" />{t('KARA.LYRICS_FILE')}
						</Button>
					</Upload>
				</Form.Item>
				<Form.Item
					hasFeedback
					label={
						<span>{t('KARA.TITLE')}&nbsp;
							<Tooltip title={t('KARA.TITLE_TOOLTIP')}>
								<Icon type="question-circle-o" />
							</Tooltip>
						</span>
					}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 8, offset: 0 }}
				>
					{getFieldDecorator("title", {
						initialValue: null,
						rules: [{
							required: true,
							message: t('KARA.TITLE_REQUIRED')
						}],
					})(<Input
						placeholder={t('KARA.TITLE')}
					/>)}
				</Form.Item>

				<Form.Item
					hasFeedback
					label={
						<span>{t('KARA.SERIES')}&nbsp;
							<Tooltip title={t('KARA.SERIES_TOOLTIP')}>
								<Icon type="question-circle-o" />
							</Tooltip>
						</span>
					}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 14, offset: 0 }}
				>
					{getFieldDecorator("series", {
						initialValue: this.state.series,
						rules: [{
							required: this.state.serieSingersRequired,
							message: t('KARA.SERIES_SINGERS_REQUIRED')
						}]
					})(
						<EditableTagGroup
							search={"serie"}
							onChange={tags => {
								this.props.form.setFieldsValue({ series: tags });
								this.onChangeSingersSeries(tags);
							}
							}
							translation={t}
						/>)}
				</Form.Item>
				{this.state.songtypesValue ?
					<Form.Item
						label={t('KARA.TYPE')}
						labelCol={{ span: 3 }}
						wrapperCol={{ span: 3, offset: 0 }}
					>

						{getFieldDecorator("songtypes", {
							rules: [{
								required: true,
								message: t('KARA.TYPE_REQUIRED')
							}],
							initialValue: null
						})(

							<Select placeholder={"Song type"}>
								{this.state.songtypesValue.map(type => {
									return <Select.Option key={type[0]} value={type[0]}>{type[1]}</Select.Option>
								})
								}
							</Select>
						)}
					</Form.Item> : null
				}

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
						initialValue: null
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
					{getFieldDecorator('langs', {
						rules: [{
							required: true,
							message: t('KARA.LANGUAGES_REQUIRED')
						}],
						initialValue: this.state.langs
					})(<EditableTagGroup
						tagType={5}
						search={'tag'}
						onChange={(tags) => this.props.form.setFieldsValue({ langs: tags })}
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
						initialValue: 2010,
						rules: [{ required: true }]
					})(<InputNumber
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
					{getFieldDecorator('singers', {
						initialValue: this.state.singers,
						rules: [{
							required: this.state.serieSingersRequired,
							message: t('KARA.SERIES_SINGERS_REQUIRED')
						}]
					})(<EditableTagGroup
						tagType={2}
						search={'tag'}
						onChange={(tags) => {
							this.props.form.setFieldsValue({ singer: tags });
							this.onChangeSingersSeries(tags);
						}
						}
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
					{getFieldDecorator('songwriters', {
						initialValue: this.state.songwriters
					})(<EditableTagGroup
						tagType={8}
						search={'tag'}
						onChange={(tags) => this.props.form.setFieldsValue({ songwriters: tags })}
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
					{getFieldDecorator('creators', {
						initialValue: this.state.creators
					})(<EditableTagGroup
						tagType={4}
						search={'tag'}
						onChange={(tags) => this.props.form.setFieldsValue({ creators: tags })}
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
					{getFieldDecorator('authors', {
						initialValue: this.state.authors
					})(<EditableTagGroup
						tagType={6}
						search={'tag'}
						onChange={(tags) => this.props.form.setFieldsValue({ author: tags })}
						translation={t}
					/>)}
				</Form.Item>
				<Form.Item
					label={(
						<span>{t('KARA.FAMILIES')}&nbsp;
							<Tooltip title={(<a href="http://docs.karaokes.moe/fr/contrib-guide/references/#tags">See tag list</a>)}>
								<Icon type="question-circle-o" />
							</Tooltip>
						</span>
					)}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 10, offset: 0 }}
				>
					{getFieldDecorator('families', {
						initialValue: this.state.families
					})(<EditableTagGroup
						tagType={10}
						checkboxes={true}
						search={'tag'}
						onChange={(tags) => this.props.form.setFieldsValue({ families: tags })}
						translation={t}
					/>)}
				</Form.Item>
				<Form.Item
					label={(
						<span>{t('KARA.PLATFORMS')}&nbsp;
							<Tooltip title={(<a href="http://docs.karaokes.moe/fr/contrib-guide/references/#tags">See tag list</a>)}>
								<Icon type="question-circle-o" />
							</Tooltip>
						</span>
					)}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 10, offset: 0 }}
				>
					{getFieldDecorator('platforms', {
						initialValue: this.state.platforms
					})(<EditableTagGroup
						tagType={13}
						checkboxes={true}
						search={'tag'}
						onChange={(tags) => this.props.form.setFieldsValue({ platforms: tags })}
						translation={t}
					/>)}
				</Form.Item>
				<Form.Item
					label={(
						<span>{t('KARA.GENRES')}&nbsp;
							<Tooltip title={(<a href="http://docs.karaokes.moe/fr/contrib-guide/references/#tags">See tag list</a>)}>
								<Icon type="question-circle-o" />
							</Tooltip>
						</span>
					)}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 10, offset: 0 }}
				>
					{getFieldDecorator('genres', {
						initialValue: this.state.genres
					})(<EditableTagGroup
						tagType={12}
						checkboxes={true}
						search={'tag'}
						onChange={(tags) => this.props.form.setFieldsValue({ genres: tags })}
						translation={t}
					/>)}
				</Form.Item>
				<Form.Item
					label={(
						<span>{t('KARA.ORIGINS')}&nbsp;
							<Tooltip title={(<a href="http://docs.karaokes.moe/fr/contrib-guide/references/#tags">See tag list</a>)}>
								<Icon type="question-circle-o" />
							</Tooltip>
						</span>
					)}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 10, offset: 0 }}
				>
					{getFieldDecorator('origins', {
						initialValue: this.state.origins
					})(<EditableTagGroup
						tagType={11}
						checkboxes={true}
						search={'tag'}
						onChange={(tags) => this.props.form.setFieldsValue({ origins: tags })}
						translation={t}
					/>)}
				</Form.Item>
				<Form.Item
					label={(
						<span>{t('KARA.MISC')}&nbsp;
							<Tooltip title={(<a href="http://docs.karaokes.moe/fr/contrib-guide/references/#tags">See tag list</a>)}>
								<Icon type="question-circle-o" />
							</Tooltip>
						</span>
					)}
					labelCol={{ span: 3 }}
					wrapperCol={{ span: 10, offset: 0 }}
				>
					{getFieldDecorator('misc', {
						initialValue: this.state.misc
					})(<EditableTagGroup
						tagType={7}
						checkboxes={true}
						search={'tag'}
						onChange={(tags) => this.props.form.setFieldsValue({ misc: tags })}
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
						onChange={(tags) => this.props.form.setFieldsValue({ groups: tags })}
						translation={t}
					/>)}
				</Form.Item>
				<Form.Item
					wrapperCol={{ span: 8, offset: 1 }}
				>
					<Button type='primary' htmlType='submit' className='login-form-button'>{t('SUBMIT')}</Button>
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

const cmp: any = Form.create()(KaraForm);
export default cmp;