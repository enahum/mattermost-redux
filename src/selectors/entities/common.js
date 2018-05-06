// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
// @flow

import type {GlobalState} from 'mattermost-redux/types/store';
import type {UserProfile} from 'mattermost-redux/types/users';
import type {ChannelMembership} from 'mattermost-redux/types/channels';

import {createSelector} from 'reselect';

// Channels

export function getCurrentChannelId(state: GlobalState): string {
    return state.entities.channels.currentChannelId;
}

export function getMyChannelMemberships(state: GlobalState): {[string]: ChannelMembership} {
    return state.entities.channels.myMembers;
}

export const getMyCurrentChannelMembership = createSelector(
    getCurrentChannelId,
    getMyChannelMemberships,
    (currentChannelId, channelMemberships) => {
        return channelMemberships[currentChannelId] || {};
    }
);

// Users

export function getCurrentUser(state: GlobalState): UserProfile {
    return state.entities.users.profiles[getCurrentUserId(state)];
}

export function getCurrentUserId(state: GlobalState): string {
    return state.entities.users.currentUserId;
}

export function getUsers(state: GlobalState): {[string]: UserProfile} {
    return state.entities.users.profiles;
}
