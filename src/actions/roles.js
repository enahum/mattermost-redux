// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow
import {Client4} from 'client';
import {RoleTypes} from 'action_types';

import {getRoles} from 'selectors/entities/roles';
import {hasNewPermissions} from 'selectors/entities/general';

import {bindClientFunc} from './helpers';
import type {DispatchFunc, GetStateFunc, ActionFunc} from 'types/actions';
import type {Role} from 'types/roles';

export function getRolesByNames(rolesNames: Array<string>) {
    return bindClientFunc({
        clientFunc: Client4.getRolesByNames,
        params: [
            rolesNames,
        ],
    });
}

export function getRoleByName(roleName: string) {
    return bindClientFunc({
        clientFunc: Client4.getRoleByName,
        onRequest: RoleTypes.ROLE_BY_NAME_REQUEST,
        onSuccess: [RoleTypes.RECEIVED_ROLE, RoleTypes.ROLE_BY_NAME_SUCCESS],
        onFailure: RoleTypes.ROLE_BY_NAME_FAILURE,
        params: [
            roleName,
        ],
    });

export function getRole(roleId) {
    return bindClientFunc(
        Client4.getRole,
        RoleTypes.ROLE_BY_ID_REQUEST,
        [RoleTypes.RECEIVED_ROLE, RoleTypes.ROLE_BY_ID_SUCCESS],
        RoleTypes.ROLE_BY_ID_FAILURE,
        roleId
    );
}    

export function setPendingRoles(roles: Array<string>) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: RoleTypes.SET_PENDING_ROLES, data: roles}, getState);
        return {data: roles};
    };
}

export function loadRolesIfNeeded(roles: Iterable<string>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        let pendingRoles = new Set();
        try {
            pendingRoles = new Set(state.entities.roles.pending);
        } catch (e) {
            // eslint-disable-line
        }
        for (const role of roles) {
            pendingRoles.add(role);
        }
        if (!state.entities.general.serverVersion) {
            setPendingRoles(Array.from(pendingRoles))(dispatch, getState);
            setTimeout(() => dispatch(loadRolesIfNeeded([])), 500);
            return {data: []};
        }
        if (!hasNewPermissions(state)) {
            if (state.entities.roles.pending) {
                await setPendingRoles([])(dispatch, getState);
            }
            return {data: []};
        }
        const loadedRoles = getRoles(state);
        const newRoles = new Set();
        for (const role of pendingRoles) {
            if (!loadedRoles[role] && role.trim() !== '') {
                newRoles.add(role);
            }
        }

        if (state.entities.roles.pending) {
            await setPendingRoles([])(dispatch, getState);
        }
        if (newRoles.size > 0) {
            return getRolesByNames(Array.from(newRoles))(dispatch, getState);
        }
        return {data: state.entities.roles.roles};
    };
}
