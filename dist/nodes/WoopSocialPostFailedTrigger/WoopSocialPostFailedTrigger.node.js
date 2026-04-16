"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WoopSocialPostFailedTrigger = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const EVENT_TYPE = 'socialAccountPost.delivery.failed';
const API_BASE_URL = 'https://api.woopsocial.com/v1';
function pickArrayFromResponse(response) {
    if (Array.isArray(response))
        return response;
    if (!response || typeof response !== 'object')
        return [];
    const wrapped = response;
    const candidates = ['data', 'items', 'results', 'webhooks'];
    for (const key of candidates) {
        if (Array.isArray(wrapped[key])) {
            return wrapped[key];
        }
    }
    return [];
}
function normalizeUrl(url) {
    if (!url)
        return '';
    return url.endsWith('/') ? url.slice(0, -1) : url;
}
function normalizeId(value) {
    if (typeof value === 'string')
        return value;
    if (typeof value === 'number')
        return String(value);
    return '';
}
function extractEventTypes(value) {
    if (Array.isArray(value))
        return value.filter((v) => typeof v === 'string');
    if (typeof value === 'string')
        return [value];
    return [];
}
function extractWebhookId(response) {
    if (!response || typeof response !== 'object')
        return undefined;
    const payload = response;
    const directId = normalizeId(payload.id);
    if (directId)
        return directId;
    if (payload.data && typeof payload.data === 'object') {
        const data = payload.data;
        const nestedId = normalizeId(data.id);
        if (nestedId)
            return nestedId;
    }
    return undefined;
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
class WoopSocialPostFailedTrigger {
    constructor() {
        this.description = {
            displayName: 'WoopSocial Watch Failed Posts Trigger',
            name: 'woopSocialPostFailedTrigger',
            icon: { light: 'file:../WoopSocial/woopSocial.svg', dark: 'file:../WoopSocial/woopSocial.dark.svg' },
            group: ['trigger'],
            version: 1,
            description: 'Fires when a WoopSocial post delivery fails',
            defaults: {
                name: 'WoopSocial Watch Failed Posts Trigger',
            },
            inputs: [],
            outputs: ['main'],
            usableAsTool: true,
            credentials: [
                {
                    name: 'woopSocialApi',
                    required: true,
                },
            ],
            webhooks: [
                {
                    name: 'default',
                    httpMethod: 'POST',
                    responseMode: 'onReceived',
                    path: 'failed-posts',
                },
            ],
            properties: [],
        };
        this.webhookMethods = {
            default: {
                async checkExists() {
                    const data = this.getWorkflowStaticData('node');
                    const webhookId = data.webhookId;
                    const webhookUrl = normalizeUrl(this.getNodeWebhookUrl('default'));
                    try {
                        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'woopSocialApi', {
                            method: 'GET',
                            baseURL: API_BASE_URL,
                            url: '/webhooks',
                            json: true,
                        });
                        const hooks = pickArrayFromResponse(response);
                        const existingHook = hooks.find((hook) => normalizeUrl(hook.url) === webhookUrl &&
                            extractEventTypes(hook.eventTypes).includes(EVENT_TYPE));
                        if (!existingHook)
                            return false;
                        const existingHookId = normalizeId(existingHook.id);
                        if (!existingHookId)
                            return false;
                        if (!webhookId)
                            data.webhookId = existingHookId;
                        return webhookId ? normalizeId(webhookId) === existingHookId : true;
                    }
                    catch {
                        return false;
                    }
                },
                async create() {
                    try {
                        const webhookUrl = this.getNodeWebhookUrl('default');
                        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'woopSocialApi', {
                            method: 'POST',
                            baseURL: API_BASE_URL,
                            url: '/webhooks',
                            body: {
                                url: webhookUrl,
                                eventTypes: [EVENT_TYPE],
                            },
                            json: true,
                        });
                        const data = this.getWorkflowStaticData('node');
                        const webhookId = extractWebhookId(response);
                        if (!webhookId) {
                            throw new n8n_workflow_1.NodeApiError(this.getNode(), {
                                message: 'WoopSocial webhook registration succeeded but no webhook ID was returned. Please retry activation.',
                            });
                        }
                        data.webhookId = webhookId;
                        return true;
                    }
                    catch (error) {
                        throw new n8n_workflow_1.NodeApiError(this.getNode(), {
                            message: `${extractErrorMessage(error, 'Failed to register failed-post webhook.')} Hint: Ensure WEBHOOK_URL is a public HTTPS URL and your WoopSocial key can create webhooks.`,
                        });
                    }
                },
                async delete() {
                    const data = this.getWorkflowStaticData('node');
                    const webhookId = data.webhookId;
                    if (!webhookId)
                        return true;
                    try {
                        await this.helpers.httpRequestWithAuthentication.call(this, 'woopSocialApi', {
                            method: 'DELETE',
                            baseURL: API_BASE_URL,
                            url: `/webhooks/${webhookId}`,
                            json: true,
                        });
                        return true;
                    }
                    catch {
                        return true;
                    }
                },
            },
        };
    }
    async webhook() {
        const body = this.getBodyData();
        const eventPayload = typeof body.event === 'object' && body.event !== null ? body.event : body;
        return {
            workflowData: [this.helpers.returnJsonArray([eventPayload])],
        };
    }
}
exports.WoopSocialPostFailedTrigger = WoopSocialPostFailedTrigger;
//# sourceMappingURL=WoopSocialPostFailedTrigger.node.js.map