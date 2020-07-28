// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const values = {
    INVITE_USER: 'invite_user',
    ADD_USER_TO_TEAM: 'add_user_to_team',
    USE_SLASH_COMMANDS: 'use_slash_commands',
    MANAGE_SLASH_COMMANDS: 'manage_slash_commands',
    MANAGE_OTHERS_SLASH_COMMANDS: 'manage_others_slash_commands',
    CREATE_PUBLIC_CHANNEL: 'create_public_channel',
    CREATE_PRIVATE_CHANNEL: 'create_private_channel',
    MANAGE_PUBLIC_CHANNEL_MEMBERS: 'manage_public_channel_members',
    MANAGE_PRIVATE_CHANNEL_MEMBERS: 'manage_private_channel_members',
    ASSIGN_SYSTEM_ADMIN_ROLE: 'assign_system_admin_role',
    MANAGE_ROLES: 'manage_roles',
    MANAGE_TEAM_ROLES: 'manage_team_roles',
    MANAGE_CHANNEL_ROLES: 'manage_channel_roles',
    MANAGE_SYSTEM: 'manage_system',
    CREATE_DIRECT_CHANNEL: 'create_direct_channel',
    CREATE_GROUP_CHANNEL: 'create_group_channel',
    MANAGE_PUBLIC_CHANNEL_PROPERTIES: 'manage_public_channel_properties',
    MANAGE_PRIVATE_CHANNEL_PROPERTIES: 'manage_private_channel_properties',
    LIST_PUBLIC_TEAMS: 'list_public_teams',
    JOIN_PUBLIC_TEAMS: 'join_public_teams',
    LIST_PRIVATE_TEAMS: 'list_private_teams',
    JOIN_PRIVATE_TEAMS: 'join_private_teams',
    LIST_TEAM_CHANNELS: 'list_team_channels',
    JOIN_PUBLIC_CHANNELS: 'join_public_channels',
    DELETE_PUBLIC_CHANNEL: 'delete_public_channel',
    DELETE_PRIVATE_CHANNEL: 'delete_private_channel',
    EDIT_OTHER_USERS: 'edit_other_users',
    READ_CHANNEL: 'read_channel',
    READ_PUBLIC_CHANNEL: 'read_public_channel',
    ADD_REACTION: 'add_reaction',
    REMOVE_REACTION: 'remove_reaction',
    REMOVE_OTHERS_REACTIONS: 'remove_others_reactions',
    PERMANENT_DELETE_USER: 'permanent_delete_user',
    UPLOAD_FILE: 'upload_file',
    GET_PUBLIC_LINK: 'get_public_link',
    MANAGE_WEBHOOKS: 'manage_webhooks',
    MANAGE_OTHERS_WEBHOOKS: 'manage_others_webhooks',
    MANAGE_INCOMING_WEBHOOKS: 'manage_incoming_webhooks',
    MANAGE_OTHERS_INCOMING_WEBHOOKS: 'manage_others_incoming_webhooks',
    MANAGE_OUTGOING_WEBHOOKS: 'manage_outgoing_webhooks',
    MANAGE_OTHERS_OUTGOING_WEBHOOKS: 'manage_others_outgoing_webhooks',
    MANAGE_OAUTH: 'manage_oauth',
    MANAGE_SYSTEM_WIDE_OAUTH: 'manage_system_wide_oauth',
    CREATE_POST: 'create_post',
    CREATE_POST_PUBLIC: 'create_post_public',
    EDIT_POST: 'edit_post',
    EDIT_OTHERS_POSTS: 'edit_others_posts',
    DELETE_POST: 'delete_post',
    DELETE_OTHERS_POSTS: 'delete_others_posts',
    REMOVE_USER_FROM_TEAM: 'remove_user_from_team',
    CREATE_TEAM: 'create_team',
    MANAGE_TEAM: 'manage_team',
    IMPORT_TEAM: 'import_team',
    VIEW_TEAM: 'view_team',
    LIST_USERS_WITHOUT_TEAM: 'list_users_without_team',
    CREATE_USER_ACCESS_TOKEN: 'create_user_access_token',
    READ_USER_ACCESS_TOKEN: 'read_user_access_token',
    REVOKE_USER_ACCESS_TOKEN: 'revoke_user_access_token',
    MANAGE_JOBS: 'manage_jobs',
    MANAGE_EMOJIS: 'manage_emojis',
    MANAGE_OTHERS_EMOJIS: 'manage_others_emojis',
    CREATE_EMOJIS: 'create_emojis',
    DELETE_EMOJIS: 'delete_emojis',
    DELETE_OTHERS_EMOJIS: 'delete_others_emojis',
    VIEW_MEMBERS: 'view_members',
    INVITE_GUEST: 'invite_guest',
    PROMOTE_GUEST: 'promote_guest',
    DEMOTE_TO_GUEST: 'demote_to_guest',
    USE_CHANNEL_MENTIONS: 'use_channel_mentions',
    USE_GROUP_MENTIONS: 'use_group_mentions',

    READ_SYSCONSOLE_ABOUT: 'read_sysconsole_about',
    WRITE_SYSCONSOLE_ABOUT: 'write_sysconsole_about',
    READ_SYSCONSOLE_REPORTING: 'read_sysconsole_reporting',
    WRITE_SYSCONSOLE_REPORTING: 'write_sysconsole_reporting',
    READ_SYSCONSOLE_USERMANAGEMENT: 'read_sysconsole_user_management',
    WRITE_SYSCONSOLE_USERMANAGEMENT: 'write_sysconsole_user_management',
    READ_SYSCONSOLE_USERMANAGEMENT_USERS: 'read_sysconsole_user_management_users',
    WRITE_SYSCONSOLE_USERMANAGEMENT_USERS: 'write_sysconsole_user_management_users',
    READ_SYSCONSOLE_USERMANAGEMENT_GROUPS: 'read_sysconsole_user_management_groups',
    WRITE_SYSCONSOLE_USERMANAGEMENT_GROUPS: 'write_sysconsole_user_management_groups',
    READ_SYSCONSOLE_USERMANAGEMENT_TEAMS: 'read_sysconsole_user_management_teams',
    WRITE_SYSCONSOLE_USERMANAGEMENT_TEAMS: 'write_sysconsole_user_management_teams',
    READ_SYSCONSOLE_USERMANAGEMENT_CHANNELS: 'read_sysconsole_user_management_channels',
    WRITE_SYSCONSOLE_USERMANAGEMENT_CHANNELS: 'write_sysconsole_user_management_channels',
    READ_SYSCONSOLE_USERMANAGEMENT_PERMISSIONS: 'read_sysconsole_user_management_permissions',
    WRITE_SYSCONSOLE_USERMANAGEMENT_PERMISSIONS: 'write_sysconsole_user_management_permissions',
    READ_SYSCONSOLE_ENVIRONMENT: 'read_sysconsole_environment',
    WRITE_SYSCONSOLE_ENVIRONMENT: 'write_sysconsole_environment',
    READ_SYSCONSOLE_SITE: 'read_sysconsole_site',
    WRITE_SYSCONSOLE_SITE: 'write_sysconsole_site',
    READ_SYSCONSOLE_AUTHENTICATION: 'read_sysconsole_authentication',
    WRITE_SYSCONSOLE_AUTHENTICATION: 'write_sysconsole_authentication',
    READ_SYSCONSOLE_PLUGINS: 'read_sysconsole_plugins',
    WRITE_SYSCONSOLE_PLUGINS: 'write_sysconsole_plugins',
    READ_SYSCONSOLE_INTEGRATIONS: 'read_sysconsole_integrations',
    WRITE_SYSCONSOLE_INTEGRATIONS: 'write_sysconsole_integrations',
    READ_SYSCONSOLE_COMPLIANCE: 'read_sysconsole_compliance',
    WRITE_SYSCONSOLE_COMPLIANCE: 'write_sysconsole_compliance',
    READ_SYSCONSOLE_EXPERIMENTAL: 'read_sysconsole_experimental',
    WRITE_SYSCONSOLE_EXPERIMENTAL: 'write_sysconsole_experimental',

    CHANNEL_MODERATED_PERMISSIONS: {
        CREATE_POST: 'create_post',
        CREATE_REACTIONS: 'create_reactions',
        MANAGE_MEMBERS: 'manage_members',
        USE_CHANNEL_MENTIONS: 'use_channel_mentions',
    },
    MANAGE_BOTS: 'manage_bots',
    MANAGE_OTHERS_BOTS: 'manage_others_bots',
    SYSCONSOLE_READ_PERMISSIONS: [] as string[],
    SYSCONSOLE_WRITE_PERMISSIONS: [] as string[],
};

values.SYSCONSOLE_READ_PERMISSIONS = [
    values.READ_SYSCONSOLE_ABOUT,
    values.READ_SYSCONSOLE_REPORTING,
    values.READ_SYSCONSOLE_USERMANAGEMENT,
    values.READ_SYSCONSOLE_USERMANAGEMENT_USERS,
    values.READ_SYSCONSOLE_USERMANAGEMENT_GROUPS,
    values.READ_SYSCONSOLE_USERMANAGEMENT_TEAMS,
    values.READ_SYSCONSOLE_USERMANAGEMENT_CHANNELS,
    values.READ_SYSCONSOLE_USERMANAGEMENT_PERMISSIONS,
    values.READ_SYSCONSOLE_ENVIRONMENT,
    values.READ_SYSCONSOLE_SITE,
    values.READ_SYSCONSOLE_AUTHENTICATION,
    values.READ_SYSCONSOLE_PLUGINS,
    values.READ_SYSCONSOLE_INTEGRATIONS,
    values.READ_SYSCONSOLE_COMPLIANCE,
    values.READ_SYSCONSOLE_EXPERIMENTAL,
];

values.SYSCONSOLE_WRITE_PERMISSIONS = [
    values.WRITE_SYSCONSOLE_ABOUT,
    values.WRITE_SYSCONSOLE_REPORTING,
    values.WRITE_SYSCONSOLE_USERMANAGEMENT,
    values.WRITE_SYSCONSOLE_USERMANAGEMENT_USERS,
    values.WRITE_SYSCONSOLE_USERMANAGEMENT_GROUPS,
    values.WRITE_SYSCONSOLE_USERMANAGEMENT_TEAMS,
    values.WRITE_SYSCONSOLE_USERMANAGEMENT_CHANNELS,
    values.WRITE_SYSCONSOLE_USERMANAGEMENT_PERMISSIONS,
    values.WRITE_SYSCONSOLE_ENVIRONMENT,
    values.WRITE_SYSCONSOLE_SITE,
    values.WRITE_SYSCONSOLE_AUTHENTICATION,
    values.WRITE_SYSCONSOLE_PLUGINS,
    values.WRITE_SYSCONSOLE_INTEGRATIONS,
    values.WRITE_SYSCONSOLE_COMPLIANCE,
    values.WRITE_SYSCONSOLE_EXPERIMENTAL,
];

export default values;