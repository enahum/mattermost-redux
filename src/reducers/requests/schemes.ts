// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {combineReducers} from 'redux';
import {SchemeTypes} from 'action_types';

import {GenericAction} from 'mm_types/actions';
import {SchemesRequestsStatuses, RequestStatusType} from 'mm_types/requests';

import {handleRequest, initialRequestState} from './helpers';

function getSchemes(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        SchemeTypes.GET_SCHEMES_REQUEST,
        SchemeTypes.GET_SCHEMES_SUCCESS,
        SchemeTypes.GET_SCHEMES_FAILURE,
        state,
        action
    );
}

function getScheme(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        SchemeTypes.GET_SCHEME_REQUEST,
        SchemeTypes.GET_SCHEME_SUCCESS,
        SchemeTypes.GET_SCHEME_FAILURE,
        state,
        action
    );
}

function createScheme(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        SchemeTypes.CREATE_SCHEME_REQUEST,
        SchemeTypes.CREATE_SCHEME_SUCCESS,
        SchemeTypes.CREATE_SCHEME_FAILURE,
        state,
        action
    );
}

function deleteScheme(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        SchemeTypes.DELETE_SCHEME_REQUEST,
        SchemeTypes.DELETE_SCHEME_SUCCESS,
        SchemeTypes.DELETE_SCHEME_FAILURE,
        state,
        action
    );
}

function patchScheme(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        SchemeTypes.PATCH_SCHEME_REQUEST,
        SchemeTypes.PATCH_SCHEME_SUCCESS,
        SchemeTypes.PATCH_SCHEME_FAILURE,
        state,
        action
    );
}

function getSchemeTeams(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        SchemeTypes.GET_SCHEME_TEAMS_REQUEST,
        SchemeTypes.GET_SCHEME_TEAMS_SUCCESS,
        SchemeTypes.GET_SCHEME_TEAMS_FAILURE,
        state,
        action
    );
}

function getSchemeChannels(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        SchemeTypes.GET_SCHEME_CHANNELS_REQUEST,
        SchemeTypes.GET_SCHEME_CHANNELS_SUCCESS,
        SchemeTypes.GET_SCHEME_CHANNELS_FAILURE,
        state,
        action
    );
}

export default (combineReducers({
    getSchemes,
    getScheme,
    createScheme,
    deleteScheme,
    patchScheme,
    getSchemeTeams,
    getSchemeChannels,
}) as (b: SchemesRequestsStatuses, a: GenericAction) => SchemesRequestsStatuses);
