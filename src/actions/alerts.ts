// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {AlertTypes} from 'action_types';
import {Alerts} from '../constants';

import {ActionFunc, DispatchFunc, GetStateFunc} from 'mm_types/actions';
import {AlertType} from 'mm_types/alerts';

export function pushNotificationAlert(message: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const notificationAlert: AlertType = {
            type: Alerts.ALERT_NOTIFICATION,
            message,
        };

        dispatch({type: AlertTypes.PUSH_ALERT, data: notificationAlert}, getState);

        return {data: true};
    };
}

export function pushDeveloperAlert(message: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const developerAlert: AlertType = {
            type: Alerts.ALERT_DEVELOPER,
            message,
        };

        dispatch({type: AlertTypes.PUSH_ALERT, data: developerAlert}, getState);

        return {data: true};
    };
}

export function pushErrorAlert(message: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const errorAlert: AlertType = {
            type: Alerts.ALERT_ERROR,
            message,
        };

        dispatch({type: AlertTypes.PUSH_ALERT, data: errorAlert}, getState);

        return {data: true};
    };
}

export function clearLatestAlert(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: AlertTypes.CLEAR_ALERT, data: null}, getState);

        return {data: true};
    };
}

