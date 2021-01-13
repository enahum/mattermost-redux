// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {AppsTypes} from 'action_types';
import {Client4} from 'client';

import {ActionFunc} from 'types/actions';
import {AppFormValues, AppLookupCallValues} from 'types/apps';

import {bindClientFunc} from './helpers';

export function fetchAppBindings(userID: string, channelID: string): ActionFunc {
    return bindClientFunc({
        clientFunc: () => Client4.getAppsBindings(userID, channelID),
        onSuccess: AppsTypes.RECEIVED_APP_BINDINGS,
    });
}
