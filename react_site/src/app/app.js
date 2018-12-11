// The basics
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withRouter } from 'react-router';

// Action creators and helpers
import { establishCurrentUser } from '../modules/auth';
import { setCurrentLocale, establishCurrentLocale } from '../modules/i18n';
import { setKaras, establishKaras } from '../modules/karas';
import { isServer } from '../store';

import i18next from 'i18next';
import { Layout, Spin } from 'antd';

import Page from './components/page';
import logo from './assets/logo.png';
import Navigation from './navigation';
import Routes from './routes';

import KaraDownloader from './components/km/karaDownloader';

const { Content } = Layout;

class App extends Component {

  constructor(props){
    super(props);
    this.state = {
      karas:null,
    }

    this.onKaraReady = this.onKaraReady.bind(this);
  }

  componentWillMount() {
    if (!isServer) {
      this.props.establishCurrentUser();
      this.props.establishCurrentLocale();
      this.props.establishKaras();
    }
  }

  onKaraReady(karas) {
    this.props.setKaras(karas)
    this.setState({karas:karas});
  }

  setLocale(locale) {
    this.props.setCurrentLocale(locale);
  }

  render() {
    var karas_hash = this.state.karas ? this.state.karas.karas_hash : null;
    var karas_list = this.state.karas ? this.state.karas.list : null;
    //console.log(this.props.currentLocale)

    if(karas_hash!==null && karas_list!=null && karas_list.length>0)
    {
      return (
        <div id="app">
            <Navigation
              isAuthenticated={this.props.isAuthenticated}
              currentPath={this.props.location.pathname}
              currentLocale={this.props.currentLocale}
              setLocale={this.setLocale.bind(this)}/>
            <main id="content">
              <Routes karas={this.state.karas} />
            </main>
        </div>
      );
    }
    else
    {
      return (
        <div id="app">
          <Page id="loader" title={i18next.t("page.loader_title")}>
            <KaraDownloader onKaraReady={this.onKaraReady} />
          </Page>
        </div>
      );
    }
  }
}

const mapStateToProps = state => {
  return {
    isAuthenticated: state.auth.isAuthenticated,
    currentLocale: state.i18n.currentLocale,
    karas: state.karas.database,
  }
};

const mapDispatchToProps = dispatch =>
  bindActionCreators({ setCurrentLocale, establishCurrentLocale, establishCurrentUser, setKaras, establishKaras }, dispatch);

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(App)
);
