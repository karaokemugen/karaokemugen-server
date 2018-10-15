import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { connectRouter, routerMiddleware } from 'connected-react-router';
import createHistory from 'history/createBrowserHistory';

import navigation from './reducers/navigation';
import auth from './reducers/auth';

const initialState = {};

export const history = createHistory();

const middleware = [
	applyMiddleware(routerMiddleware(history))
];

export const store = createStore(
	connectRouter(history)(combineReducers({ navigation, auth })),
	initialState,
	compose(...middleware)
);
