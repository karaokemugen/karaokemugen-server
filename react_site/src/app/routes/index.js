// Chunkable routes declaration - Server Rendering Compliant 🦄
import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import AuthenticatedRoute from '../components/authenticated-route';
import UnauthenticatedRoute from '../components/unauthenticated-route';
import Loadable from 'react-loadable';

import NotFound from './not-found';

const Homepage = Loadable({
  loader: () => import(/* webpackChunkName: "homepage" */ './homepage'),
  loading: () => null,
  modules: ['homepage']
});

const KaraIndex = Loadable({
  loader: () => import(/* webpackChunkName: "kara-index" */ './kara'),
  loading: () => null,
  modules: ['kara/index']
});

const KaraSinger = Loadable({
  loader: () => import(/* webpackChunkName: "kara-singer" */ './kara/singer'),
  loading: () => null,
  modules: ['kara/singer']
});

const KaraLanguage = Loadable({
  loader: () => import(/* webpackChunkName: "kara-language" */ './kara/language'),
  loading: () => null,
  modules: ['kara/language']
});
const KaraSongwriter = Loadable({
  loader: () => import(/* webpackChunkName: "kara-songwriter" */ './kara/songwriter'),
  loading: () => null,
  modules: ['kara/songwriter']
});
const KaraAuthor = Loadable({
  loader: () => import(/* webpackChunkName: "kara-author" */ './kara/author'),
  loading: () => null,
  modules: ['kara/author']
});
const KaraCreator = Loadable({
  loader: () => import(/* webpackChunkName: "kara-creator" */ './kara/creator'),
  loading: () => null,
  modules: ['kara/creator']
});

const KaraSerie = Loadable({
  loader: () => import(/* webpackChunkName: "kara-serie" */ './kara/serie'),
  loading: () => null,
  modules: ['kara/serie']
});

const KaraDetail = Loadable({
  loader: () => import(/* webpackChunkName: "kara-detail" */ './kara/detail'),
  loading: () => null,
  modules: ['kara/detail']
});

const Private = Loadable({
  loader: () => import(/* webpackChunkName: "private" */ './private'),
  loading: () => null,
  modules: ['private']
});

const Login = Loadable({
  loader: () => import(/* webpackChunkName: "login" */ './login'),
  loading: () => null,
  modules: ['login']
});

const Logout = Loadable({
  loader: () => import(/* webpackChunkName: "logout" */ './logout'),
  loading: () => null,
  modules: ['logout']
});


class Bootstrap extends Component {

  render() {
    return (
      <Switch basename={process.env.PUBLIC_URL}>
        <Route exact path={process.env.PUBLIC_URL+"/"} component={Homepage} />
        <Route exact path={process.env.PUBLIC_URL+"/kara"} component={KaraIndex} />
        <Route exact path={process.env.PUBLIC_URL+"/kara/singer"} component={KaraSinger} />
        <Route exact path={process.env.PUBLIC_URL+"/kara/language"} component={KaraLanguage} />
        <Route exact path={process.env.PUBLIC_URL+"/kara/songwriter"} component={KaraSongwriter} />
        <Route exact path={process.env.PUBLIC_URL+"/kara/author"} component={KaraAuthor} />
        <Route exact path={process.env.PUBLIC_URL+"/kara/creator"} component={KaraCreator} />
        <Route exact path={process.env.PUBLIC_URL+"/kara/serie"} component={KaraSerie} />
        <Route exact path={process.env.PUBLIC_URL+"/kara/tag/:tag"} component={KaraIndex} />
        <Route exact path={process.env.PUBLIC_URL+"/kara/songtype/:songtype"} component={KaraIndex} />
        <Route exact path={process.env.PUBLIC_URL+"/kara/singer/:singer"} component={KaraIndex} />
        <Route exact path={process.env.PUBLIC_URL+"/kara/language/:language"} component={KaraIndex} />
        <Route exact path={process.env.PUBLIC_URL+"/kara/songwriter/:songwriter"} component={KaraIndex} />
        <Route exact path={process.env.PUBLIC_URL+"/kara/author/:author"} component={KaraIndex} />
        <Route exact path={process.env.PUBLIC_URL+"/kara/creator/:creator"} component={KaraIndex} />
        <Route exact path={process.env.PUBLIC_URL+"/kara/serie/:serie"} component={KaraIndex} />
        <Route exact path={process.env.PUBLIC_URL+"/kara/year/:year"} component={KaraIndex} />
        <Route exact path={process.env.PUBLIC_URL+"/kara/:kid"} component={KaraDetail} />
        <UnauthenticatedRoute exact path={process.env.PUBLIC_URL+"/login"} component={Login} />
        <AuthenticatedRoute exact path={process.env.PUBLIC_URL+"/logout"} component={Logout} />
        <AuthenticatedRoute exact path={process.env.PUBLIC_URL+"/private"} component={Private} />
        <Route component={NotFound} />
      </Switch>
    );
  }
}

export default Bootstrap;