// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import reselect from 'reselect';

import {getCurrentTeamId} from 'selectors/entities/teams';

export const getCurrentSearchForCurrentTeam = reselect.createSelector(
    (state) => state.entities.search.current,
    getCurrentTeamId,
    (current, teamId) => {
        return current[teamId];
    }
);
