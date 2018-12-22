import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import Page from '../../components/page';
import {Layout, Tag, Button} from 'antd';
import i18next from 'i18next';
import normalizeString from '../../components/normalizeString';
import fecha from 'fecha';

import languagesConverter from '@cospired/i18n-iso-languages';
languagesConverter.registerLocale(require("@cospired/i18n-iso-languages/langs/en.json"));
languagesConverter.registerLocale(require("@cospired/i18n-iso-languages/langs/fr.json"));

class RouteComponent extends Component {
  constructor(props){
    super(props);
    this.state = {
      kara: null,
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if(this.getKidFromProps(nextProps)!==this.getKidFromProps(this.props))
    {
      var kid = this.getKidFromProps(nextProps);
      this.updateKara(kid);
    }
  }

  componentDidMount() {
    var kid = this.getKidFromProps(this.props);
    this.updateKara(kid);
  }

  getKidFromProps(props) {
    return props.match.params && props.match.params.kid ? props.match.params.kid : null;
  }

  updateKara(kid) {
      var  kara = null
      var karas = this.props.karas.list;
      for(let i=0; i<karas.length; i++)
      {
        if(karas[i].kid==kid)
        {
          kara = karas[i]
          break;
        }
      };
      this.setState({kara: kara});
  }

  renderComaSeparatedItems(items) {
    if(items.length<=1)
      return items;

    let r = []
    for(let i=0; i<items.length-1; i++)
    {
      r.push(items[i]);
      r.push(<span key={"coma_"+i}>, </span>);
    }
    r.push(items[items.length-1]);
    return r;
  }

  render() {
    console.log(this.state);
    let kara = this.state.kara;
    if(!kara)
      return null;

    let instance_url = this.props.karas.instance_url;

    return (
      <Page id="karaDetail">
        <section className="content">
          <Button className="back" onClick={function(){window.history.go(-1)}}>Back</Button>
          <h1>{kara.title}</h1>
          <p>
            {
              this.renderComaSeparatedItems(kara.songtype.split(',').map( (t,ti) => {
                t = t.toLowerCase();
                return <Link key={ti} to={process.env.PUBLIC_URL+"/kara/songtype/"+t.replace('type_','')}><Tag>{i18next.t('map:'+t.replace('type_','type.'))}</Tag></Link>
              }))
            }
          </p>
          {
            (kara.mediafile.indexOf('.mp4')>=0 && kara.misc.indexOf('TAG_R18') < 0) ? (
              <div>
                <h3>{i18next.t("karadetail.sing_now")}</h3>
                <p>{i18next.t("karadetail.live_version_available")} <a target="_blank" href={"http://live.karaokes.moe/?video="+kara.kid}>{i18next.t("karadetail.test_this_kara_on_your_browser")}</a></p>
              </div>
            ) : null
          }

          <h3>{i18next.t("karadetail.informations")}</h3>
          <ul>
            <li>
                <b>{i18next.t("kara.language")}{i18next.t("syntax.colon")}</b>
                {
                  this.renderComaSeparatedItems(kara.language.split(',').map((t,ti) => {
                    return <Link key={ti} to={process.env.PUBLIC_URL+"/kara/language/"+t}>{languagesConverter.getName(kara.language,this.props.currentLocale)}</Link>
                  }))
                }
            </li>
            <li>
                <b>{i18next.t("kara.tag_plural")}{i18next.t("syntax.colon")} </b>
                {
                  this.renderComaSeparatedItems(kara.misc.split(',').map( (t,ti) => {
                    t = t.toLowerCase();
                    return <Link key={ti} to={process.env.PUBLIC_URL+"/kara/tag/"+t.replace('tag_','')}>{i18next.t('map:'+t.replace('tag_','tag.'))}</Link>
                  }))
                }
            </li>
            <li>
                <b>{i18next.t("kara.serie")}{i18next.t("syntax.colon")} </b>
                <Link to={process.env.PUBLIC_URL+"/kara/serie/"+kara.serie_normalized}>{kara.serie}</Link>
            </li>
            <li>
                <b>{i18next.t("kara.year")}{i18next.t("syntax.colon")} </b>
                <Link to={process.env.PUBLIC_URL+"/kara/year/"+kara.year}>{kara.year}</Link>
            </li>
            <li>
                <b>{i18next.t("kara.singer_plural")}{i18next.t("syntax.colon")} </b>
                {
                  this.renderComaSeparatedItems(kara.singer.split(',').map( (t,ti) => {
                    return <Link key={ti} to={process.env.PUBLIC_URL+"/kara/singer/"+normalizeString(t)}>{t}</Link>
                  }))
                }
            </li>
            <li>
                <b>{i18next.t("kara.songwriter_plural")}{i18next.t("syntax.colon")} </b>
                {
                  this.renderComaSeparatedItems(kara.songwriter.split(',').map( (t,ti) => {
                    return <Link key={ti} to={process.env.PUBLIC_URL+"/kara/songwriter/"+normalizeString(t)}>{t}</Link>
                  }))
                }
            </li>
            <li>
                <b>{i18next.t("kara.creator_plural")}{i18next.t("syntax.colon")} </b>
                {
                  this.renderComaSeparatedItems(kara.creator.split(',').map( (t,ti) => {
                    return <Link key={ti} to={process.env.PUBLIC_URL+"/kara/creator/"+normalizeString(t)}>{t}</Link>
                  }))
                }
            </li>
            <li>
                <b>{i18next.t("kara.author")}{i18next.t("syntax.colon")} </b>
                {
                  this.renderComaSeparatedItems(kara.author.split(',').map( (t,ti) => {
                    return <Link key={ti} to={process.env.PUBLIC_URL+"/kara/author/"+normalizeString(t)}>{t}</Link>
                  }))
                }
            </li>
            <li>
                <b>{i18next.t("kara.duration")}{i18next.t("syntax.colon")} </b>
                {Math.floor(kara.duration/60)+'m '+(kara.duration%60)+'s'}
            </li>
            <li>
                <b>{i18next.t("kara.creation_date")}{i18next.t("syntax.colon")} </b>
                {fecha.format(Date.parse(kara.created_at),'YYYY-MM-DD')}
            </li>
            <li>
                <b>{i18next.t("kara.last_update")}{i18next.t("syntax.colon")} </b>
                {fecha.format(Date.parse(kara.modified_at),'YYYY-MM-DD')}
            </li>
            <li>
                <b>{i18next.t("kara.kid")}{i18next.t("syntax.colon")} </b>
                {kara.kid}
            </li>
            <li>
                <b>{i18next.t("kara.subfile")}{i18next.t("syntax.colon")} </b>
                <a href={instance_url+"/downloads/lyrics/"+encodeURI(kara.subfile)}>{kara.subfile}</a>
            </li>
            <li>
                <b>{i18next.t("kara.mediafile")}{i18next.t("syntax.colon")} </b>
                <a href={instance_url+"/downloads/medias/"+encodeURI(kara.mediafile)}>{kara.mediafile}</a>
                {' ('+Math.round(kara.mediasize/(1024*1024))+' Mo)'}
            </li>
            <li>
                <b>{i18next.t("kara.karafile")}{i18next.t("syntax.colon")} </b>
                <a href={instance_url+"/downloads/karas/"+encodeURI(kara.karafile)}>{kara.karafile}</a>
            </li>
            <li>
              <b>{i18next.t("kara.seriefiles")}{i18next.t("syntax.colon")} </b>
              {
              kara.seriefiles.map(function(t,ti){
                return (
                    <a key={ti} href={instance_url+"/downloads/series/"+encodeURI(t)}>{t}</a>
                  )
                })
              }
            </li>
          </ul>
        </section>

        <section className="media">
          <img key="25" src={instance_url+"/previews/"+kara.kid+"."+kara.mediasize+".25.jpg"} />
          <img key="33" src={instance_url+"/previews/"+kara.kid+"."+kara.mediasize+".33.jpg"} />
          <img key="50" src={instance_url+"/previews/"+kara.kid+"."+kara.mediasize+".50.jpg"} />
        </section>

        <section className="issue">
          <h3>{i18next.t("karadetail.an_issue")}</h3>
          <p>{i18next.t("karadetail.an_issue_in_this_kara_let_us_now")}</p>
          <p>
            <a href={"https://lab.shelter.moe/karaokemugen/karaokebase/issues/new?issuable_template=bad_time&issue[title]="+normalizeString(kara.title)}>{i18next.t("karadetail.bad_time")}</a> {i18next.t("karadetail.bad_time_eg")}<br />
            <a href={"https://lab.shelter.moe/karaokemugen/karaokebase/issues/new?issuable_template=bad_quality&issue[title]="+normalizeString(kara.title)}>{i18next.t("karadetail.bad_quality")}</a> {i18next.t("karadetail.bad_quality_eg")}
          </p>
        </section>
      </Page>
    );
  }
}

const mapStateToProps = state => {
  return {
    karas: state.karas.database,
    currentLocale: state.i18n.currentLocale
  }
};

export default connect(
  mapStateToProps,
  null
)(RouteComponent);