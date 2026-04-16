"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WoopSocial = void 0;
const n8n_workflow_1 = require("n8n-workflow");
function pickArrayFromResponse(response) {
    if (Array.isArray(response))
        return response;
    if (!response || typeof response !== 'object')
        return [];
    const wrapped = response;
    const candidates = ['data', 'items', 'results', 'projects', 'socialAccounts'];
    for (const key of candidates) {
        if (Array.isArray(wrapped[key])) {
            return wrapped[key];
        }
    }
    return [];
}
function extractPinterestBoards(response) {
    var _a, _b, _c;
    if (!response || typeof response !== 'object')
        return [];
    const payload = response;
    const platformSpecificInputs = payload.platformSpecificInputs;
    const boards = (_c = (_b = (_a = platformSpecificInputs === null || platformSpecificInputs === void 0 ? void 0 : platformSpecificInputs.boards) !== null && _a !== void 0 ? _a : platformSpecificInputs === null || platformSpecificInputs === void 0 ? void 0 : platformSpecificInputs.pinterestBoards) !== null && _b !== void 0 ? _b : payload.boards) !== null && _c !== void 0 ? _c : payload.pinterestBoards;
    if (!Array.isArray(boards))
        return [];
    return boards.filter((entry) => typeof entry === 'object' &&
        entry !== null &&
        typeof entry.id === 'string' &&
        typeof entry.name === 'string');
}
function extractErrorMessage(error, fallback) {
    var _a, _b, _c, _d, _e, _f;
    const err = error;
    const status = (_a = err.response) === null || _a === void 0 ? void 0 : _a.status;
    const responseData = (_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data) !== null && _c !== void 0 ? _c : (_d = err.context) === null || _d === void 0 ? void 0 : _d.data;
    let responseText = '';
    if (typeof responseData === 'string') {
        responseText = responseData;
    }
    else if (responseData && typeof responseData === 'object') {
        try {
            responseText = JSON.stringify(responseData);
        }
        catch {
            responseText = '';
        }
    }
    const baseMessage = (_f = (_e = err.description) !== null && _e !== void 0 ? _e : err.message) !== null && _f !== void 0 ? _f : fallback;
    if (status && responseText)
        return `${baseMessage} (HTTP ${status}): ${responseText}`;
    if (status)
        return `${baseMessage} (HTTP ${status})`;
    if (responseText)
        return `${baseMessage}: ${responseText}`;
    return baseMessage;
}
function withHint(message, hint) {
    return `${message} Hint: ${hint}`;
}
function matchesPlatform(accountPlatform, targetPlatform) {
    const value = (accountPlatform || '').toUpperCase();
    const target = targetPlatform.toUpperCase();
    if (value === target)
        return true;
    if (target === 'X')
        return value === 'TWITTER' || value === 'X';
    if (target === 'LINKEDIN')
        return value === 'LINKEDIN' || value === 'LINKEDIN_PERSONAL';
    if (target === 'LINKEDIN_PAGES')
        return value === 'LINKEDIN_PAGES' || value === 'LINKEDIN_PAGE' || value === 'LINKEDIN_COMPANY';
    if (target === 'YOUTUBE')
        return value.startsWith('YOUTUBE');
    if (target === 'TIKTOK')
        return value === 'TIKTOK' || value === 'TIK_TOK';
    return false;
}
async function loadSocialAccounts(context, platform) {
    try {
        const projectId = context.getCurrentNodeParameter('projectId');
        const response = await context.helpers.httpRequestWithAuthentication.call(context, 'woopSocialApi', {
            method: 'GET',
            baseURL: 'https://api.woopsocial.com/v1',
            url: '/social-accounts',
            qs: {
                ...(projectId ? { projectId } : {}),
            },
            json: true,
        });
        const socialAccounts = pickArrayFromResponse(response);
        const filteredAccounts = platform
            ? socialAccounts.filter((account) => matchesPlatform(account.platform, platform))
            : socialAccounts;
        return filteredAccounts.map((account) => ({
            name: `${account.username} (${account.platform})`,
            value: account.id,
        }));
    }
    catch (error) {
        throw new n8n_workflow_1.NodeOperationError(context.getNode(), withHint(extractErrorMessage(error, 'Failed to load social accounts from WoopSocial.'), 'Check your WoopSocial API credential and selected project.'));
    }
}
class WoopSocial {
    constructor() {
        this.description = {
            displayName: 'WoopSocial',
            name: 'woopSocial',
            icon: { light: 'file:woopSocial.svg', dark: 'file:woopSocial.dark.svg' },
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
            description: 'Create and retrieve WoopSocial resources',
            defaults: {
                name: 'WoopSocial',
            },
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            usableAsTool: true,
            credentials: [
                {
                    name: 'woopSocialApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Post',
                            value: 'post',
                        },
                        {
                            name: 'Project',
                            value: 'project',
                        },
                        {
                            name: 'Social Account',
                            value: 'socialAccount',
                        },
                    ],
                    default: 'post',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: ['post'],
                        },
                    },
                    options: [
                        {
                            name: 'Create',
                            value: 'create',
                            description: 'Create a post',
                            action: 'Create a post',
                        },
                        {
                            name: 'Get',
                            value: 'get',
                            description: 'Get a post by ID',
                            action: 'Get a post',
                        },
                    ],
                    default: 'create',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: ['socialAccount'],
                        },
                    },
                    options: [
                        {
                            name: 'Get Many',
                            value: 'getMany',
                            description: 'List social accounts',
                            action: 'Get many social accounts',
                        },
                    ],
                    default: 'getMany',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: ['project'],
                        },
                    },
                    options: [
                        {
                            name: 'Get Many',
                            value: 'getMany',
                            description: 'List projects',
                            action: 'Get many projects',
                        },
                    ],
                    default: 'getMany',
                },
                {
                    displayName: 'Post ID',
                    name: 'postId',
                    type: 'string',
                    required: true,
                    default: '',
                    description: 'The ID of the post to fetch',
                    displayOptions: {
                        show: {
                            resource: ['post'],
                            operation: ['get'],
                        },
                    },
                },
                {
                    displayName: 'Project Name or ID',
                    name: 'projectId',
                    type: 'options',
                    typeOptions: {
                        loadOptionsMethod: 'getProjects',
                    },
                    required: true,
                    default: '',
                    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                    displayOptions: {
                        show: {
                            resource: ['post'],
                            operation: ['create'],
                        },
                    },
                },
                {
                    displayName: 'Post Text',
                    name: 'text',
                    type: 'string',
                    required: true,
                    default: '',
                    typeOptions: {
                        rows: 3,
                    },
                    description: 'Main text content for the post',
                    displayOptions: {
                        show: {
                            resource: ['post'],
                            operation: ['create'],
                        },
                    },
                },
                {
                    displayName: 'Attach Image/Video',
                    name: 'attachMedia',
                    type: 'boolean',
                    default: false,
                    description: 'Whether to upload binary media before creating the post',
                    displayOptions: {
                        show: {
                            resource: ['post'],
                            operation: ['create'],
                        },
                    },
                },
                {
                    displayName: 'Binary Property',
                    name: 'binaryPropertyName',
                    type: 'string',
                    default: 'data',
                    placeholder: 'data',
                    description: 'Binary field name that contains the file',
                    displayOptions: {
                        show: {
                            resource: ['post'],
                            operation: ['create'],
                            attachMedia: [true],
                        },
                    },
                },
                {
                    displayName: 'X Accounts',
                    name: 'xAccounts',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,
                    },
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['post'],
                            operation: ['create'],
                        },
                    },
                    options: [
                        {
                            name: 'accounts',
                            displayName: 'Account',
                            values: [
                                {
                                    displayName: 'Account Name or ID',
                                    name: 'socialAccountId',
                                    type: 'options',
                                    typeOptions: {
                                        loadOptionsMethod: 'getXAccounts',
                                        loadOptionsDependsOn: ['projectId'],
                                    },
                                    default: '',
                                    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                                },
                            ],
                        },
                    ],
                },
                {
                    displayName: 'LinkedIn Accounts',
                    name: 'linkedinAccounts',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,
                    },
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['post'],
                            operation: ['create'],
                        },
                    },
                    options: [
                        {
                            name: 'accounts',
                            displayName: 'Account',
                            values: [
                                {
                                    displayName: 'Account Name or ID',
                                    name: 'socialAccountId',
                                    type: 'options',
                                    typeOptions: {
                                        loadOptionsMethod: 'getLinkedinAccounts',
                                        loadOptionsDependsOn: ['projectId'],
                                    },
                                    default: '',
                                    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                                },
                            ],
                        },
                    ],
                },
                {
                    displayName: 'LinkedIn Pages Accounts',
                    name: 'linkedinPagesAccounts',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,
                    },
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['post'],
                            operation: ['create'],
                        },
                    },
                    options: [
                        {
                            name: 'accounts',
                            displayName: 'Account',
                            values: [
                                {
                                    displayName: 'Account Name or ID',
                                    name: 'socialAccountId',
                                    type: 'options',
                                    typeOptions: {
                                        loadOptionsMethod: 'getLinkedinPagesAccounts',
                                        loadOptionsDependsOn: ['projectId'],
                                    },
                                    default: '',
                                    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                                },
                            ],
                        },
                    ],
                },
                {
                    displayName: 'Instagram Accounts',
                    name: 'instagramAccounts',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,
                    },
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['post'],
                            operation: ['create'],
                        },
                    },
                    options: [
                        {
                            name: 'accounts',
                            displayName: 'Account',
                            values: [
                                {
                                    displayName: 'Account Name or ID',
                                    name: 'socialAccountId',
                                    type: 'options',
                                    typeOptions: {
                                        loadOptionsMethod: 'getInstagramAccounts',
                                        loadOptionsDependsOn: ['projectId'],
                                    },
                                    default: '',
                                    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                                },
                                {
                                    displayName: 'Post Type',
                                    name: 'postType',
                                    type: 'options',
                                    default: 'POST',
                                    options: [
                                        { name: 'Post', value: 'POST' },
                                        { name: 'Reel', value: 'REEL' },
                                        { name: 'Story', value: 'STORY' },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    displayName: 'Facebook Accounts',
                    name: 'facebookAccounts',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,
                    },
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['post'],
                            operation: ['create'],
                        },
                    },
                    options: [
                        {
                            name: 'accounts',
                            displayName: 'Account',
                            values: [
                                {
                                    displayName: 'Account Name or ID',
                                    name: 'socialAccountId',
                                    type: 'options',
                                    typeOptions: {
                                        loadOptionsMethod: 'getFacebookAccounts',
                                        loadOptionsDependsOn: ['projectId'],
                                    },
                                    default: '',
                                    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                                },
                                {
                                    displayName: 'Post Type',
                                    name: 'postType',
                                    type: 'options',
                                    default: 'TEXT_ONLY',
                                    options: [
                                        { name: 'Text Only', value: 'TEXT_ONLY' },
                                        { name: 'Image', value: 'IMAGE' },
                                        { name: 'Video', value: 'VIDEO' },
                                        { name: 'Reel', value: 'REEL' },
                                    ],
                                },
                                {
                                    displayName: 'Link URL',
                                    name: 'link',
                                    type: 'string',
                                    default: '',
                                },
                            ],
                        },
                    ],
                },
                {
                    displayName: 'TikTok Accounts',
                    name: 'tiktokAccounts',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,
                    },
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['post'],
                            operation: ['create'],
                        },
                    },
                    options: [
                        {
                            name: 'accounts',
                            displayName: 'Account',
                            values: [
                                {
                                    displayName: 'Account Name or ID',
                                    name: 'socialAccountId',
                                    type: 'options',
                                    typeOptions: {
                                        loadOptionsMethod: 'getTiktokAccounts',
                                        loadOptionsDependsOn: ['projectId'],
                                    },
                                    default: '',
                                    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                                },
                                { displayName: 'Allow Comment', name: 'allowComment', type: 'boolean', default: true },
                                { displayName: 'Allow Duet', name: 'allowDuet', type: 'boolean', default: false },
                                { displayName: 'Allow Stitch', name: 'allowStitch', type: 'boolean', default: false },
                                { displayName: 'Auto Add Music', name: 'autoAddMusic', type: 'boolean', default: false },
                                {
                                    displayName: 'Content Disclosure Enabled',
                                    name: 'contentDisclosureEnabled',
                                    type: 'boolean',
                                    default: false,
                                },
                                {
                                    displayName: 'Is Branded Content',
                                    name: 'isBrandedContent',
                                    type: 'boolean',
                                    default: false,
                                },
                                { displayName: 'Is Your Brand', name: 'isYourBrand', type: 'boolean', default: false },
                                {
                                    displayName: 'Post Type',
                                    name: 'postType',
                                    type: 'options',
                                    default: 'VIDEO',
                                    options: [
                                        { name: 'Video', value: 'VIDEO' },
                                        { name: 'Photo', value: 'PHOTO' },
                                    ],
                                },
                                {
                                    displayName: 'Privacy Level',
                                    name: 'privacyLevel',
                                    type: 'options',
                                    default: 'PUBLIC_TO_EVERYONE',
                                    options: [
                                        { name: 'Public', value: 'PUBLIC_TO_EVERYONE' },
                                        { name: 'Private / Self Only', value: 'SELF_ONLY' },
                                        { name: 'Mutual Friends', value: 'MUTUAL_FOLLOW_FRIENDS' },
                                        { name: 'Followers Only', value: 'FOLLOWER_OF_CREATOR' },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    displayName: 'YouTube Accounts',
                    name: 'youtubeAccounts',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,
                    },
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['post'],
                            operation: ['create'],
                        },
                    },
                    options: [
                        {
                            name: 'accounts',
                            displayName: 'Account',
                            values: [
                                {
                                    displayName: 'Account Name or ID',
                                    name: 'socialAccountId',
                                    type: 'options',
                                    typeOptions: {
                                        loadOptionsMethod: 'getYoutubeAccounts',
                                        loadOptionsDependsOn: ['projectId'],
                                    },
                                    default: '',
                                    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                                },
                                { displayName: 'Category', name: 'category', type: 'string', default: '' },
                                {
                                    displayName: 'Made for Kids',
                                    name: 'madeForKids',
                                    type: 'boolean',
                                    default: false,
                                },
                                {
                                    displayName: 'Privacy',
                                    name: 'privacy',
                                    type: 'options',
                                    default: 'public',
                                    options: [
                                        { name: 'Public', value: 'public' },
                                        { name: 'Private', value: 'private' },
                                        { name: 'Unlisted', value: 'unlisted' },
                                    ],
                                },
                                {
                                    displayName: 'Tags (Comma Separated)',
                                    name: 'tags',
                                    type: 'string',
                                    default: '',
                                },
                                { displayName: 'Title', name: 'title', type: 'string', default: '' },
                            ],
                        },
                    ],
                },
                {
                    displayName: 'Pinterest Accounts',
                    name: 'pinterestAccounts',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,
                    },
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['post'],
                            operation: ['create'],
                        },
                    },
                    options: [
                        {
                            name: 'accounts',
                            displayName: 'Account',
                            values: [
                                {
                                    displayName: 'Account Name or ID',
                                    name: 'socialAccountId',
                                    type: 'options',
                                    typeOptions: {
                                        loadOptionsMethod: 'getPinterestAccounts',
                                        loadOptionsDependsOn: ['projectId'],
                                    },
                                    default: '',
                                    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                                },
                                {
                                    displayName: 'Board Name or ID',
                                    name: 'pinterestBoardId',
                                    type: 'options',
                                    typeOptions: {
                                        loadOptionsMethod: 'getPinterestBoards',
                                        loadOptionsDependsOn: ['projectId', 'socialAccountId'],
                                    },
                                    default: '',
                                    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                                },
                            ],
                        },
                    ],
                },
                {
                    displayName: 'Project ID',
                    name: 'projectId',
                    type: 'string',
                    default: '',
                    description: 'Optional project ID to filter social accounts',
                    displayOptions: {
                        show: {
                            resource: ['socialAccount'],
                            operation: ['getMany'],
                        },
                    },
                },
            ],
        };
        this.methods = {
            loadOptions: {
                async getProjects() {
                    try {
                        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'woopSocialApi', {
                            method: 'GET',
                            baseURL: 'https://api.woopsocial.com/v1',
                            url: '/projects',
                            json: true,
                        });
                        const projects = pickArrayFromResponse(response);
                        return projects.map((project) => ({
                            name: project.name,
                            value: project.id,
                        }));
                    }
                    catch (error) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), withHint(extractErrorMessage(error, 'Failed to load projects from WoopSocial.'), 'Check your WoopSocial API credential and try credential test again.'));
                    }
                },
                async getSocialAccounts() {
                    return loadSocialAccounts(this);
                },
                async getXAccounts() {
                    return loadSocialAccounts(this, 'X');
                },
                async getLinkedinAccounts() {
                    return loadSocialAccounts(this, 'LINKEDIN');
                },
                async getLinkedinPagesAccounts() {
                    return loadSocialAccounts(this, 'LINKEDIN_PAGES');
                },
                async getInstagramAccounts() {
                    return loadSocialAccounts(this, 'INSTAGRAM');
                },
                async getFacebookAccounts() {
                    return loadSocialAccounts(this, 'FACEBOOK');
                },
                async getTiktokAccounts() {
                    return loadSocialAccounts(this, 'TIKTOK');
                },
                async getYoutubeAccounts() {
                    return loadSocialAccounts(this, 'YOUTUBE');
                },
                async getPinterestAccounts() {
                    return loadSocialAccounts(this, 'PINTEREST');
                },
                async getPinterestBoards() {
                    try {
                        const projectId = this.getCurrentNodeParameter('projectId');
                        const selectedSocialAccountId = (this.getCurrentNodeParameter('socialAccountId') ||
                            this.getCurrentNodeParameter('accounts.socialAccountId') ||
                            this.getCurrentNodeParameter('pinterestAccounts.accounts.socialAccountId'));
                        if (selectedSocialAccountId) {
                            const response = await this.helpers.httpRequestWithAuthentication.call(this, 'woopSocialApi', {
                                method: 'GET',
                                baseURL: 'https://api.woopsocial.com/v1',
                                url: `/social-accounts/${selectedSocialAccountId}/platform-inputs`,
                                json: true,
                            });
                            const boards = extractPinterestBoards(response);
                            if (boards.length > 0) {
                                return boards.map((board) => ({
                                    name: board.name,
                                    value: board.id,
                                }));
                            }
                        }
                        const accountsResponse = await this.helpers.httpRequestWithAuthentication.call(this, 'woopSocialApi', {
                            method: 'GET',
                            baseURL: 'https://api.woopsocial.com/v1',
                            url: '/social-accounts',
                            qs: {
                                ...(projectId ? { projectId } : {}),
                            },
                            json: true,
                        });
                        const accounts = Array.isArray(accountsResponse)
                            ? accountsResponse.filter((account) => matchesPlatform(account.platform, 'PINTEREST'))
                            : [];
                        const options = [];
                        for (const account of accounts) {
                            const response = await this.helpers.httpRequestWithAuthentication.call(this, 'woopSocialApi', {
                                method: 'GET',
                                baseURL: 'https://api.woopsocial.com/v1',
                                url: `/social-accounts/${account.id}/platform-inputs`,
                                json: true,
                            });
                            const boards = extractPinterestBoards(response);
                            if (boards.length > 0) {
                                for (const board of boards) {
                                    options.push({
                                        name: account.username ? `${account.username}: ${board.name}` : board.name,
                                        value: `${account.id}::${board.id}`,
                                    });
                                }
                            }
                        }
                        return options;
                    }
                    catch (error) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), withHint(extractErrorMessage(error, 'Failed to load Pinterest boards from WoopSocial.'), 'Verify the selected Pinterest account is connected and has board access.'));
                    }
                },
            },
        };
    }
    async execute() {
        var _a, _b, _c;
        const resource = this.getNodeParameter('resource', 0);
        const operation = this.getNodeParameter('operation', 0);
        if (resource === 'project' && operation === 'getMany') {
            try {
                const response = await this.helpers.httpRequestWithAuthentication.call(this, 'woopSocialApi', {
                    method: 'GET',
                    baseURL: 'https://api.woopsocial.com/v1',
                    url: '/projects',
                    json: true,
                });
                const projects = pickArrayFromResponse(response);
                return [this.helpers.returnJsonArray(projects)];
            }
            catch (error) {
                throw new n8n_workflow_1.NodeApiError(this.getNode(), {
                    message: withHint(extractErrorMessage(error, 'Failed to fetch projects from WoopSocial.'), 'Check your credential and confirm your API key has access to at least one project.'),
                });
            }
        }
        if (resource === 'socialAccount' && operation === 'getMany') {
            try {
                const projectId = this.getNodeParameter('projectId', 0, '');
                const response = await this.helpers.httpRequestWithAuthentication.call(this, 'woopSocialApi', {
                    method: 'GET',
                    baseURL: 'https://api.woopsocial.com/v1',
                    url: '/social-accounts',
                    qs: projectId ? { projectId } : undefined,
                    json: true,
                });
                const socialAccounts = pickArrayFromResponse(response);
                return [this.helpers.returnJsonArray(socialAccounts)];
            }
            catch (error) {
                throw new n8n_workflow_1.NodeApiError(this.getNode(), {
                    message: withHint(extractErrorMessage(error, 'Failed to fetch social accounts from WoopSocial.'), 'Check the selected project and verify the account connections in WoopSocial.'),
                });
            }
        }
        if (resource === 'post' && operation === 'get') {
            try {
                const postId = this.getNodeParameter('postId', 0);
                const response = await this.helpers.httpRequestWithAuthentication.call(this, 'woopSocialApi', {
                    method: 'GET',
                    baseURL: 'https://api.woopsocial.com/v1',
                    url: `/posts/${postId}`,
                    json: true,
                });
                return [this.helpers.returnJsonArray([response])];
            }
            catch (error) {
                throw new n8n_workflow_1.NodeApiError(this.getNode(), {
                    message: withHint(extractErrorMessage(error, 'Failed to fetch post from WoopSocial.'), 'Confirm the Post ID exists and belongs to your organization.'),
                });
            }
        }
        if (resource === 'post' && operation === 'create') {
            try {
                const projectId = this.getNodeParameter('projectId', 0);
                const text = this.getNodeParameter('text', 0);
                const attachMedia = this.getNodeParameter('attachMedia', 0, false);
                const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 0, 'data');
                const xAccounts = this.getNodeParameter('xAccounts', 0, { accounts: [] });
                const linkedinAccounts = this.getNodeParameter('linkedinAccounts', 0, { accounts: [] });
                const linkedinPagesAccounts = this.getNodeParameter('linkedinPagesAccounts', 0, { accounts: [] });
                const instagramAccounts = this.getNodeParameter('instagramAccounts', 0, { accounts: [] });
                const facebookAccounts = this.getNodeParameter('facebookAccounts', 0, { accounts: [] });
                const tiktokAccounts = this.getNodeParameter('tiktokAccounts', 0, { accounts: [] });
                const youtubeAccounts = this.getNodeParameter('youtubeAccounts', 0, { accounts: [] });
                const pinterestAccounts = this.getNodeParameter('pinterestAccounts', 0, { accounts: [] });
                const xAccountItems = Array.isArray(xAccounts.accounts) ? xAccounts.accounts : [];
                const linkedinAccountItems = Array.isArray(linkedinAccounts.accounts)
                    ? linkedinAccounts.accounts
                    : [];
                const linkedinPagesAccountItems = Array.isArray(linkedinPagesAccounts.accounts)
                    ? linkedinPagesAccounts.accounts
                    : [];
                const instagramAccountItems = Array.isArray(instagramAccounts.accounts)
                    ? instagramAccounts.accounts
                    : [];
                const facebookAccountItems = Array.isArray(facebookAccounts.accounts)
                    ? facebookAccounts.accounts
                    : [];
                const tiktokAccountItems = Array.isArray(tiktokAccounts.accounts) ? tiktokAccounts.accounts : [];
                const youtubeAccountItems = Array.isArray(youtubeAccounts.accounts) ? youtubeAccounts.accounts : [];
                const pinterestAccountItems = Array.isArray(pinterestAccounts.accounts)
                    ? pinterestAccounts.accounts
                    : [];
                const socialAccountsPayload = [];
                xAccountItems.forEach((a) => socialAccountsPayload.push({ platform: 'X', socialAccountId: a.socialAccountId }));
                linkedinAccountItems.forEach((a) => socialAccountsPayload.push({ platform: 'LINKEDIN', socialAccountId: a.socialAccountId }));
                linkedinPagesAccountItems.forEach((a) => socialAccountsPayload.push({ platform: 'LINKEDIN_PAGES', socialAccountId: a.socialAccountId }));
                instagramAccountItems.forEach((a) => socialAccountsPayload.push({
                    platform: 'INSTAGRAM',
                    socialAccountId: a.socialAccountId,
                    postType: a.postType,
                }));
                facebookAccountItems.forEach((a) => socialAccountsPayload.push({
                    platform: 'FACEBOOK',
                    socialAccountId: a.socialAccountId,
                    postType: a.postType,
                    ...(a.link ? { link: a.link } : {}),
                }));
                tiktokAccountItems.forEach((a) => socialAccountsPayload.push({
                    platform: 'TIKTOK',
                    socialAccountId: a.socialAccountId,
                    postType: a.postType,
                    privacyLevel: a.privacyLevel,
                    allowComment: a.allowComment,
                    allowDuet: a.allowDuet,
                    allowStitch: a.allowStitch,
                    contentDisclosureEnabled: a.contentDisclosureEnabled,
                    isYourBrand: a.isYourBrand,
                    isBrandedContent: a.isBrandedContent,
                    autoAddMusic: a.autoAddMusic,
                }));
                youtubeAccountItems.forEach((a) => socialAccountsPayload.push({
                    platform: 'YOUTUBE',
                    socialAccountId: a.socialAccountId,
                    title: a.title,
                    privacy: a.privacy,
                    ...(a.category ? { category: a.category } : {}),
                    ...(a.tags
                        ? {
                            tags: a.tags
                                .split(',')
                                .map((tag) => tag.trim())
                                .filter((tag) => tag.length > 0),
                        }
                        : {}),
                    ...(typeof a.madeForKids === 'boolean' ? { madeForKids: a.madeForKids } : {}),
                }));
                pinterestAccountItems.forEach((a) => {
                    var _a;
                    const encoded = ((_a = a.pinterestBoardId) === null || _a === void 0 ? void 0 : _a.includes('::')) ? a.pinterestBoardId.split('::') : null;
                    const resolvedSocialAccountId = encoded ? encoded[0] : a.socialAccountId;
                    const resolvedBoardId = encoded ? encoded[1] : a.pinterestBoardId;
                    socialAccountsPayload.push({
                        platform: 'PINTEREST',
                        socialAccountId: resolvedSocialAccountId,
                        pinterestBoardId: resolvedBoardId,
                    });
                });
                if (socialAccountsPayload.length === 0) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Please add at least one social account target before creating a post.');
                }
                let mediaId;
                if (attachMedia) {
                    const binaryData = this.helpers.assertBinaryData(0, binaryPropertyName);
                    const fileSizeBytes = Number((_a = binaryData.fileSize) !== null && _a !== void 0 ? _a : 0);
                    if (!Number.isNaN(fileSizeBytes) && fileSizeBytes > 600 * 1024 * 1024) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'The selected media file is larger than 600 MB. Use a smaller file for this node.');
                    }
                    const mediaBuffer = await this.helpers.getBinaryDataBuffer(0, binaryPropertyName);
                    const mediaResponse = await this.helpers.httpRequestWithAuthentication.call(this, 'woopSocialApi', {
                        method: 'POST',
                        baseURL: 'https://api.woopsocial.com/v1',
                        url: '/media',
                        qs: { projectId },
                        body: mediaBuffer,
                        headers: {
                            'content-type': 'application/octet-stream',
                        },
                        json: true,
                    });
                    mediaId = mediaResponse.mediaId;
                }
                const contentItem = { text };
                if (mediaId) {
                    contentItem.media = [{ type: 'MEDIA_LIBRARY', mediaId }];
                }
                const createPostBody = {
                    content: [contentItem],
                    schedule: {
                        type: 'PUBLISH_NOW',
                    },
                    socialAccounts: socialAccountsPayload,
                };
                const validateResponse = await this.helpers.httpRequestWithAuthentication.call(this, 'woopSocialApi', {
                    method: 'POST',
                    baseURL: 'https://api.woopsocial.com/v1',
                    url: '/posts/validate',
                    body: createPostBody,
                    json: true,
                });
                const validateResult = validateResponse;
                if (validateResult.isValid === false) {
                    const errors = Array.isArray(validateResult.errors) ? validateResult.errors : [];
                    const firstMessage = (_c = (_b = errors[0]) === null || _b === void 0 ? void 0 : _b.message) !== null && _c !== void 0 ? _c : 'WoopSocial validation failed.';
                    const formattedDetails = errors.length > 0
                        ? errors
                            .slice(0, 10)
                            .map((e) => { var _a; return `- ${e.field ? `${e.field}: ` : ''}${(_a = e.message) !== null && _a !== void 0 ? _a : 'Invalid value'}${e.path ? ` (path: ${e.path})` : ''}`; })
                            .join('\n')
                        : '';
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `WoopSocial validation failed: ${firstMessage}\n${formattedDetails}`.trim());
                }
                const postResponse = await this.helpers.httpRequestWithAuthentication.call(this, 'woopSocialApi', {
                    method: 'POST',
                    baseURL: 'https://api.woopsocial.com/v1',
                    url: '/posts',
                    body: createPostBody,
                    json: true,
                });
                return [this.helpers.returnJsonArray([postResponse])];
            }
            catch (error) {
                if (error instanceof n8n_workflow_1.NodeOperationError || error instanceof n8n_workflow_1.NodeApiError) {
                    throw error;
                }
                throw new n8n_workflow_1.NodeApiError(this.getNode(), {
                    message: withHint(extractErrorMessage(error, 'Failed to create post in WoopSocial.'), 'For media posts, verify file type/size and platform-specific requirements (for example, video-only platforms).'),
                });
            }
        }
        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `The ${resource}:${operation} operation is not implemented yet. This phase only sets up the node UI.`);
    }
}
exports.WoopSocial = WoopSocial;
//# sourceMappingURL=WoopSocial.node.js.map