// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {General} from '../constants';

import {ClusterInfo, AnalyticsRow} from 'types/admin';
import {Audit} from 'types/audits';
import {UserAutocomplete, AutocompleteSuggestion} from 'types/autocomplete';
import {Bot, BotPatch} from 'types/bots';
import {
    Channel,
    ChannelMemberCountsByGroup,
    ChannelMembership,
    ChannelModeration,
    ChannelModerationPatch,
    ChannelStats,
    ChannelsWithTotalCount,
    ChannelUnread,
    ChannelViewResponse,
    ChannelWithTeamData,
} from 'types/channels';
import {Options, StatusOK, ClientResponse} from 'types/client4';
import {Compliance} from 'types/compliance';
import {
    ClientConfig,
    ClientLicense,
    Config,
    DataRetentionPolicy,
    EnvironmentConfig,
    License,
} from 'types/config';
import {CustomEmoji} from 'types/emojis';
import {ServerError} from 'types/errors';
import {FileInfo, FileUploadResponse} from 'types/files';
import {
    Group,
    GroupPatch,
    GroupSyncable,
    MixedUnlinkedGroup,
    SyncablePatch,
    UsersWithGroupsAndCount,
    GroupsWithCount,
} from 'types/groups';
import {PostActionResponse} from 'types/integration_actions';
import {
    Command,
    CommandResponse,
    DialogSubmission,
    IncomingWebhook,
    OAuthApp,
    OutgoingWebhook,
    SubmitDialogResponse,
} from 'types/integrations';
import {Job} from 'types/jobs';
import {MfaSecret} from 'types/mfa';
import {
    ClientPluginManifest,
    MarketplacePlugin,
    PluginManifest,
    PluginsResponse,
    PluginStatus,
} from 'types/plugins';
import {Post, PostList, PostSearchResults, OpenGraphMetadata} from 'types/posts';
import {PreferenceType} from 'types/preferences';
import {Reaction} from 'types/reactions';
import {Role} from 'types/roles';
import {SamlCertificateStatus, SamlMetadataResponse} from 'types/saml';
import {Scheme} from 'types/schemes';
import {Session} from 'types/sessions';
import {
    GetTeamMembersOpts,
    Team,
    TeamInviteWithError,
    TeamMembership,
    TeamMemberWithError,
    TeamStats,
    TeamsWithCount,
    TeamUnread,
} from 'types/teams';
import {TermsOfService} from 'types/terms_of_service';
import {
    AuthChangeResponse,
    UserAccessToken,
    UserProfile,
    UsersStats,
    UserStatus,
} from 'types/users';
import {$ID, RelationOneToOne} from 'types/utilities';

import {buildQueryString, isMinimumServerVersion} from 'utils/helpers';
import {cleanUrlForLogging} from 'utils/sentry';
import {isSystemAdmin} from 'utils/user_utils';

import fetch from './fetch_etag';

const FormData = require('form-data');
const HEADER_AUTH = 'Authorization';
const HEADER_BEARER = 'BEARER';
const HEADER_REQUESTED_WITH = 'X-Requested-With';
const HEADER_USER_AGENT = 'User-Agent';
const HEADER_X_CLUSTER_ID = 'X-Cluster-Id';
const HEADER_X_CSRF_TOKEN = 'X-CSRF-Token';
export const HEADER_X_VERSION_ID = 'X-Version-Id';
const PER_PAGE_DEFAULT = 60;
const LOGS_PER_PAGE_DEFAULT = 10000;
export const DEFAULT_LIMIT_BEFORE = 30;
export const DEFAULT_LIMIT_AFTER = 30;
/* eslint-disable no-throw-literal */

export default class Client4 {
    logToConsole = false;
    serverVersion = '';
    clusterId = '';
    token = '';
    csrf = '';
    url = '';
    urlVersion = '/api/v4';
    userAgent: string|null = null;
    enableLogging = false;
    defaultHeaders: {[x: string]: string} = {};
    userId = '';
    diagnosticId = '';
    includeCookies = true;
    translations = {
        connectionError: 'There appears to be a problem with your internet connection.',
        unknownError: 'We received an unexpected status code from the server.',
    };
    userRoles?: string;

    getUrl() {
        return this.url;
    }

    getAbsoluteUrl(baseUrl: string) {
        if (typeof baseUrl !== 'string' || !baseUrl.startsWith('/')) {
            return baseUrl;
        }
        return this.getUrl() + baseUrl;
    }

    setUrl(url: string) {
        this.url = url;
    }

    setUserAgent(userAgent: string) {
        this.userAgent = userAgent;
    }

    getToken() {
        return this.token;
    }

    setToken(token: string) {
        this.token = token;
    }

    setCSRF(csrfToken: string) {
        this.csrf = csrfToken;
    }

    setAcceptLanguage(locale: string) {
        this.defaultHeaders['Accept-Language'] = locale;
    }

    setEnableLogging(enable: boolean) {
        this.enableLogging = enable;
    }

    setIncludeCookies(include: boolean) {
        this.includeCookies = include;
    }

    setUserId(userId: string) {
        this.userId = userId;
    }

    setUserRoles(roles: string) {
        this.userRoles = roles;
    }

    setDiagnosticId(diagnosticId: string) {
        this.diagnosticId = diagnosticId;
    }

    getServerVersion() {
        return this.serverVersion;
    }

    getUrlVersion() {
        return this.urlVersion;
    }

    getBaseRoute() {
        return `${this.url}${this.urlVersion}`;
    }

    getUsersRoute() {
        return `${this.getBaseRoute()}/users`;
    }

    getUserRoute(userId: string) {
        return `${this.getUsersRoute()}/${userId}`;
    }

    getTeamsRoute() {
        return `${this.getBaseRoute()}/teams`;
    }

    getTeamRoute(teamId: string) {
        return `${this.getTeamsRoute()}/${teamId}`;
    }

    getTeamSchemeRoute(teamId: string) {
        return `${this.getTeamRoute(teamId)}/scheme`;
    }

    getTeamNameRoute(teamName: string) {
        return `${this.getTeamsRoute()}/name/${teamName}`;
    }

    getTeamMembersRoute(teamId: string) {
        return `${this.getTeamRoute(teamId)}/members`;
    }

    getTeamMemberRoute(teamId: string, userId: string) {
        return `${this.getTeamMembersRoute(teamId)}/${userId}`;
    }

    getChannelsRoute() {
        return `${this.getBaseRoute()}/channels`;
    }

    getChannelRoute(channelId: string) {
        return `${this.getChannelsRoute()}/${channelId}`;
    }

    getChannelMembersRoute(channelId: string) {
        return `${this.getChannelRoute(channelId)}/members`;
    }

    getChannelMemberRoute(channelId: string, userId: string) {
        return `${this.getChannelMembersRoute(channelId)}/${userId}`;
    }

    getChannelSchemeRoute(channelId: string) {
        return `${this.getChannelRoute(channelId)}/scheme`;
    }

    getPostsRoute() {
        return `${this.getBaseRoute()}/posts`;
    }

    getPostRoute(postId: string) {
        return `${this.getPostsRoute()}/${postId}`;
    }

    getReactionsRoute() {
        return `${this.getBaseRoute()}/reactions`;
    }

    getCommandsRoute() {
        return `${this.getBaseRoute()}/commands`;
    }

    getFilesRoute() {
        return `${this.getBaseRoute()}/files`;
    }

    getFileRoute(fileId: string) {
        return `${this.getFilesRoute()}/${fileId}`;
    }

    getPreferencesRoute(userId: string) {
        return `${this.getUserRoute(userId)}/preferences`;
    }

    getIncomingHooksRoute() {
        return `${this.getBaseRoute()}/hooks/incoming`;
    }

    getIncomingHookRoute(hookId: string) {
        return `${this.getBaseRoute()}/hooks/incoming/${hookId}`;
    }

    getOutgoingHooksRoute() {
        return `${this.getBaseRoute()}/hooks/outgoing`;
    }

    getOutgoingHookRoute(hookId: string) {
        return `${this.getBaseRoute()}/hooks/outgoing/${hookId}`;
    }

    getOAuthRoute() {
        return `${this.url}/oauth`;
    }

    getOAuthAppsRoute() {
        return `${this.getBaseRoute()}/oauth/apps`;
    }

    getOAuthAppRoute(appId: string) {
        return `${this.getOAuthAppsRoute()}/${appId}`;
    }

    getEmojisRoute() {
        return `${this.getBaseRoute()}/emoji`;
    }

    getEmojiRoute(emojiId: string) {
        return `${this.getEmojisRoute()}/${emojiId}`;
    }

    getBrandRoute() {
        return `${this.getBaseRoute()}/brand`;
    }

    getBrandImageUrl(timestamp: string) {
        return `${this.getBrandRoute()}/image?t=${timestamp}`;
    }

    getDataRetentionRoute() {
        return `${this.getBaseRoute()}/data_retention`;
    }

    getJobsRoute() {
        return `${this.getBaseRoute()}/jobs`;
    }

    getPluginsRoute() {
        return `${this.getBaseRoute()}/plugins`;
    }

    getPluginRoute(pluginId: string) {
        return `${this.getPluginsRoute()}/${pluginId}`;
    }

    getPluginsMarketplaceRoute() {
        return `${this.getPluginsRoute()}/marketplace`;
    }

    getRolesRoute() {
        return `${this.getBaseRoute()}/roles`;
    }

    getTimezonesRoute() {
        return `${this.getBaseRoute()}/system/timezones`;
    }

    getSchemesRoute() {
        return `${this.getBaseRoute()}/schemes`;
    }

    getRedirectLocationRoute() {
        return `${this.getBaseRoute()}/redirect_location`;
    }

    getBotsRoute() {
        return `${this.getBaseRoute()}/bots`;
    }

    getBotRoute(botUserId: string) {
        return `${this.getBotsRoute()}/${botUserId}`;
    }

    getCSRFFromCookie() {
        if (typeof document !== 'undefined' && typeof document.cookie !== 'undefined') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith('MMCSRF=')) {
                    return cookie.replace('MMCSRF=', '');
                }
            }
        }
        return '';
    }

    getOptions(options: Options) {
        const newOptions: Options = {...options};

        const headers: {[x: string]: string} = {
            [HEADER_REQUESTED_WITH]: 'XMLHttpRequest',
            ...this.defaultHeaders,
        };

        if (this.token) {
            headers[HEADER_AUTH] = `${HEADER_BEARER} ${this.token}`;
        }

        const csrfToken = this.csrf || this.getCSRFFromCookie();
        if (options.method && options.method.toLowerCase() !== 'get' && csrfToken) {
            headers[HEADER_X_CSRF_TOKEN] = csrfToken;
        }

        if (this.includeCookies) {
            newOptions.credentials = 'include';
        }

        if (this.userAgent) {
            headers[HEADER_USER_AGENT] = this.userAgent;
        }

        if (newOptions.headers) {
            Object.assign(headers, newOptions.headers);
        }

        return {
            ...newOptions,
            headers,
        };
    }

    // User Routes

    createUser = (user: UserProfile, token: string, inviteId: string) => {
        this.trackEvent('api', 'api_users_create');

        const queryParams: any = {};

        if (token) {
            queryParams.t = token;
        }

        if (inviteId) {
            queryParams.iid = inviteId;
        }

        return this.doFetch<UserProfile>(
            `${this.getUsersRoute()}${buildQueryString(queryParams)}`,
            {method: 'post', body: JSON.stringify(user)},
        );
    }

    patchMe = (userPatch: Partial<UserProfile>) => {
        return this.doFetch<UserProfile>(
            `${this.getUserRoute('me')}/patch`,
            {method: 'put', body: JSON.stringify(userPatch)},
        );
    }

    patchUser = (userPatch: Partial<UserProfile> & {id: string}) => {
        this.trackEvent('api', 'api_users_patch');

        return this.doFetch<UserProfile>(
            `${this.getUserRoute(userPatch.id)}/patch`,
            {method: 'put', body: JSON.stringify(userPatch)},
        );
    }

    updateUser = (user: UserProfile) => {
        this.trackEvent('api', 'api_users_update');

        return this.doFetch<UserProfile>(
            `${this.getUserRoute(user.id)}`,
            {method: 'put', body: JSON.stringify(user)},
        );
    }

    promoteGuestToUser = (userId: string) => {
        this.trackEvent('api', 'api_users_promote_guest_to_user');

        return this.doFetch<StatusOK>(
            `${this.getUserRoute(userId)}/promote`,
            {method: 'post'},
        );
    }

    demoteUserToGuest = (userId: string) => {
        this.trackEvent('api', 'api_users_demote_user_to_guest');

        return this.doFetch<StatusOK>(
            `${this.getUserRoute(userId)}/demote`,
            {method: 'post'},
        );
    }

    updateUserRoles = (userId: string, roles: string) => {
        this.trackEvent('api', 'api_users_update_roles');

        return this.doFetch<StatusOK>(
            `${this.getUserRoute(userId)}/roles`,
            {method: 'put', body: JSON.stringify({roles})},
        );
    };

    updateUserMfa = (userId: string, activate: boolean, code: string) => {
        const body: any = {
            activate,
        };

        if (activate) {
            body.code = code;
        }

        return this.doFetch<StatusOK>(
            `${this.getUserRoute(userId)}/mfa`,
            {method: 'put', body: JSON.stringify(body)},
        );
    }

    updateUserPassword = (userId: string, currentPassword: string, newPassword: string) => {
        this.trackEvent('api', 'api_users_newpassword');

        return this.doFetch<StatusOK>(
            `${this.getUserRoute(userId)}/password`,
            {method: 'put', body: JSON.stringify({current_password: currentPassword, new_password: newPassword})},
        );
    }

    resetUserPassword = (token: string, newPassword: string) => {
        this.trackEvent('api', 'api_users_reset_password');

        return this.doFetch<StatusOK>(
            `${this.getUsersRoute()}/password/reset`,
            {method: 'post', body: JSON.stringify({token, new_password: newPassword})},
        );
    }

    getKnownUsers = () => {
        this.trackEvent('api', 'api_get_known_users');

        return this.doFetch<$ID<UserProfile>[]>(
            `${this.getUsersRoute()}/known`,
            {method: 'get'},
        );
    }

    sendPasswordResetEmail = (email: string) => {
        this.trackEvent('api', 'api_users_send_password_reset');

        return this.doFetch<StatusOK>(
            `${this.getUsersRoute()}/password/reset/send`,
            {method: 'post', body: JSON.stringify({email})},
        );
    }

    updateUserActive = (userId: string, active: boolean) => {
        this.trackEvent('api', 'api_users_update_active');

        return this.doFetch<StatusOK>(
            `${this.getUserRoute(userId)}/active`,
            {method: 'put', body: JSON.stringify({active})},
        );
    }

    uploadProfileImage = (userId: string, imageData: File) => {
        this.trackEvent('api', 'api_users_update_profile_picture');

        const formData = new FormData();
        formData.append('image', imageData);
        const request: any = {
            method: 'post',
            body: formData,
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            };
        }

        return this.doFetch<StatusOK>(
            `${this.getUserRoute(userId)}/image`,
            request,
        );
    };

    setDefaultProfileImage = (userId: string) => {
        this.trackEvent('api', 'api_users_set_default_profile_picture');

        return this.doFetch<StatusOK>(
            `${this.getUserRoute(userId)}/image`,
            {method: 'delete'},
        );
    };

    verifyUserEmail = (token: string) => {
        return this.doFetch<StatusOK>(
            `${this.getUsersRoute()}/email/verify`,
            {method: 'post', body: JSON.stringify({token})},
        );
    }

    updateMyTermsOfServiceStatus = (termsOfServiceId: string, accepted: boolean) => {
        return this.doFetch<StatusOK>(
            `${this.getUserRoute('me')}/terms_of_service`,
            {method: 'post', body: JSON.stringify({termsOfServiceId, accepted})},
        );
    }

    getTermsOfService = () => {
        return this.doFetch<TermsOfService>(
            `${this.getBaseRoute()}/terms_of_service`,
            {method: 'get'},
        );
    }

    createTermsOfService = (text: string) => {
        return this.doFetch<TermsOfService>(
            `${this.getBaseRoute()}/terms_of_service`,
            {method: 'post', body: JSON.stringify({text})},
        );
    }

    sendVerificationEmail = (email: string) => {
        return this.doFetch<StatusOK>(
            `${this.getUsersRoute()}/email/verify/send`,
            {method: 'post', body: JSON.stringify({email})},
        );
    }

    login = (loginId: string, password: string, token = '', deviceId = '', ldapOnly = false) => {
        this.trackEvent('api', 'api_users_login');

        if (ldapOnly) {
            this.trackEvent('api', 'api_users_login_ldap');
        }

        const body: any = {
            device_id: deviceId,
            login_id: loginId,
            password,
            token,
        };

        if (ldapOnly) {
            body.ldap_only = 'true';
        }

        return this.doFetch<UserProfile>(
            `${this.getUsersRoute()}/login`,
            {method: 'post', body: JSON.stringify(body)},
        );
    };

    loginById = (id: string, password: string, token = '', deviceId = '') => {
        this.trackEvent('api', 'api_users_login');
        const body: any = {
            device_id: deviceId,
            id,
            password,
            token,
        };

        return this.doFetch<UserProfile>(
            `${this.getUsersRoute()}/login`,
            {method: 'post', body: JSON.stringify(body)},
        );
    };

    logout = async () => {
        this.trackEvent('api', 'api_users_logout');

        const {response} = await this.doFetchWithResponse(
            `${this.getUsersRoute()}/logout`,
            {method: 'post'},
        );

        if (response.ok) {
            this.token = '';
        }

        this.serverVersion = '';

        return response;
    };

    getProfiles = (page = 0, perPage = PER_PAGE_DEFAULT, options = {}) => {
        this.trackEvent('api', 'api_profiles_get');

        return this.doFetch<UserProfile[]>(
            `${this.getUsersRoute()}${buildQueryString({page, per_page: perPage, ...options})}`,
            {method: 'get'},
        );
    };

    getProfilesByIds = (userIds: string[], options = {}) => {
        this.trackEvent('api', 'api_profiles_get_by_ids');

        return this.doFetch<UserProfile[]>(
            `${this.getUsersRoute()}/ids${buildQueryString(options)}`,
            {method: 'post', body: JSON.stringify(userIds)},
        );
    };

    getProfilesByUsernames = (usernames: string[]) => {
        this.trackEvent('api', 'api_profiles_get_by_usernames');

        return this.doFetch<UserProfile[]>(
            `${this.getUsersRoute()}/usernames`,
            {method: 'post', body: JSON.stringify(usernames)},
        );
    };

    getProfilesInTeam = (teamId: string, page = 0, perPage = PER_PAGE_DEFAULT, sort = '', options = {}) => {
        this.trackEvent('api', 'api_profiles_get_in_team', {team_id: teamId, sort});

        return this.doFetch<UserProfile[]>(
            `${this.getUsersRoute()}${buildQueryString({...options, in_team: teamId, page, per_page: perPage, sort})}`,
            {method: 'get'},
        );
    };

    getProfilesNotInTeam = (teamId: string, groupConstrained: boolean, page = 0, perPage = PER_PAGE_DEFAULT) => {
        this.trackEvent('api', 'api_profiles_get_not_in_team', {team_id: teamId, group_constrained: groupConstrained});

        const queryStringObj: any = {not_in_team: teamId, page, per_page: perPage};
        if (groupConstrained) {
            queryStringObj.group_constrained = true;
        }

        return this.doFetch<UserProfile[]>(
            `${this.getUsersRoute()}${buildQueryString(queryStringObj)}`,
            {method: 'get'},
        );
    };

    getProfilesWithoutTeam = (page = 0, perPage = PER_PAGE_DEFAULT, options = {}) => {
        this.trackEvent('api', 'api_profiles_get_without_team');

        return this.doFetch<UserProfile[]>(
            `${this.getUsersRoute()}${buildQueryString({...options, without_team: 1, page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getProfilesInChannel = (channelId: string, page = 0, perPage = PER_PAGE_DEFAULT, sort = '') => {
        this.trackEvent('api', 'api_profiles_get_in_channel', {channel_id: channelId});

        const serverVersion = this.getServerVersion();
        let queryStringObj;
        if (isMinimumServerVersion(serverVersion, 4, 7)) {
            queryStringObj = {in_channel: channelId, page, per_page: perPage, sort};
        } else {
            queryStringObj = {in_channel: channelId, page, per_page: perPage};
        }
        return this.doFetch<UserProfile[]>(
            `${this.getUsersRoute()}${buildQueryString(queryStringObj)}`,
            {method: 'get'},
        );
    };

    getProfilesInGroupChannels = (channelsIds: string[]) => {
        this.trackEvent('api', 'api_profiles_get_in_group_channels', {channelsIds});

        return this.doFetch<Record<string, UserProfile[]>>(
            `${this.getUsersRoute()}/group_channels`,
            {method: 'post', body: JSON.stringify(channelsIds)},
        );
    };

    getProfilesNotInChannel = (teamId: string, channelId: string, groupConstrained: boolean, page = 0, perPage = PER_PAGE_DEFAULT) => {
        this.trackEvent('api', 'api_profiles_get_not_in_channel', {team_id: teamId, channel_id: channelId, group_constrained: groupConstrained});

        const queryStringObj: any = {in_team: teamId, not_in_channel: channelId, page, per_page: perPage};
        if (groupConstrained) {
            queryStringObj.group_constrained = true;
        }

        return this.doFetch<UserProfile[]>(
            `${this.getUsersRoute()}${buildQueryString(queryStringObj)}`,
            {method: 'get'},
        );
    };

    getMe = () => {
        return this.doFetch<UserProfile>(
            `${this.getUserRoute('me')}`,
            {method: 'get'},
        );
    };

    getUser = (userId: string) => {
        return this.doFetch<UserProfile>(
            `${this.getUserRoute(userId)}`,
            {method: 'get'},
        );
    };

    getUserByUsername = (username: string) => {
        return this.doFetch<UserProfile>(
            `${this.getUsersRoute()}/username/${username}`,
            {method: 'get'},
        );
    };

    getUserByEmail = (email: string) => {
        return this.doFetch<UserProfile>(
            `${this.getUsersRoute()}/email/${email}`,
            {method: 'get'},
        );
    };

    getProfilePictureUrl = (userId: string, lastPictureUpdate: number) => {
        const params: any = {};

        if (lastPictureUpdate) {
            params._ = lastPictureUpdate;
        }

        return `${this.getUserRoute(userId)}/image${buildQueryString(params)}`;
    };

    getDefaultProfilePictureUrl = (userId: string) => {
        return `${this.getUserRoute(userId)}/image/default`;
    };

    autocompleteUsers = (name: string, teamId: string, channelId: string, options = {
        limit: General.AUTOCOMPLETE_LIMIT_DEFAULT,
    }) => {
        return this.doFetch<UserAutocomplete>(`${this.getUsersRoute()}/autocomplete${buildQueryString({
            in_team: teamId,
            in_channel: channelId,
            name,
            limit: options.limit,
        })}`, {
            method: 'get',
        });
    };

    getSessions = (userId: string) => {
        return this.doFetch<Session[]>(
            `${this.getUserRoute(userId)}/sessions`,
            {method: 'get'},
        );
    };

    revokeSession = (userId: string, sessionId: string) => {
        return this.doFetch<StatusOK>(
            `${this.getUserRoute(userId)}/sessions/revoke`,
            {method: 'post', body: JSON.stringify({session_id: sessionId})},
        );
    };

    revokeAllSessionsForUser = (userId: string) => {
        return this.doFetch<StatusOK>(
            `${this.getUserRoute(userId)}/sessions/revoke/all`,
            {method: 'post'},
        );
    };

    revokeSessionsForAllUsers = () => {
        return this.doFetch<StatusOK>(
            `${this.getUsersRoute()}/sessions/revoke/all`,
            {method: 'post'},
        );
    };

    getUserAudits = (userId: string, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<Audit[]>(
            `${this.getUserRoute(userId)}/audits${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    checkUserMfa = (loginId: string) => {
        return this.doFetch<{mfa_required: boolean}>(
            `${this.getUsersRoute()}/mfa`,
            {method: 'post', body: JSON.stringify({login_id: loginId})},
        );
    };

    generateMfaSecret = (userId: string) => {
        return this.doFetch<MfaSecret>(
            `${this.getUserRoute(userId)}/mfa/generate`,
            {method: 'post'},
        );
    };

    attachDevice = (deviceId: string) => {
        return this.doFetch<StatusOK>(
            `${this.getUsersRoute()}/sessions/device`,
            {method: 'put', body: JSON.stringify({device_id: deviceId})},
        );
    };

    searchUsers = (term: string, options: any) => {
        this.trackEvent('api', 'api_search_users');

        return this.doFetch<UserProfile[]>(
            `${this.getUsersRoute()}/search`,
            {method: 'post', body: JSON.stringify({term, ...options})},
        );
    };

    getStatusesByIds = (userIds: string[]) => {
        return this.doFetch<UserStatus[]>(
            `${this.getUsersRoute()}/status/ids`,
            {method: 'post', body: JSON.stringify(userIds)},
        );
    };

    getStatus = (userId: string) => {
        return this.doFetch<UserStatus>(
            `${this.getUserRoute(userId)}/status`,
            {method: 'get'},
        );
    };

    updateStatus = (status: UserStatus) => {
        return this.doFetch<UserStatus>(
            `${this.getUserRoute(status.user_id)}/status`,
            {method: 'put', body: JSON.stringify(status)},
        );
    };

    switchEmailToOAuth = (service: string, email: string, password: string, mfaCode = '') => {
        this.trackEvent('api', 'api_users_email_to_oauth');

        return this.doFetch<AuthChangeResponse>(
            `${this.getUsersRoute()}/login/switch`,
            {method: 'post', body: JSON.stringify({current_service: 'email', new_service: service, email, password, mfa_code: mfaCode})},
        );
    };

    switchOAuthToEmail = (currentService: string, email: string, password: string) => {
        this.trackEvent('api', 'api_users_oauth_to_email');

        return this.doFetch<AuthChangeResponse>(
            `${this.getUsersRoute()}/login/switch`,
            {method: 'post', body: JSON.stringify({current_service: currentService, new_service: 'email', email, new_password: password})},
        );
    };

    switchEmailToLdap = (email: string, emailPassword: string, ldapId: string, ldapPassword: string, mfaCode = '') => {
        this.trackEvent('api', 'api_users_email_to_ldap');

        return this.doFetch<AuthChangeResponse>(
            `${this.getUsersRoute()}/login/switch`,
            {method: 'post', body: JSON.stringify({current_service: 'email', new_service: 'ldap', email, password: emailPassword, ldap_id: ldapId, new_password: ldapPassword, mfa_code: mfaCode})},
        );
    };

    switchLdapToEmail = (ldapPassword: string, email: string, emailPassword: string, mfaCode = '') => {
        this.trackEvent('api', 'api_users_ldap_to_email');

        return this.doFetch<AuthChangeResponse>(
            `${this.getUsersRoute()}/login/switch`,
            {method: 'post', body: JSON.stringify({current_service: 'ldap', new_service: 'email', email, password: ldapPassword, new_password: emailPassword, mfa_code: mfaCode})},
        );
    };

    getAuthorizedOAuthApps = (userId: string) => {
        return this.doFetch<OAuthApp[]>(
            `${this.getUserRoute(userId)}/oauth/apps/authorized`,
            {method: 'get'},
        );
    }

    authorizeOAuthApp = (responseType: string, clientId: string, redirectUri: string, state: string, scope: string) => {
        return this.doFetch<void>(
            `${this.url}/oauth/authorize`,
            {method: 'post', body: JSON.stringify({client_id: clientId, response_type: responseType, redirect_uri: redirectUri, state, scope})},
        );
    }

    deauthorizeOAuthApp = (clientId: string) => {
        return this.doFetch<StatusOK>(
            `${this.url}/oauth/deauthorize`,
            {method: 'post', body: JSON.stringify({client_id: clientId})},
        );
    }

    createUserAccessToken = (userId: string, description: string) => {
        this.trackEvent('api', 'api_users_create_access_token');

        return this.doFetch<UserAccessToken>(
            `${this.getUserRoute(userId)}/tokens`,
            {method: 'post', body: JSON.stringify({description})},
        );
    }

    getUserAccessToken = (tokenId: string) => {
        return this.doFetch<UserAccessToken>(
            `${this.getUsersRoute()}/tokens/${tokenId}`,
            {method: 'get'},
        );
    }

    getUserAccessTokensForUser = (userId: string, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<UserAccessToken[]>(
            `${this.getUserRoute(userId)}/tokens${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    }

    getUserAccessTokens = (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<UserAccessToken[]>(
            `${this.getUsersRoute()}/tokens${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    }

    revokeUserAccessToken = (tokenId: string) => {
        this.trackEvent('api', 'api_users_revoke_access_token');

        return this.doFetch<StatusOK>(
            `${this.getUsersRoute()}/tokens/revoke`,
            {method: 'post', body: JSON.stringify({token_id: tokenId})},
        );
    }

    disableUserAccessToken = (tokenId: string) => {
        return this.doFetch<StatusOK>(
            `${this.getUsersRoute()}/tokens/disable`,
            {method: 'post', body: JSON.stringify({token_id: tokenId})},
        );
    }

    enableUserAccessToken = (tokenId: string) => {
        return this.doFetch<StatusOK>(
            `${this.getUsersRoute()}/tokens/enable`,
            {method: 'post', body: JSON.stringify({token_id: tokenId})},
        );
    }

    // Team Routes

    createTeam = (team: Team) => {
        this.trackEvent('api', 'api_teams_create');

        return this.doFetch<Team>(
            `${this.getTeamsRoute()}`,
            {method: 'post', body: JSON.stringify(team)},
        );
    };

    deleteTeam = (teamId: string) => {
        this.trackEvent('api', 'api_teams_delete');

        return this.doFetch<StatusOK>(
            `${this.getTeamRoute(teamId)}`,
            {method: 'delete'},
        );
    };

    updateTeam = (team: Team) => {
        this.trackEvent('api', 'api_teams_update_name', {team_id: team.id});

        return this.doFetch<Team>(
            `${this.getTeamRoute(team.id)}`,
            {method: 'put', body: JSON.stringify(team)},
        );
    };

    patchTeam = (team: Partial<Team> & {id: string}) => {
        this.trackEvent('api', 'api_teams_patch_name', {team_id: team.id});

        return this.doFetch<Team>(
            `${this.getTeamRoute(team.id)}/patch`,
            {method: 'put', body: JSON.stringify(team)},
        );
    };

    regenerateTeamInviteId = (teamId: string) => {
        this.trackEvent('api', 'api_teams_regenerate_invite_id', {team_id: teamId});

        return this.doFetch<Team>(
            `${this.getTeamRoute(teamId)}/regenerate_invite_id`,
            {method: 'post'},
        );
    };

    updateTeamScheme = (teamId: string, schemeId: string) => {
        const patch = {scheme_id: schemeId};

        this.trackEvent('api', 'api_teams_update_scheme', {team_id: teamId, ...patch});

        return this.doFetch<StatusOK>(
            `${this.getTeamSchemeRoute(teamId)}`,
            {method: 'put', body: JSON.stringify(patch)},
        );
    };

    checkIfTeamExists = (teamName: string) => {
        return this.doFetch<{exists: boolean}>(
            `${this.getTeamNameRoute(teamName)}/exists`,
            {method: 'get'},
        );
    };

    getTeams = (page = 0, perPage = PER_PAGE_DEFAULT, includeTotalCount = false) => {
        return this.doFetch<Team[] | TeamsWithCount>(
            `${this.getTeamsRoute()}${buildQueryString({page, per_page: perPage, include_total_count: includeTotalCount})}`,
            {method: 'get'},
        );
    };

    searchTeams = (term: string, page?: number, perPage?: number) => {
        this.trackEvent('api', 'api_search_teams');

        return this.doFetch<Team[] | TeamsWithCount>(
            `${this.getTeamsRoute()}/search`,
            {method: 'post', body: JSON.stringify({term, page, per_page: perPage})},
        );
    };

    getTeam = (teamId: string) => {
        return this.doFetch<Team>(
            this.getTeamRoute(teamId),
            {method: 'get'},
        );
    };

    getTeamByName = (teamName: string) => {
        this.trackEvent('api', 'api_teams_get_team_by_name');

        return this.doFetch<Team>(
            this.getTeamNameRoute(teamName),
            {method: 'get'},
        );
    };

    getMyTeams = () => {
        return this.doFetch<Team[]>(
            `${this.getUserRoute('me')}/teams`,
            {method: 'get'},
        );
    };

    getTeamsForUser = (userId: string) => {
        return this.doFetch<Team[]>(
            `${this.getUserRoute(userId)}/teams`,
            {method: 'get'},
        );
    };

    getMyTeamMembers = () => {
        return this.doFetch<TeamMembership[]>(
            `${this.getUserRoute('me')}/teams/members`,
            {method: 'get'},
        );
    };

    getMyTeamUnreads = () => {
        return this.doFetch<TeamUnread[]>(
            `${this.getUserRoute('me')}/teams/unread`,
            {method: 'get'},
        );
    };

    getTeamMembers = (teamId: string, page = 0, perPage = PER_PAGE_DEFAULT, options: GetTeamMembersOpts) => {
        return this.doFetch<TeamMembership>(
            `${this.getTeamMembersRoute(teamId)}${buildQueryString({page, per_page: perPage, ...options})}`,
            {method: 'get'},
        );
    };

    getTeamMembersForUser = (userId: string) => {
        return this.doFetch<TeamMembership[]>(
            `${this.getUserRoute(userId)}/teams/members`,
            {method: 'get'},
        );
    };

    getTeamMember = (teamId: string, userId: string) => {
        return this.doFetch<TeamMembership>(
            `${this.getTeamMemberRoute(teamId, userId)}`,
            {method: 'get'},
        );
    };

    getTeamMembersByIds = (teamId: string, userIds: string[]) => {
        return this.doFetch<TeamMembership[]>(
            `${this.getTeamMembersRoute(teamId)}/ids`,
            {method: 'post', body: JSON.stringify(userIds)},
        );
    };

    addToTeam = (teamId: string, userId: string) => {
        this.trackEvent('api', 'api_teams_invite_members', {team_id: teamId});

        const member = {user_id: userId, team_id: teamId};
        return this.doFetch<TeamMembership>(
            `${this.getTeamMembersRoute(teamId)}`,
            {method: 'post', body: JSON.stringify(member)},
        );
    };

    addToTeamFromInvite = (token = '', inviteId = '') => {
        this.trackEvent('api', 'api_teams_invite_members');

        const query = buildQueryString({token, invite_id: inviteId});
        return this.doFetch<TeamMembership>(
            `${this.getTeamsRoute()}/members/invite${query}`,
            {method: 'post'},
        );
    };

    addUsersToTeam = (teamId: string, userIds: string[]) => {
        this.trackEvent('api', 'api_teams_batch_add_members', {team_id: teamId, count: userIds.length});

        const members: any = [];
        userIds.forEach((id) => members.push({team_id: teamId, user_id: id}));
        return this.doFetch<TeamMembership[]>(
            `${this.getTeamMembersRoute(teamId)}/batch`,
            {method: 'post', body: JSON.stringify(members)},
        );
    };

    addUsersToTeamGracefully = (teamId: string, userIds: string[]) => {
        this.trackEvent('api', 'api_teams_batch_add_members', {team_id: teamId, count: userIds.length});

        const members: any = [];
        userIds.forEach((id) => members.push({team_id: teamId, user_id: id}));
        return this.doFetch<TeamMemberWithError[]>(
            `${this.getTeamMembersRoute(teamId)}/batch?graceful=true`,
            {method: 'post', body: JSON.stringify(members)},
        );
    };

    joinTeam = (inviteId: string) => {
        const query = buildQueryString({invite_id: inviteId});
        return this.doFetch<TeamMembership>(
            `${this.getTeamsRoute()}/members/invite${query}`,
            {method: 'post'},
        );
    };

    removeFromTeam = (teamId: string, userId: string) => {
        this.trackEvent('api', 'api_teams_remove_members', {team_id: teamId});

        return this.doFetch<StatusOK>(
            `${this.getTeamMemberRoute(teamId, userId)}`,
            {method: 'delete'},
        );
    };

    getTeamStats = (teamId: string) => {
        return this.doFetch<TeamStats>(
            `${this.getTeamRoute(teamId)}/stats`,
            {method: 'get'},
        );
    };

    getTotalUsersStats = () => {
        return this.doFetch<UsersStats>(
            `${this.getUsersRoute()}/stats`,
            {method: 'get'},
        );
    };

    invalidateAllEmailInvites = () => {
        return this.doFetch<StatusOK>(
            `${this.getTeamsRoute()}/invites/email`,
            {method: 'delete'},
        );
    };

    getTeamInviteInfo = (inviteId: string) => {
        return this.doFetch<{
            display_name: string;
            description: string;
            name: string;
            id: string;
        }>(
            `${this.getTeamsRoute()}/invite/${inviteId}`,
            {method: 'get'},
        );
    };

    updateTeamMemberRoles = (teamId: string, userId: string, roles: string[]) => {
        this.trackEvent('api', 'api_teams_update_member_roles', {team_id: teamId});

        return this.doFetch<StatusOK>(
            `${this.getTeamMemberRoute(teamId, userId)}/roles`,
            {method: 'put', body: JSON.stringify({roles})},
        );
    };

    sendEmailInvitesToTeam = (teamId: string, emails: string[]) => {
        this.trackEvent('api', 'api_teams_invite_members', {team_id: teamId});

        return this.doFetch<StatusOK>(
            `${this.getTeamRoute(teamId)}/invite/email`,
            {method: 'post', body: JSON.stringify(emails)},
        );
    };

    sendEmailGuestInvitesToChannels = (teamId: string, channelIds: string[], emails: string[], message: string) => {
        this.trackEvent('api', 'api_teams_invite_guests', {team_id: teamId, channel_ids: channelIds});

        return this.doFetch<StatusOK>(
            `${this.getTeamRoute(teamId)}/invite-guests/email`,
            {method: 'post', body: JSON.stringify({emails, channels: channelIds, message})},
        );
    };

    sendEmailInvitesToTeamGracefully = (teamId: string, emails: string[]) => {
        this.trackEvent('api', 'api_teams_invite_members', {team_id: teamId});

        return this.doFetch<TeamInviteWithError>(
            `${this.getTeamRoute(teamId)}/invite/email?graceful=true`,
            {method: 'post', body: JSON.stringify(emails)},
        );
    };

    sendEmailGuestInvitesToChannelsGracefully = async (teamId: string, channelIds: string[], emails: string[], message: string) => {
        this.trackEvent('api', 'api_teams_invite_guests', {team_id: teamId, channel_ids: channelIds});

        return this.doFetch<TeamInviteWithError>(
            `${this.getTeamRoute(teamId)}/invite-guests/email?graceful=true`,
            {method: 'post', body: JSON.stringify({emails, channels: channelIds, message})},
        );
    };

    importTeam = (teamId: string, file: File, importFrom: string) => {
        const formData = new FormData();
        formData.append('file', file, file.name);
        formData.append('filesize', file.size);
        formData.append('importFrom', importFrom);

        const request: any = {
            method: 'post',
            body: formData,
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            };
        }

        return this.doFetch<{
            results: string;
        }>(
            `${this.getTeamRoute(teamId)}/import`,
            request,
        );
    };

    getTeamIconUrl = (teamId: string, lastTeamIconUpdate: number) => {
        const params: any = {};
        if (lastTeamIconUpdate) {
            params._ = lastTeamIconUpdate;
        }

        return `${this.getTeamRoute(teamId)}/image${buildQueryString(params)}`;
    };

    setTeamIcon = (teamId: string, imageData: File) => {
        this.trackEvent('api', 'api_team_set_team_icon');

        const formData = new FormData();
        formData.append('image', imageData);

        const request: any = {
            method: 'post',
            body: formData,
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            };
        }

        return this.doFetch<StatusOK>(
            `${this.getTeamRoute(teamId)}/image`,
            request,
        );
    };

    removeTeamIcon = (teamId: string) => {
        this.trackEvent('api', 'api_team_remove_team_icon');

        return this.doFetch<StatusOK>(
            `${this.getTeamRoute(teamId)}/image`,
            {method: 'delete'},
        );
    };

    updateTeamMemberSchemeRoles = (teamId: string, userId: string, isSchemeUser: boolean, isSchemeAdmin: boolean) => {
        const body = {scheme_user: isSchemeUser, scheme_admin: isSchemeAdmin};
        return this.doFetch<StatusOK>(
            `${this.getTeamRoute(teamId)}/members/${userId}/schemeRoles`,
            {method: 'put', body: JSON.stringify(body)},
        );
    };

    // Channel Routes

    getAllChannels = (page = 0, perPage = PER_PAGE_DEFAULT, notAssociatedToGroup = '', excludeDefaultChannels = false, includeTotalCount = false) => {
        const queryData = {
            page,
            per_page: perPage,
            not_associated_to_group: notAssociatedToGroup,
            exclude_default_channels: excludeDefaultChannels,
            include_total_count: includeTotalCount,
        };
        return this.doFetch<ChannelWithTeamData[] | ChannelsWithTotalCount>(
            `${this.getChannelsRoute()}${buildQueryString(queryData)}`,
            {method: 'get'},
        );
    };

    createChannel = (channel: Channel) => {
        this.trackEvent('api', 'api_channels_create', {team_id: channel.team_id});

        return this.doFetch<Channel>(
            `${this.getChannelsRoute()}`,
            {method: 'post', body: JSON.stringify(channel)},
        );
    };

    createDirectChannel = (userIds: string[]) => {
        this.trackEvent('api', 'api_channels_create_direct');

        return this.doFetch<Channel>(
            `${this.getChannelsRoute()}/direct`,
            {method: 'post', body: JSON.stringify(userIds)},
        );
    };

    createGroupChannel = (userIds: string[]) => {
        this.trackEvent('api', 'api_channels_create_group');

        return this.doFetch<Channel>(
            `${this.getChannelsRoute()}/group`,
            {method: 'post', body: JSON.stringify(userIds)},
        );
    };

    deleteChannel = (channelId: string) => {
        this.trackEvent('api', 'api_channels_delete', {channel_id: channelId});

        return this.doFetch<StatusOK>(
            `${this.getChannelRoute(channelId)}`,
            {method: 'delete'},
        );
    };

    unarchiveChannel = (channelId: string) => {
        this.trackEvent('api', 'api_channels_unarchive', {channel_id: channelId});

        return this.doFetch<Channel>(
            `${this.getChannelRoute(channelId)}/restore`,
            {method: 'post'},
        );
    };

    updateChannel = (channel: Channel) => {
        this.trackEvent('api', 'api_channels_update', {channel_id: channel.id});

        return this.doFetch<Channel>(
            `${this.getChannelRoute(channel.id)}`,
            {method: 'put', body: JSON.stringify(channel)},
        );
    };

    convertChannelToPrivate = (channelId: string) => {
        this.trackEvent('api', 'api_channels_convert_to_private', {channel_id: channelId});

        return this.doFetch<Channel>(
            `${this.getChannelRoute(channelId)}/convert`,
            {method: 'post'},
        );
    };

    updateChannelPrivacy = (channelId: string, privacy: any) => {
        this.trackEvent('api', 'api_channels_update_privacy', {channel_id: channelId, privacy});

        return this.doFetch<Channel>(
            `${this.getChannelRoute(channelId)}/privacy`,
            {method: 'put', body: JSON.stringify({privacy})},
        );
    };

    patchChannel = (channelId: string, channelPatch: Partial<Channel>) => {
        this.trackEvent('api', 'api_channels_patch', {channel_id: channelId});

        return this.doFetch<Channel>(
            `${this.getChannelRoute(channelId)}/patch`,
            {method: 'put', body: JSON.stringify(channelPatch)},
        );
    };

    updateChannelNotifyProps = (props: any) => {
        this.trackEvent('api', 'api_users_update_channel_notifications', {channel_id: props.channel_id});

        return this.doFetch<StatusOK>(
            `${this.getChannelMemberRoute(props.channel_id, props.user_id)}/notify_props`,
            {method: 'put', body: JSON.stringify(props)},
        );
    };

    updateChannelScheme = (channelId: string, schemeId: string) => {
        const patch = {scheme_id: schemeId};

        this.trackEvent('api', 'api_channels_update_scheme', {channel_id: channelId, ...patch});

        return this.doFetch<StatusOK>(
            `${this.getChannelSchemeRoute(channelId)}`,
            {method: 'put', body: JSON.stringify(patch)},
        );
    };

    getChannel = (channelId: string) => {
        this.trackEvent('api', 'api_channel_get', {channel_id: channelId});

        return this.doFetch<Channel>(
            `${this.getChannelRoute(channelId)}`,
            {method: 'get'},
        );
    };

    getChannelByName = (teamId: string, channelName: string, includeDeleted = false) => {
        return this.doFetch<Channel>(
            `${this.getTeamRoute(teamId)}/channels/name/${channelName}?include_deleted=${includeDeleted}`,
            {method: 'get'},
        );
    };

    getChannelByNameAndTeamName = (teamName: string, channelName: string, includeDeleted = false) => {
        this.trackEvent('api', 'api_channel_get_by_name_and_teamName', {include_deleted: includeDeleted});

        return this.doFetch<Channel>(
            `${this.getTeamNameRoute(teamName)}/channels/name/${channelName}?include_deleted=${includeDeleted}`,
            {method: 'get'},
        );
    };

    getChannels = (teamId: string, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<Channel[]>(
            `${this.getTeamRoute(teamId)}/channels${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getArchivedChannels = (teamId: string, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<Channel[]>(
            `${this.getTeamRoute(teamId)}/channels/deleted${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getMyChannels = (teamId: string, includeDeleted = false) => {
        return this.doFetch<Channel[]>(
            `${this.getUserRoute('me')}/teams/${teamId}/channels${buildQueryString({include_deleted: includeDeleted})}`,
            {method: 'get'},
        );
    };

    getMyChannelMember = (channelId: string) => {
        return this.doFetch<ChannelMembership>(
            `${this.getChannelMemberRoute(channelId, 'me')}`,
            {method: 'get'},
        );
    };

    getMyChannelMembers = (teamId: string) => {
        return this.doFetch<ChannelMembership[]>(
            `${this.getUserRoute('me')}/teams/${teamId}/channels/members`,
            {method: 'get'},
        );
    };

    getChannelMembers = (channelId: string, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<ChannelMembership[]>(
            `${this.getChannelMembersRoute(channelId)}${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getChannelTimezones = (channelId: string) => {
        return this.doFetch<string[]>(
            `${this.getChannelRoute(channelId)}/timezones`,
            {method: 'get'},
        );
    };

    getChannelMember = (channelId: string, userId: string) => {
        return this.doFetch<ChannelMembership>(
            `${this.getChannelMemberRoute(channelId, userId)}`,
            {method: 'get'},
        );
    };

    getChannelMembersByIds = (channelId: string, userIds: string[]) => {
        return this.doFetch<ChannelMembership[]>(
            `${this.getChannelMembersRoute(channelId)}/ids`,
            {method: 'post', body: JSON.stringify(userIds)},
        );
    };

    addToChannel = (userId: string, channelId: string, postRootId = '') => {
        this.trackEvent('api', 'api_channels_add_member', {channel_id: channelId});

        const member = {user_id: userId, channel_id: channelId, post_root_id: postRootId};
        return this.doFetch<ChannelMembership>(
            `${this.getChannelMembersRoute(channelId)}`,
            {method: 'post', body: JSON.stringify(member)},
        );
    };

    removeFromChannel = (userId: string, channelId: string) => {
        this.trackEvent('api', 'api_channels_remove_member', {channel_id: channelId});

        return this.doFetch<StatusOK>(
            `${this.getChannelMemberRoute(channelId, userId)}`,
            {method: 'delete'},
        );
    };

    updateChannelMemberRoles = (channelId: string, userId: string, roles: string) => {
        return this.doFetch<StatusOK>(
            `${this.getChannelMemberRoute(channelId, userId)}/roles`,
            {method: 'put', body: JSON.stringify({roles})},
        );
    };

    getChannelStats = (channelId: string) => {
        return this.doFetch<ChannelStats>(
            `${this.getChannelRoute(channelId)}/stats`,
            {method: 'get'},
        );
    };

    getChannelModerations = (channelId: string) => {
        return this.doFetch<ChannelModeration[]>(
            `${this.getChannelRoute(channelId)}/moderations`,
            {method: 'get'},
        );
    };

    patchChannelModerations = (channelId: string, channelModerationsPatch: Array<ChannelModerationPatch>) => {
        return this.doFetch<ChannelModeration[]>(
            `${this.getChannelRoute(channelId)}/moderations/patch`,
            {method: 'put', body: JSON.stringify(channelModerationsPatch)},
        );
    };

    getChannelMemberCountsByGroup = (channelId: string, includeTimezones: boolean) => {
        return this.doFetch<ChannelMemberCountsByGroup>(
            `${this.getChannelRoute(channelId)}/member_counts_by_group?include_timezones=${includeTimezones}`,
            {method: 'get'},
        );
    };

    viewMyChannel = (channelId: string, prevChannelId?: string) => {
        const data = {channel_id: channelId, prev_channel_id: prevChannelId};
        return this.doFetch<ChannelViewResponse>(
            `${this.getChannelsRoute()}/members/me/view`,
            {method: 'post', body: JSON.stringify(data)},
        );
    };

    autocompleteChannels = (teamId: string, name: string) => {
        return this.doFetch<Channel[]>(
            `${this.getTeamRoute(teamId)}/channels/autocomplete${buildQueryString({name})}`,
            {method: 'get'},
        );
    };

    autocompleteChannelsForSearch = (teamId: string, name: string) => {
        return this.doFetch<Channel[]>(
            `${this.getTeamRoute(teamId)}/channels/search_autocomplete${buildQueryString({name})}`,
            {method: 'get'},
        );
    };

    searchChannels = (teamId: string, term: string) => {
        return this.doFetch<Channel[]>(
            `${this.getTeamRoute(teamId)}/channels/search`,
            {method: 'post', body: JSON.stringify({term})},
        );
    };

    searchArchivedChannels = (teamId: string, term: string) => {
        return this.doFetch<Channel[]>(
            `${this.getTeamRoute(teamId)}/channels/search_archived`,
            {method: 'post', body: JSON.stringify({term})},
        );
    };

    searchAllChannels = (term: string, notAssociatedToGroup = '', excludeDefaultChannels = false, page?: number, perPage?: number) => {
        const body = {
            term,
            not_associated_to_group: notAssociatedToGroup,
            exclude_default_channels: excludeDefaultChannels,
            page,
            per_page: perPage,
        };
        return this.doFetch<Channel[] | ChannelsWithTotalCount>(
            `${this.getChannelsRoute()}/search`,
            {method: 'post', body: JSON.stringify(body)},
        );
    };

    searchGroupChannels = (term: string) => {
        return this.doFetch<Channel[]>(
            `${this.getChannelsRoute()}/group/search`,
            {method: 'post', body: JSON.stringify({term})},
        );
    };

    updateChannelMemberSchemeRoles = (channelId: string, userId: string, isSchemeUser: boolean, isSchemeAdmin: boolean) => {
        const body = {scheme_user: isSchemeUser, scheme_admin: isSchemeAdmin};
        return this.doFetch<StatusOK>(
            `${this.getChannelRoute(channelId)}/members/${userId}/schemeRoles`,
            {method: 'put', body: JSON.stringify(body)},
        );
    };

    // Post Routes

    createPost = async (post: Post) => {
        const result = await this.doFetch<Post>(
            `${this.getPostsRoute()}`,
            {method: 'post', body: JSON.stringify(post)},
        );
        const analyticsData = {channel_id: result.channel_id, post_id: result.id, user_actual_id: result.user_id, root_id: result.root_id};
        this.trackEvent('api', 'api_posts_create', analyticsData);

        if (result.root_id != null && result.root_id !== '') {
            this.trackEvent('api', 'api_posts_replied', analyticsData);
        }
        return result;
    };

    updatePost = (post: Post) => {
        this.trackEvent('api', 'api_posts_update', {channel_id: post.channel_id, post_id: post.id});

        return this.doFetch<Post>(
            `${this.getPostRoute(post.id)}`,
            {method: 'put', body: JSON.stringify(post)},
        );
    };

    getPost = (postId: string) => {
        return this.doFetch<Post>(
            `${this.getPostRoute(postId)}`,
            {method: 'get'},
        );
    };

    patchPost = (postPatch: Partial<Post> & {id: string}) => {
        this.trackEvent('api', 'api_posts_patch', {channel_id: postPatch.channel_id, post_id: postPatch.id});

        return this.doFetch<Post>(
            `${this.getPostRoute(postPatch.id)}/patch`,
            {method: 'put', body: JSON.stringify(postPatch)},
        );
    };

    deletePost = (postId: string) => {
        this.trackEvent('api', 'api_posts_delete');

        return this.doFetch<StatusOK>(
            `${this.getPostRoute(postId)}`,
            {method: 'delete'},
        );
    };

    getPostThread = (postId: string, fetchThreads = true) => {
        return this.doFetch<PostList>(
            `${this.getPostRoute(postId)}/thread${buildQueryString({skipFetchThreads: !fetchThreads})}`,
            {method: 'get'},
        );
    };

    getPosts = (channelId: string, page = 0, perPage = PER_PAGE_DEFAULT, fetchThreads = true) => {
        return this.doFetch<PostList>(
            `${this.getChannelRoute(channelId)}/posts${buildQueryString({page, per_page: perPage, skipFetchThreads: !fetchThreads})}`,
            {method: 'get'},
        );
    };

    getPostsUnread = (channelId: string, userId: string, limitAfter = DEFAULT_LIMIT_AFTER, limitBefore = DEFAULT_LIMIT_BEFORE, fetchThreads = true) => {
        return this.doFetch<PostList>(
            `${this.getUserRoute(userId)}/channels/${channelId}/posts/unread${buildQueryString({limit_after: limitAfter, limit_before: limitBefore, skipFetchThreads: !fetchThreads})}`,
            {method: 'get'},
        );
    };

    getPostsSince = (channelId: string, since: number, fetchThreads = true) => {
        return this.doFetch<PostList>(
            `${this.getChannelRoute(channelId)}/posts${buildQueryString({since, skipFetchThreads: !fetchThreads})}`,
            {method: 'get'},
        );
    };

    getPostsBefore = (channelId: string, postId: string, page = 0, perPage = PER_PAGE_DEFAULT, fetchThreads = true) => {
        this.trackEvent('api', 'api_posts_get_before', {channel_id: channelId});

        return this.doFetch<PostList>(
            `${this.getChannelRoute(channelId)}/posts${buildQueryString({before: postId, page, per_page: perPage, skipFetchThreads: !fetchThreads})}`,
            {method: 'get'},
        );
    };

    getPostsAfter = (channelId: string, postId: string, page = 0, perPage = PER_PAGE_DEFAULT, fetchThreads = true) => {
        this.trackEvent('api', 'api_posts_get_after', {channel_id: channelId});

        return this.doFetch<PostList>(
            `${this.getChannelRoute(channelId)}/posts${buildQueryString({after: postId, page, per_page: perPage, skipFetchThreads: !fetchThreads})}`,
            {method: 'get'},
        );
    };

    getFileInfosForPost = (postId: string) => {
        return this.doFetch<FileInfo[]>(
            `${this.getPostRoute(postId)}/files/info`,
            {method: 'get'},
        );
    };

    getFlaggedPosts = (userId: string, channelId = '', teamId = '', page = 0, perPage = PER_PAGE_DEFAULT) => {
        this.trackEvent('api', 'api_posts_get_flagged', {team_id: teamId});

        return this.doFetch<PostList>(
            `${this.getUserRoute(userId)}/posts/flagged${buildQueryString({channel_id: channelId, team_id: teamId, page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getPinnedPosts = (channelId: string) => {
        this.trackEvent('api', 'api_posts_get_pinned', {channel_id: channelId});
        return this.doFetch<PostList>(
            `${this.getChannelRoute(channelId)}/pinned`,
            {method: 'get'},
        );
    };

    markPostAsUnread = (userId: string, postId: string) => {
        this.trackEvent('api', 'api_post_set_unread_post');

        return this.doFetch<ChannelUnread>(
            `${this.getUserRoute(userId)}/posts/${postId}/set_unread`,
            {method: 'post'},
        );
    }

    pinPost = (postId: string) => {
        this.trackEvent('api', 'api_posts_pin');

        return this.doFetch<StatusOK>(
            `${this.getPostRoute(postId)}/pin`,
            {method: 'post'},
        );
    };

    unpinPost = (postId: string) => {
        this.trackEvent('api', 'api_posts_unpin');

        return this.doFetch<StatusOK>(
            `${this.getPostRoute(postId)}/unpin`,
            {method: 'post'},
        );
    };

    addReaction = (userId: string, postId: string, emojiName: string) => {
        this.trackEvent('api', 'api_reactions_save', {post_id: postId});

        return this.doFetch<Reaction>(
            `${this.getReactionsRoute()}`,
            {method: 'post', body: JSON.stringify({user_id: userId, post_id: postId, emoji_name: emojiName})},
        );
    };

    removeReaction = (userId: string, postId: string, emojiName: string) => {
        this.trackEvent('api', 'api_reactions_delete', {post_id: postId});

        return this.doFetch<StatusOK>(
            `${this.getUserRoute(userId)}/posts/${postId}/reactions/${emojiName}`,
            {method: 'delete'},
        );
    };

    getReactionsForPost = (postId: string) => {
        return this.doFetch<Reaction[]>(
            `${this.getPostRoute(postId)}/reactions`,
            {method: 'get'},
        );
    };

    searchPostsWithParams = (teamId: string, params: any) => {
        this.trackEvent('api', 'api_posts_search', {team_id: teamId});

        return this.doFetch<PostSearchResults>(
            `${this.getTeamRoute(teamId)}/posts/search`,
            {method: 'post', body: JSON.stringify(params)},
        );
    };

    searchPosts = (teamId: string, terms: string, isOrSearch: boolean) => {
        return this.searchPostsWithParams(teamId, {terms, is_or_search: isOrSearch});
    };

    getOpenGraphMetadata = (url: string) => {
        return this.doFetch<OpenGraphMetadata>(
            `${this.getBaseRoute()}/opengraph`,
            {method: 'post', body: JSON.stringify({url})},
        );
    };

    doPostAction = (postId: string, actionId: string, selectedOption = '') => {
        return this.doPostActionWithCookie(postId, actionId, '', selectedOption);
    };

    doPostActionWithCookie = (postId: string, actionId: string, actionCookie: string, selectedOption = '') => {
        if (selectedOption) {
            this.trackEvent('api', 'api_interactive_messages_menu_selected');
        } else {
            this.trackEvent('api', 'api_interactive_messages_button_clicked');
        }

        const msg: any = {
            selected_option: selectedOption,
        };
        if (actionCookie !== '') {
            msg.cookie = actionCookie;
        }
        return this.doFetch<PostActionResponse>(
            `${this.getPostRoute(postId)}/actions/${encodeURIComponent(actionId)}`,
            {method: 'post', body: JSON.stringify(msg)},
        );
    };

    // Files Routes

    getFileUrl(fileId: string, timestamp: number) {
        let url = `${this.getFileRoute(fileId)}`;
        if (timestamp) {
            url += `?${timestamp}`;
        }

        return url;
    }

    getFileThumbnailUrl(fileId: string, timestamp: number) {
        let url = `${this.getFileRoute(fileId)}/thumbnail`;
        if (timestamp) {
            url += `?${timestamp}`;
        }

        return url;
    }

    getFilePreviewUrl(fileId: string, timestamp: number) {
        let url = `${this.getFileRoute(fileId)}/preview`;
        if (timestamp) {
            url += `?${timestamp}`;
        }

        return url;
    }

    uploadFile = (fileFormData: any, formBoundary: string) => {
        this.trackEvent('api', 'api_files_upload');
        const request: any = {
            method: 'post',
            body: fileFormData,
        };

        if (formBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formBoundary}`,
            };
        }

        return this.doFetch<FileUploadResponse>(
            `${this.getFilesRoute()}`,
            request,
        );
    };

    getFilePublicLink = (fileId: string) => {
        return this.doFetch<{
            link: string;
        }>(
            `${this.getFileRoute(fileId)}/link`,
            {method: 'get'},
        );
    }

    // Preference Routes

    savePreferences = (userId: string, preferences: PreferenceType[]) => {
        return this.doFetch<StatusOK>(
            `${this.getPreferencesRoute(userId)}`,
            {method: 'put', body: JSON.stringify(preferences)},
        );
    };

    getMyPreferences = () => {
        return this.doFetch<PreferenceType>(
            `${this.getPreferencesRoute('me')}`,
            {method: 'get'},
        );
    };

    deletePreferences = (userId: string, preferences: PreferenceType[]) => {
        return this.doFetch<StatusOK>(
            `${this.getPreferencesRoute(userId)}/delete`,
            {method: 'post', body: JSON.stringify(preferences)},
        );
    };

    // General Routes

    ping = () => {
        return this.doFetch<{
            status: string;
        }>(
            `${this.getBaseRoute()}/system/ping?time=${Date.now()}`,
            {method: 'get'},
        );
    };

    logClientError = (message: string, level = 'ERROR') => {
        const url = `${this.getBaseRoute()}/logs`;

        if (!this.enableLogging) {
            throw new ClientError(this.getUrl(), {
                message: 'Logging disabled.',
                url,
            });
        }

        return this.doFetch<{
            message: string;
        }>(
            url,
            {method: 'post', body: JSON.stringify({message, level})},
        );
    };

    getClientConfigOld = () => {
        return this.doFetch<ClientConfig>(
            `${this.getBaseRoute()}/config/client?format=old`,
            {method: 'get'},
        );
    };

    getClientLicenseOld = () => {
        return this.doFetch<ClientLicense>(
            `${this.getBaseRoute()}/license/client?format=old`,
            {method: 'get'},
        );
    };

    getWarnMetricsStatus = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/warn_metrics/status`,
            {method: 'get'},
        );
    };

    sendWarnMetricAck = async (warnMetricId: string, forceAckVal: boolean) => {
        return this.doFetch(
            `${this.getBaseRoute()}/warn_metrics/ack/${encodeURI(warnMetricId)}`,
            {method: 'post', body: JSON.stringify({forceAck: forceAckVal})},
        );
    }

    getTranslations = (url: string) => {
        return this.doFetch<Record<string, string>>(
            url,
            {method: 'get'},
        );
    };

    getWebSocketUrl = () => {
        return `${this.getBaseRoute()}/websocket`;
    }

    // Integration Routes

    createIncomingWebhook = (hook: IncomingWebhook) => {
        this.trackEvent('api', 'api_integrations_created', {team_id: hook.team_id});

        return this.doFetch<IncomingWebhook>(
            `${this.getIncomingHooksRoute()}`,
            {method: 'post', body: JSON.stringify(hook)},
        );
    };

    getIncomingWebhook = (hookId: string) => {
        return this.doFetch<IncomingWebhook>(
            `${this.getIncomingHookRoute(hookId)}`,
            {method: 'get'},
        );
    };

    getIncomingWebhooks = (teamId = '', page = 0, perPage = PER_PAGE_DEFAULT) => {
        const queryParams: any = {
            page,
            per_page: perPage,
        };

        if (teamId) {
            queryParams.team_id = teamId;
        }

        return this.doFetch<IncomingWebhook[]>(
            `${this.getIncomingHooksRoute()}${buildQueryString(queryParams)}`,
            {method: 'get'},
        );
    };

    removeIncomingWebhook = (hookId: string) => {
        this.trackEvent('api', 'api_integrations_deleted');

        return this.doFetch<StatusOK>(
            `${this.getIncomingHookRoute(hookId)}`,
            {method: 'delete'},
        );
    };

    updateIncomingWebhook = (hook: IncomingWebhook) => {
        this.trackEvent('api', 'api_integrations_updated', {team_id: hook.team_id});

        return this.doFetch<IncomingWebhook>(
            `${this.getIncomingHookRoute(hook.id)}`,
            {method: 'put', body: JSON.stringify(hook)},
        );
    };

    createOutgoingWebhook = (hook: OutgoingWebhook) => {
        this.trackEvent('api', 'api_integrations_created', {team_id: hook.team_id});

        return this.doFetch<OutgoingWebhook>(
            `${this.getOutgoingHooksRoute()}`,
            {method: 'post', body: JSON.stringify(hook)},
        );
    };

    getOutgoingWebhook = (hookId: string) => {
        return this.doFetch<OutgoingWebhook>(
            `${this.getOutgoingHookRoute(hookId)}`,
            {method: 'get'},
        );
    };

    getOutgoingWebhooks = (channelId = '', teamId = '', page = 0, perPage = PER_PAGE_DEFAULT) => {
        const queryParams: any = {
            page,
            per_page: perPage,
        };

        if (channelId) {
            queryParams.channel_id = channelId;
        }

        if (teamId) {
            queryParams.team_id = teamId;
        }

        return this.doFetch<OutgoingWebhook[]>(
            `${this.getOutgoingHooksRoute()}${buildQueryString(queryParams)}`,
            {method: 'get'},
        );
    };

    removeOutgoingWebhook = (hookId: string) => {
        this.trackEvent('api', 'api_integrations_deleted');

        return this.doFetch<StatusOK>(
            `${this.getOutgoingHookRoute(hookId)}`,
            {method: 'delete'},
        );
    };

    updateOutgoingWebhook = (hook: OutgoingWebhook) => {
        this.trackEvent('api', 'api_integrations_updated', {team_id: hook.team_id});

        return this.doFetch<OutgoingWebhook>(
            `${this.getOutgoingHookRoute(hook.id)}`,
            {method: 'put', body: JSON.stringify(hook)},
        );
    };

    regenOutgoingHookToken = (id: string) => {
        return this.doFetch<OutgoingWebhook>(
            `${this.getOutgoingHookRoute(id)}/regen_token`,
            {method: 'post'},
        );
    };

    getCommandsList = (teamId: string) => {
        return this.doFetch<Command[]>(
            `${this.getCommandsRoute()}?team_id=${teamId}`,
            {method: 'get'},
        );
    };

    getCommandAutocompleteSuggestionsList = (userInput: string, teamId: string) => {
        return this.doFetch<AutocompleteSuggestion[]>(
            `${this.getTeamRoute(teamId)}/commands/autocomplete_suggestions${buildQueryString({user_input: userInput})}`,
            {method: 'get'},
        );
    };

    getAutocompleteCommandsList = (teamId: string, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<Command[]>(
            `${this.getTeamRoute(teamId)}/commands/autocomplete${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getCustomTeamCommands = (teamId: string) => {
        return this.doFetch<Command[]>(
            `${this.getCommandsRoute()}?team_id=${teamId}&custom_only=true`,
            {method: 'get'},
        );
    };

    executeCommand = (command: Command, commandArgs = {}) => {
        this.trackEvent('api', 'api_integrations_used');

        return this.doFetch<CommandResponse>(
            `${this.getCommandsRoute()}/execute`,
            {method: 'post', body: JSON.stringify({command, ...commandArgs})},
        );
    };

    addCommand = (command: Command) => {
        this.trackEvent('api', 'api_integrations_created');

        return this.doFetch<Command>(
            `${this.getCommandsRoute()}`,
            {method: 'post', body: JSON.stringify(command)},
        );
    };

    editCommand = (command: Command) => {
        this.trackEvent('api', 'api_integrations_created');

        return this.doFetch<Command>(
            `${this.getCommandsRoute()}/${command.id}`,
            {method: 'put', body: JSON.stringify(command)},
        );
    };

    regenCommandToken = (id: string) => {
        return this.doFetch<{
            token: string;
        }>(
            `${this.getCommandsRoute()}/${id}/regen_token`,
            {method: 'put'},
        );
    };

    deleteCommand = (id: string) => {
        this.trackEvent('api', 'api_integrations_deleted');

        return this.doFetch<StatusOK>(
            `${this.getCommandsRoute()}/${id}`,
            {method: 'delete'},
        );
    };

    createOAuthApp = (app: OAuthApp) => {
        this.trackEvent('api', 'api_apps_register');

        return this.doFetch<OAuthApp>(
            `${this.getOAuthAppsRoute()}`,
            {method: 'post', body: JSON.stringify(app)},
        );
    };

    editOAuthApp = (app: OAuthApp) => {
        return this.doFetch<OAuthApp>(
            `${this.getOAuthAppsRoute()}/${app.id}`,
            {method: 'put', body: JSON.stringify(app)},
        );
    };

    getOAuthApps = (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<OAuthApp[]>(
            `${this.getOAuthAppsRoute()}${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getOAuthApp = (appId: string) => {
        return this.doFetch<OAuthApp>(
            `${this.getOAuthAppRoute(appId)}`,
            {method: 'get'},
        );
    };

    getOAuthAppInfo = (appId: string) => {
        return this.doFetch<OAuthApp>(
            `${this.getOAuthAppRoute(appId)}/info`,
            {method: 'get'},
        );
    };

    deleteOAuthApp = (appId: string) => {
        this.trackEvent('api', 'api_apps_delete');

        return this.doFetch<StatusOK>(
            `${this.getOAuthAppRoute(appId)}`,
            {method: 'delete'},
        );
    };

    regenOAuthAppSecret = (appId: string) => {
        return this.doFetch<OAuthApp>(
            `${this.getOAuthAppRoute(appId)}/regen_secret`,
            {method: 'post'},
        );
    };

    submitInteractiveDialog = (data: DialogSubmission) => {
        this.trackEvent('api', 'api_interactive_messages_dialog_submitted');
        return this.doFetch<SubmitDialogResponse>(
            `${this.getBaseRoute()}/actions/dialogs/submit`,
            {method: 'post', body: JSON.stringify(data)},
        );
    };

    // Emoji Routes

    createCustomEmoji = (emoji: CustomEmoji, imageData: File) => {
        this.trackEvent('api', 'api_emoji_custom_add');

        const formData = new FormData();
        formData.append('image', imageData);
        formData.append('emoji', JSON.stringify(emoji));
        const request: any = {
            method: 'post',
            body: formData,
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            };
        }

        return this.doFetch<CustomEmoji>(
            `${this.getEmojisRoute()}`,
            request,
        );
    };

    getCustomEmoji = (id: string) => {
        return this.doFetch<CustomEmoji>(
            `${this.getEmojisRoute()}/${id}`,
            {method: 'get'},
        );
    };

    getCustomEmojiByName = (name: string) => {
        return this.doFetch<CustomEmoji>(
            `${this.getEmojisRoute()}/name/${name}`,
            {method: 'get'},
        );
    };

    getCustomEmojis = (page = 0, perPage = PER_PAGE_DEFAULT, sort = '') => {
        return this.doFetch<CustomEmoji[]>(
            `${this.getEmojisRoute()}${buildQueryString({page, per_page: perPage, sort})}`,
            {method: 'get'},
        );
    };

    deleteCustomEmoji = (emojiId: string) => {
        this.trackEvent('api', 'api_emoji_custom_delete');

        return this.doFetch<StatusOK>(
            `${this.getEmojiRoute(emojiId)}`,
            {method: 'delete'},
        );
    };

    getSystemEmojiImageUrl = (filename: string) => {
        return `${this.url}/static/emoji/${filename}.png`;
    };

    getCustomEmojiImageUrl = (id: string) => {
        return `${this.getEmojiRoute(id)}/image`;
    };

    searchCustomEmoji = (term: string, options = {}) => {
        return this.doFetch<CustomEmoji[]>(
            `${this.getEmojisRoute()}/search`,
            {method: 'post', body: JSON.stringify({term, ...options})},
        );
    };

    autocompleteCustomEmoji = (name: string) => {
        return this.doFetch<CustomEmoji[]>(
            `${this.getEmojisRoute()}/autocomplete${buildQueryString({name})}`,
            {method: 'get'},
        );
    };

    // Timezone Routes

    getTimezones = () => {
        return this.doFetch<string[]>(
            `${this.getTimezonesRoute()}`,
            {method: 'get'},
        );
    };

    // Data Retention

    getDataRetentionPolicy = () => {
        return this.doFetch<DataRetentionPolicy>(
            `${this.getDataRetentionRoute()}/policy`,
            {method: 'get'},
        );
    };

    // Jobs Routes

    getJob = (id: string) => {
        return this.doFetch<Job>(
            `${this.getJobsRoute()}/${id}`,
            {method: 'get'},
        );
    };

    getJobs = (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<Job[]>(
            `${this.getJobsRoute()}${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getJobsByType = (type: string, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<Job[]>(
            `${this.getJobsRoute()}/type/${type}${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    createJob = (job: Job) => {
        return this.doFetch<Job>(
            `${this.getJobsRoute()}`,
            {method: 'post', body: JSON.stringify(job)},
        );
    };

    cancelJob = (id: string) => {
        return this.doFetch<StatusOK>(
            `${this.getJobsRoute()}/${id}/cancel`,
            {method: 'post'},
        );
    };

    // Admin Routes

    getLogs = (page = 0, perPage = LOGS_PER_PAGE_DEFAULT) => {
        return this.doFetch<string[]>(
            `${this.getBaseRoute()}/logs${buildQueryString({page, logs_per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getAudits = (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<Audit[]>(
            `${this.getBaseRoute()}/audits${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getConfig = () => {
        return this.doFetch<Config>(
            `${this.getBaseRoute()}/config`,
            {method: 'get'},
        );
    };

    updateConfig = (config: Config) => {
        return this.doFetch<Config>(
            `${this.getBaseRoute()}/config`,
            {method: 'put', body: JSON.stringify(config)},
        );
    };

    reloadConfig = () => {
        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/config/reload`,
            {method: 'post'},
        );
    };

    getEnvironmentConfig = () => {
        return this.doFetch<EnvironmentConfig>(
            `${this.getBaseRoute()}/config/environment`,
            {method: 'get'},
        );
    };

    testEmail = (config: Config) => {
        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/email/test`,
            {method: 'post', body: JSON.stringify(config)},
        );
    };

    testSiteURL = (siteURL: string) => {
        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/site_url/test`,
            {method: 'post', body: JSON.stringify({site_url: siteURL})},
        );
    };

    testS3Connection = (config: ClientConfig) => {
        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/file/s3_test`,
            {method: 'post', body: JSON.stringify(config)},
        );
    };

    invalidateCaches = () => {
        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/caches/invalidate`,
            {method: 'post'},
        );
    };

    recycleDatabase = () => {
        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/database/recycle`,
            {method: 'post'},
        );
    };

    createComplianceReport = (job: Job) => {
        return this.doFetch<Compliance>(
            `${this.getBaseRoute()}/compliance/reports`,
            {method: 'post', body: JSON.stringify(job)},
        );
    };

    getComplianceReport = (reportId: string) => {
        return this.doFetch<Compliance>(
            `${this.getBaseRoute()}/compliance/reports/${reportId}`,
            {method: 'get'},
        );
    };

    getComplianceReports = (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<Compliance[]>(
            `${this.getBaseRoute()}/compliance/reports${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    uploadBrandImage = (imageData: File) => {
        const formData = new FormData();
        formData.append('image', imageData);
        const request: any = {
            method: 'post',
            body: formData,
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            };
        }

        return this.doFetch<StatusOK>(
            `${this.getBrandRoute()}/image`,
            request,
        );
    };

    deleteBrandImage = () => {
        return this.doFetch<StatusOK>(
            `${this.getBrandRoute()}/image`,
            {method: 'delete'},
        );
    };

    getClusterStatus = () => {
        return this.doFetch<ClusterInfo[]>(
            `${this.getBaseRoute()}/cluster/status`,
            {method: 'get'},
        );
    };

    testLdap = () => {
        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/ldap/test`,
            {method: 'post'},
        );
    };

    syncLdap = () => {
        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/ldap/sync`,
            {method: 'post'},
        );
    };

    getLdapGroups = (page = 0, perPage = PER_PAGE_DEFAULT, opts = {}) => {
        const query = {page, per_page: perPage, ...opts};
        return this.doFetch<{
            count: number;
            groups: MixedUnlinkedGroup[];
        }>(
            `${this.getBaseRoute()}/ldap/groups${buildQueryString(query)}`,
            {method: 'get'},
        );
    };

    linkLdapGroup = (key: string) => {
        return this.doFetch<Group>(
            `${this.getBaseRoute()}/ldap/groups/${encodeURI(key)}/link`,
            {method: 'post'},
        );
    };

    unlinkLdapGroup = (key: string) => {
        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/ldap/groups/${encodeURI(key)}/link`,
            {method: 'delete'},
        );
    };

    getSamlCertificateStatus = () => {
        return this.doFetch<SamlCertificateStatus>(
            `${this.getBaseRoute()}/saml/certificate/status`,
            {method: 'get'},
        );
    };

    uploadPublicSamlCertificate = (fileData: File) => {
        const formData = new FormData();
        formData.append('certificate', fileData);

        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/saml/certificate/public`,
            {
                method: 'post',
                body: formData,
            },
        );
    };

    uploadPrivateSamlCertificate = (fileData: File) => {
        const formData = new FormData();
        formData.append('certificate', fileData);

        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/saml/certificate/private`,
            {
                method: 'post',
                body: formData,
            },
        );
    };

    uploadIdpSamlCertificate = (fileData: File) => {
        const formData = new FormData();
        formData.append('certificate', fileData);

        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/saml/certificate/idp`,
            {
                method: 'post',
                body: formData,
            },
        );
    };

    deletePublicSamlCertificate = () => {
        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/saml/certificate/public`,
            {method: 'delete'},
        );
    };

    deletePrivateSamlCertificate = () => {
        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/saml/certificate/private`,
            {method: 'delete'},
        );
    };

    deleteIdpSamlCertificate = () => {
        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/saml/certificate/idp`,
            {method: 'delete'},
        );
    };

    testElasticsearch = (config: ClientConfig) => {
        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/elasticsearch/test`,
            {method: 'post', body: JSON.stringify(config)},
        );
    };

    purgeElasticsearchIndexes = () => {
        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/elasticsearch/purge_indexes`,
            {method: 'post'},
        );
    };

    purgeBleveIndexes = () => {
        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/bleve/purge_indexes`,
            {method: 'post'},
        );
    };

    uploadLicense = (fileData: File) => {
        this.trackEvent('api', 'api_license_upload');

        const formData = new FormData();
        formData.append('license', fileData);

        const request: any = {
            method: 'post',
            body: formData,
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            };
        }

        return this.doFetch<License>(
            `${this.getBaseRoute()}/license`,
            request,
        );
    };

    removeLicense = () => {
        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/license`,
            {method: 'delete'},
        );
    };

    getAnalytics = (name = 'standard', teamId = '') => {
        return this.doFetch<AnalyticsRow[]>(
            `${this.getBaseRoute()}/analytics/old${buildQueryString({name, team_id: teamId})}`,
            {method: 'get'},
        );
    };

    // Role Routes

    getRole = (roleId: string) => {
        return this.doFetch<Role>(
            `${this.getRolesRoute()}/${roleId}`,
            {method: 'get'},
        );
    };

    getRoleByName = (roleName: string) => {
        return this.doFetch<Role>(
            `${this.getRolesRoute()}/name/${roleName}`,
            {method: 'get'},
        );
    };

    getRolesByNames = (rolesNames: string[]) => {
        return this.doFetch<Role[]>(
            `${this.getRolesRoute()}/names`,
            {method: 'post', body: JSON.stringify(rolesNames)},
        );
    };

    patchRole = (roleId: string, rolePatch: Partial<Role>) => {
        return this.doFetch<Role>(
            `${this.getRolesRoute()}/${roleId}/patch`,
            {method: 'put', body: JSON.stringify(rolePatch)},
        );
    };

    // Scheme Routes

    getSchemes = (scope = '', page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<Scheme[]>(
            `${this.getSchemesRoute()}${buildQueryString({scope, page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    createScheme = (scheme: Scheme) => {
        this.trackEvent('api', 'api_schemes_create');

        return this.doFetch<Scheme>(
            `${this.getSchemesRoute()}`,
            {method: 'post', body: JSON.stringify(scheme)},
        );
    };

    getScheme = (schemeId: string) => {
        return this.doFetch<Scheme>(
            `${this.getSchemesRoute()}/${schemeId}`,
            {method: 'get'},
        );
    };

    deleteScheme = (schemeId: string) => {
        this.trackEvent('api', 'api_schemes_delete');

        return this.doFetch<StatusOK>(
            `${this.getSchemesRoute()}/${schemeId}`,
            {method: 'delete'},
        );
    };

    patchScheme = (schemeId: string, schemePatch: Partial<Scheme>) => {
        this.trackEvent('api', 'api_schemes_patch', {scheme_id: schemeId});

        return this.doFetch<Scheme>(
            `${this.getSchemesRoute()}/${schemeId}/patch`,
            {method: 'put', body: JSON.stringify(schemePatch)},
        );
    };

    getSchemeTeams = (schemeId: string, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<Team[]>(
            `${this.getSchemesRoute()}/${schemeId}/teams${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getSchemeChannels = (schemeId: string, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<Channel[]>(
            `${this.getSchemesRoute()}/${schemeId}/channels${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    // Plugin Routes - EXPERIMENTAL - SUBJECT TO CHANGE

    uploadPlugin = async (fileData: File, force = false) => {
        this.trackEvent('api', 'api_plugin_upload');

        const formData = new FormData();
        if (force) {
            formData.append('force', 'true');
        }
        formData.append('plugin', fileData);

        const request: any = {
            method: 'post',
            body: formData,
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            };
        }

        return this.doFetch<PluginManifest>(
            this.getPluginsRoute(),
            request,
        );
    };

    installPluginFromUrl = (pluginDownloadUrl: string, force = false) => {
        this.trackEvent('api', 'api_install_plugin');

        const queryParams = {plugin_download_url: pluginDownloadUrl, force};

        return this.doFetch<PluginManifest>(
            `${this.getPluginsRoute()}/install_from_url${buildQueryString(queryParams)}`,
            {method: 'post'},
        );
    };

    getPlugins = () => {
        return this.doFetch<PluginsResponse>(
            this.getPluginsRoute(),
            {method: 'get'},
        );
    };

    getMarketplacePlugins = (filter: string, localOnly = false) => {
        return this.doFetch<MarketplacePlugin>(
            `${this.getPluginsMarketplaceRoute()}${buildQueryString({filter: filter || '', local_only: localOnly})}`,
            {method: 'get'},
        );
    }

    installMarketplacePlugin = (id: string, version: string) => {
        this.trackEvent('api', 'api_install_marketplace_plugin');

        return this.doFetch<MarketplacePlugin>(
            `${this.getPluginsMarketplaceRoute()}`,
            {method: 'post', body: JSON.stringify({id, version})},
        );
    }

    getPluginStatuses = () => {
        return this.doFetch<PluginStatus[]>(
            `${this.getPluginsRoute()}/statuses`,
            {method: 'get'},
        );
    };

    removePlugin = (pluginId: string) => {
        return this.doFetch<StatusOK>(
            this.getPluginRoute(pluginId),
            {method: 'delete'},
        );
    };

    getWebappPlugins = () => {
        return this.doFetch<ClientPluginManifest[]>(
            `${this.getPluginsRoute()}/webapp`,
            {method: 'get'},
        );
    };

    enablePlugin = (pluginId: string) => {
        return this.doFetch<StatusOK>(
            `${this.getPluginRoute(pluginId)}/enable`,
            {method: 'post'},
        );
    };

    disablePlugin = (pluginId: string) => {
        return this.doFetch<StatusOK>(
            `${this.getPluginRoute(pluginId)}/disable`,
            {method: 'post'},
        );
    };

    // Groups

    linkGroupSyncable = (groupID: string, syncableID: string, syncableType: string, patch: SyncablePatch) => {
        return this.doFetch<GroupSyncable>(
            `${this.getBaseRoute()}/groups/${groupID}/${syncableType}s/${syncableID}/link`,
            {method: 'post', body: JSON.stringify(patch)},
        );
    };

    unlinkGroupSyncable = (groupID: string, syncableID: string, syncableType: string) => {
        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/groups/${groupID}/${syncableType}s/${syncableID}/link`,
            {method: 'delete'},
        );
    };

    getGroupSyncables = (groupID: string, syncableType: string) => {
        return this.doFetch<GroupSyncable[]>(
            `${this.getBaseRoute()}/groups/${groupID}/${syncableType}s`,
            {method: 'get'},
        );
    };

    getGroupMembers = (groupID: string, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<{
            members: UserProfile[];
            total_member_count: number;
        }>(
            `${this.getBaseRoute()}/groups/${groupID}/members${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getGroup = (groupID: string) => {
        return this.doFetch<Group>(
            `${this.getBaseRoute()}/groups/${groupID}`,
            {method: 'get'},
        );
    };

    getGroups = (filterAllowReference = false) => {
        return this.doFetch<Group[]>(
            `${this.getBaseRoute()}/groups${buildQueryString({filter_allow_reference: filterAllowReference})}`,
            {method: 'get'},
        );
    };

    getGroupsByUserId = (userID: string) => {
        return this.doFetch<Group[]>(
            `${this.getUsersRoute()}/${userID}/groups`,
            {method: 'get'},
        );
    }

    getGroupsNotAssociatedToTeam = (teamID: string, q = '', page = 0, perPage = PER_PAGE_DEFAULT) => {
        this.trackEvent('api', 'api_groups_get_not_associated_to_team', {team_id: teamID});
        return this.doFetch<Group[]>(
            `${this.getBaseRoute()}/groups${buildQueryString({not_associated_to_team: teamID, page, per_page: perPage, q, include_member_count: true})}`,
            {method: 'get'},
        );
    };

    getGroupsNotAssociatedToChannel = (channelID: string, q = '', page = 0, perPage = PER_PAGE_DEFAULT, filterParentTeamPermitted = false) => {
        this.trackEvent('api', 'api_groups_get_not_associated_to_channel', {channel_id: channelID});
        const query = {
            not_associated_to_channel: channelID,
            page,
            per_page: perPage,
            q,
            include_member_count: true,
            filter_parent_team_permitted: filterParentTeamPermitted,
        };
        return this.doFetch<Group[]>(
            `${this.getBaseRoute()}/groups${buildQueryString(query)}`,
            {method: 'get'},
        );
    };

    getGroupsAssociatedToTeam = (teamID: string, q = '', page = 0, perPage = PER_PAGE_DEFAULT, filterAllowReference = false) => {
        this.trackEvent('api', 'api_groups_get_associated_to_team', {team_id: teamID});

        return this.doFetch<{
            groups: Group[];
            total_group_count: number;
        }>(
            `${this.getBaseRoute()}/teams/${teamID}/groups${buildQueryString({page, per_page: perPage, q, include_member_count: true, filter_allow_reference: filterAllowReference})}`,
            {method: 'get'},
        );
    };

    getGroupsAssociatedToChannel = (channelID: string, q = '', page = 0, perPage = PER_PAGE_DEFAULT, filterAllowReference = false) => {
        this.trackEvent('api', 'api_groups_get_associated_to_channel', {channel_id: channelID});

        return this.doFetch<{
            groups: Group[];
            total_group_count: number;
        }>(
            `${this.getBaseRoute()}/channels/${channelID}/groups${buildQueryString({page, per_page: perPage, q, include_member_count: true, filter_allow_reference: filterAllowReference})}`,
            {method: 'get'},
        );
    };

    getAllGroupsAssociatedToTeam = (teamID: string, filterAllowReference = false) => {
        return this.doFetch<GroupsWithCount>(
            `${this.getBaseRoute()}/teams/${teamID}/groups${buildQueryString({paginate: false, filter_allow_reference: filterAllowReference})}`,
            {method: 'get'},
        );
    };

    getAllGroupsAssociatedToChannelsInTeam = (teamID: string, filterAllowReference = false) => {
        return this.doFetch<{
            groups: RelationOneToOne<Channel, Group>;
        }>(
            `${this.getBaseRoute()}/teams/${teamID}/groups_by_channels${buildQueryString({paginate: false, filter_allow_reference: filterAllowReference})}`,
            {method: 'get'},
        );
    };

    getAllGroupsAssociatedToChannel = (channelID: string, filterAllowReference = false) => {
        return this.doFetch<GroupsWithCount>(
            `${this.getBaseRoute()}/channels/${channelID}/groups${buildQueryString({paginate: false, filter_allow_reference: filterAllowReference})}`,
            {method: 'get'},
        );
    };

    patchGroupSyncable = (groupID: string, syncableID: string, syncableType: string, patch: SyncablePatch) => {
        return this.doFetch<GroupSyncable>(
            `${this.getBaseRoute()}/groups/${groupID}/${syncableType}s/${syncableID}/patch`,
            {method: 'put', body: JSON.stringify(patch)},
        );
    };

    patchGroup = (groupID: string, patch: GroupPatch) => {
        return this.doFetch<Group>(
            `${this.getBaseRoute()}/groups/${groupID}/patch`,
            {method: 'put', body: JSON.stringify(patch)},
        );
    };

    // Redirect Location
    getRedirectLocation = (urlParam: string) => {
        if (!urlParam.length) {
            return Promise.resolve();
        }
        const url = `${this.getRedirectLocationRoute()}${buildQueryString({url: urlParam})}`;
        return this.doFetch<{
            location: string;
        }>(url, {method: 'get'});
    };

    // Bot Routes

    createBot = (bot: Bot) => {
        return this.doFetch<Bot>(
            `${this.getBotsRoute()}`,
            {method: 'post', body: JSON.stringify(bot)},
        );
    }

    patchBot = (botUserId: string, botPatch: BotPatch) => {
        return this.doFetch<Bot>(
            `${this.getBotRoute(botUserId)}`,
            {method: 'put', body: JSON.stringify(botPatch)},
        );
    }

    getBot = (botUserId: string) => {
        return this.doFetch<Bot>(
            `${this.getBotRoute(botUserId)}`,
            {method: 'get'},
        );
    }

    getBots = (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<Bot[]>(
            `${this.getBotsRoute()}${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    }

    getBotsIncludeDeleted = (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<Bot>(
            `${this.getBotsRoute()}${buildQueryString({include_deleted: true, page, per_page: perPage})}`,
            {method: 'get'},
        );
    }

    getBotsOrphaned = (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch<Bot>(
            `${this.getBotsRoute()}${buildQueryString({only_orphaned: true, page, per_page: perPage})}`,
            {method: 'get'},
        );
    }

    disableBot = (botUserId: string) => {
        return this.doFetch<Bot>(
            `${this.getBotRoute(botUserId)}/disable`,
            {method: 'post'},
        );
    }

    enableBot = (botUserId: string) => {
        return this.doFetch<Bot>(
            `${this.getBotRoute(botUserId)}/enable`,
            {method: 'post'},
        );
    }

    assignBot = (botUserId: string, newOwnerId: string) => {
        return this.doFetch<Bot>(
            `${this.getBotRoute(botUserId)}/assign/${newOwnerId}`,
            {method: 'post'},
        );
    }

    teamMembersMinusGroupMembers = (teamID: string, groupIDs: string[], page: number, perPage: number) => {
        const query = `group_ids=${groupIDs.join(',')}&page=${page}&per_page=${perPage}`;
        return this.doFetch<UsersWithGroupsAndCount>(
            `${this.getTeamRoute(teamID)}/members_minus_group_members?${query}`,
            {method: 'get'},
        );
    }

    channelMembersMinusGroupMembers = (channelID: string, groupIDs: string[], page: number, perPage: number) => {
        const query = `group_ids=${groupIDs.join(',')}&page=${page}&per_page=${perPage}`;
        return this.doFetch<UsersWithGroupsAndCount>(
            `${this.getChannelRoute(channelID)}/members_minus_group_members?${query}`,
            {method: 'get'},
        );
    }

    getSamlMetadataFromIdp = (samlMetadataURL: string) => {
        return this.doFetch<SamlMetadataResponse>(
            `${this.getBaseRoute()}/saml/metadatafromidp`, {method: 'post', body: JSON.stringify({saml_metadata_url: samlMetadataURL})},
        );
    };

    setSamlIdpCertificateFromMetadata = (certData: string) => {
        const request: any = {
            method: 'post',
            body: certData,
        };

        request.headers = {
            'Content-Type': 'application/x-pem-file',
        };

        return this.doFetch<StatusOK>(
            `${this.getBaseRoute()}/saml/certificate/idp`,
            request,
        );
    };

    // Client Helpers

    doFetch = async <T>(url: string, options: Options): Promise<T> => {
        const {data} = await this.doFetchWithResponse<T>(url, options);

        return data;
    };

    doFetchWithResponse = async <T>(url: string, options: Options): Promise<ClientResponse<T>> => {
        const response = await fetch(url, this.getOptions(options));
        const headers = parseAndMergeNestedHeaders(response.headers);

        let data;
        try {
            data = await response.json();
        } catch (err) {
            throw new ClientError(this.getUrl(), {
                message: 'Received invalid response from the server.',
                intl: {
                    id: 'mobile.request.invalid_response',
                    defaultMessage: 'Received invalid response from the server.',
                },
                url,
            });
        }

        if (headers.has(HEADER_X_VERSION_ID) && !headers.get('Cache-Control')) {
            const serverVersion = headers.get(HEADER_X_VERSION_ID);
            if (serverVersion && this.serverVersion !== serverVersion) {
                this.serverVersion = serverVersion;
            }
        }

        if (headers.has(HEADER_X_CLUSTER_ID)) {
            const clusterId = headers.get(HEADER_X_CLUSTER_ID);
            if (clusterId && this.clusterId !== clusterId) {
                this.clusterId = clusterId;
            }
        }

        if (response.ok) {
            return {
                response,
                headers,
                data,
            };
        }

        const msg = data.message || '';

        if (this.logToConsole) {
            console.error(msg); // eslint-disable-line no-console
        }

        throw new ClientError(this.getUrl(), {
            message: msg,
            server_error_id: data.id,
            status_code: data.status_code,
            url,
        });
    };

    trackEvent(category: string, event: string, props?: any) {
        const properties = Object.assign({
            category,
            type: event,
            user_actual_role: this.userRoles && isSystemAdmin(this.userRoles) ? 'system_admin, system_user' : 'system_user',
            user_actual_id: this.userId,
        }, props);
        const options = {
            context: {
                ip: '0.0.0.0',
            },
            page: {
                path: '',
                referrer: '',
                search: '',
                title: '',
                url: '',
            },
            anonymousId: '00000000000000000000000000',
        };

        const globalAny: any = global;

        if (globalAny && globalAny.window && globalAny.window.rudderanalytics) {
            globalAny.window.rudderanalytics.track('event', properties, options);
        } else if (globalAny && globalAny.rudderanalytics) {
            if (globalAny.analytics_context) {
                options.context = globalAny.analytics_context;
            }

            globalAny.rudderanalytics.track(Object.assign({
                event: 'event',
                userId: this.diagnosticId,
            }, {properties}, options));
        }

        // Temporary change to allow only certain events to go to Segment to reduce data rate - see MM-13062
        // All events in 'admin' category are allowed, since they are low-volume
        if (category !== 'admin' && ![
            'api_posts_create',
            'api_interactive_messages_button_clicked',
            'api_interactive_messages_menu_selected',
            'api_interactive_messages_dialog_submitted',
            'ui_marketplace_download',
            'ui_marketplace_download_update',
            'ui_marketplace_configure',
            'ui_marketplace_opened',
            'ui_marketplace_closed',
            'ui_marketplace_search',
            'signup_user_01_welcome',
            'signup_select_team',
            'signup_team_01_name',
            'signup_team_02_url',
            'click_back',
            'click_signin_account',
            'click_create_account',
            'click_create_team',
            'click_system_console',
            'click_logout',
            'click_next',
            'click_finish',
            'click_dismiss_bar',
            'diagnostics_disabled',
            'click_warn_metric_ack_button',
            'click_warn_metric_ack_contact_support',
        ].includes(event)) {
            return;
        }

        if (globalAny && globalAny.window && globalAny.window.analytics && globalAny.window.analytics.initialized) {
            globalAny.window.analytics.track('event', properties, options);
        } else if (globalAny && globalAny.analytics) {
            if (globalAny.analytics_context) {
                options.context = globalAny.analytics_context;
            }

            globalAny.analytics.track(Object.assign({
                event: 'event',
                userId: this.diagnosticId,
            }, {properties}, options));
        }
    }
}

function parseAndMergeNestedHeaders(originalHeaders: any) {
    const headers = new Map();
    let nestedHeaders = new Map();
    originalHeaders.forEach((val: string, key: string) => {
        const capitalizedKey = key.replace(/\b[a-z]/g, (l) => l.toUpperCase());
        let realVal = val;
        if (val && val.match(/\n\S+:\s\S+/)) {
            const nestedHeaderStrings = val.split('\n');
            realVal = nestedHeaderStrings.shift() as string;
            const moreNestedHeaders = new Map(
                nestedHeaderStrings.map((h: any) => h.split(/:\s/)),
            );
            nestedHeaders = new Map([...nestedHeaders, ...moreNestedHeaders]);
        }
        headers.set(capitalizedKey, realVal);
    });
    return new Map([...headers, ...nestedHeaders]);
}

export class ClientError extends Error implements ServerError {
    url?: string;
    intl?: {
        id: string;
        defaultMessage: string;
        values?: any;
    };
    server_error_id?: string;
    status_code?: number;

    constructor(baseUrl: string, data: ServerError) {
        super(data.message + ': ' + cleanUrlForLogging(baseUrl, data.url || ''));

        this.message = data.message;
        this.url = data.url;
        this.intl = data.intl;
        this.server_error_id = data.server_error_id;
        this.status_code = data.status_code;

        // Ensure message is treated as a property of this class when object spreading. Without this,
        // copying the object by using `{...error}` would not include the message.
        Object.defineProperty(this, 'message', {enumerable: true});
    }
}
