// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';
import {PostTypes, PreferenceTypes, SearchTypes, UserTypes} from 'action_types';
import {Preferences} from 'constants';

function results(state = [], action) {
    switch (action.type) {
    case SearchTypes.RECEIVED_SEARCH_POSTS: {
        if (action.isGettingMore) {
            return [...new Set(state.concat(action.data.order))];
        }
        return action.data.order;
    }
    case PostTypes.REMOVE_POST: {
        const postId = action.data ? action.data.id : null;
        const index = state.indexOf(postId);
        if (index !== -1) {
            const newState = [...state];
            newState.splice(index, 1);
            return newState;
        }
        return state;
    }
    case SearchTypes.REMOVE_SEARCH_POSTS:
    case UserTypes.LOGOUT_SUCCESS:
        return [];

    default:
        return state;
    }
}

function matches(state = {}, action) {
    switch (action.type) {
    case SearchTypes.RECEIVED_SEARCH_POSTS:
        if (action.isGettingMore) {
            return Object.assign({}, state, action.data.matches);
        }
        return action.data.matches || {};
    case PostTypes.REMOVE_POST: {
        if (!state[action.data.id]) {
            return state;
        }

        const newState = {...state};
        Reflect.deleteProperty(newState, action.data.id);
        return newState;
    }
    case SearchTypes.REMOVE_SEARCH_POSTS:
    case UserTypes.LOGOUT_SUCCESS:
        return [];

    default:
        return state;
    }
}

function flagged(state = [], action) {
    switch (action.type) {
    case SearchTypes.RECEIVED_SEARCH_FLAGGED_POSTS: {
        return action.data.order;
    }
    case PostTypes.REMOVE_POST: {
        const postId = action.data ? action.data.id : null;
        const index = state.indexOf(postId);
        if (index !== -1) {
            const newState = [...state];
            newState.splice(index, 1);
            return newState;
        }
        return state;
    }
    case PreferenceTypes.RECEIVED_PREFERENCES: {
        if (action.data) {
            const nextState = [...state];
            let hasNewFlaggedPosts = false;
            action.data.forEach((pref) => {
                if (pref.category === Preferences.CATEGORY_FLAGGED_POST) {
                    const exists = nextState.find((p) => p === pref.name);
                    if (!exists) {
                        hasNewFlaggedPosts = true;
                        nextState.unshift(pref.name);
                    }
                }
            });

            return hasNewFlaggedPosts ? nextState : state;
        }

        return state;
    }
    case PreferenceTypes.DELETED_PREFERENCES: {
        if (action.data) {
            const nextState = [...state];
            let flaggedPostsRemoved = false;
            action.data.forEach((pref) => {
                if (pref.category === Preferences.CATEGORY_FLAGGED_POST) {
                    const index = state.indexOf(pref.name);
                    if (index !== -1) {
                        flaggedPostsRemoved = true;
                        nextState.splice(index, 1);
                    }
                }
            });

            return flaggedPostsRemoved ? nextState : state;
        }

        return state;
    }
    case SearchTypes.REMOVE_SEARCH_POSTS:
    case UserTypes.LOGOUT_SUCCESS:
        return [];

    default:
        return state;
    }
}

function recent(state = {}, action) {
    const {data, type} = action;

    switch (type) {
    case SearchTypes.RECEIVED_SEARCH_TERM: {
        const nextState = {...state};
        const {teamId, params} = data;
        const {terms, isOrSearch} = params || {};
        const team = [...(nextState[teamId] || [])];
        const index = team.findIndex((r) => r.terms === terms);
        if (index === -1) {
            team.push({terms, isOrSearch});
        } else {
            team[index] = {terms, isOrSearch};
        }
        return {
            ...nextState,
            [teamId]: team,
        };
    }
    case SearchTypes.REMOVE_SEARCH_TERM: {
        const nextState = {...state};
        const {teamId, terms} = data;
        const team = [...(nextState[teamId] || [])];
        const index = team.findIndex((r) => r.terms === terms);

        if (index !== -1) {
            team.splice(index, 1);

            return {
                ...nextState,
                [teamId]: team,
            };
        }

        return nextState;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function current(state = {}, action) {
    const {data, type} = action;
    switch (type) {
    case SearchTypes.RECEIVED_SEARCH_TERM: {
        const nextState = {...state};
        const {teamId, params, isEnd} = data;
        return {
            ...nextState,
            [teamId]: {
                params,
                isEnd,
            },
        };
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function isSearchingTerm(state = false, action) {
    switch (action.type) {
    case SearchTypes.SEARCH_POSTS_REQUEST:
        return !action.isGettingMore;
    case SearchTypes.SEARCH_POSTS_FAILURE:
    case SearchTypes.SEARCH_POSTS_SUCCESS:
        return false;
    default:
        return state;
    }
}

function isSearchGettingMore(state = false, action) {
    switch (action.type) {
    case SearchTypes.SEARCH_POSTS_REQUEST:
        return action.isGettingMore;
    case SearchTypes.SEARCH_POSTS_FAILURE:
    case SearchTypes.SEARCH_POSTS_SUCCESS:
        return false;
    default:
        return state;
    }
}

function rhsState(state = null, action) {
    switch (action.type) {
    case SearchTypes.UPDATE_RHS_STATE:
        return action.state;

    // May be needed later when additional search actions are migrated to redux
    // case ActionTypes.SELECT_POST:
    //     return null;

    default:
        return state;
    }
}

export default combineReducers({

    // An ordered array with posts ids of flagged posts
    flagged,

    // An ordered array with posts ids from the search results
    results,

    // Object where every key is a post id mapping to an array of matched words in that post
    matches,

    // Object where every key is a team composed with
    // an object where the key is the term and the value indicates is "or" search
    recent,

    // Object holding the current searches for every team
    current,

    // Boolean true if we are are searching initally
    isSearchingTerm,

    // Boolean true if we are getting more search results
    isSearchGettingMore,

    // String/constant that state of RHS window
    rhsState,
});
