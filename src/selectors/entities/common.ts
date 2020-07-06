// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {ChannelMembership, Channel} from 'types/channels';
import {TeamMembership} from 'types/teams';
import {GlobalState} from 'types/store';
import {UserProfile} from 'types/users';
import {RelationOneToOne, IDMappedObjects, UserIDMappedObjects} from 'types/utilities';

// Channels

export function getCurrentChannelId(state: GlobalState): string {
    return state.entities.channels.currentChannelId;
}

export function getMyChannelMemberships(state: GlobalState): RelationOneToOne<Channel, ChannelMembership> {
    return state.entities.channels.myMembers;
}

export const getMyCurrentChannelMembership: (a: GlobalState) => ChannelMembership | undefined | null = createSelector(
    getCurrentChannelId,
    getMyChannelMemberships,
    (currentChannelId, channelMemberships) => {
        return channelMemberships[currentChannelId] || null;
    },
);

export function getMembersInChannel(state: GlobalState, channelId: string): UserIDMappedObjects<ChannelMembership> {
    return state.entities.channels.membersInChannel[channelId];
}

// Teams

export function getMembersInTeam(state: GlobalState, teamId: string): RelationOneToOne<UserProfile, TeamMembership> {
    return state.entities.teams.membersInTeam[teamId];
}

// Users

export function getCurrentUser(state: GlobalState): UserProfile {
    return state.entities.users.profiles[getCurrentUserId(state)];
}

export function getCurrentUserId(state: GlobalState): string {
    return state.entities.users.currentUserId;
}

export function getUsers(state: GlobalState): IDMappedObjects<UserProfile> {
    return state.entities.users.profiles;
}
