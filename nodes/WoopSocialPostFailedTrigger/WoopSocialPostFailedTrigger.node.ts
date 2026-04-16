import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

const EVENT_TYPE = 'socialAccountPost.delivery.failed';
const API_BASE_URL = 'https://api.woopsocial.com/v1';

function pickArrayFromResponse(response: unknown): IDataObject[] {
	if (Array.isArray(response)) return response as IDataObject[];
	if (!response || typeof response !== 'object') return [];

	const wrapped = response as Record<string, unknown>;
	const candidates = ['data', 'items', 'results', 'webhooks'];

	for (const key of candidates) {
		if (Array.isArray(wrapped[key])) {
			return wrapped[key] as IDataObject[];
		}
	}

	return [];
}

function normalizeUrl(url: string | undefined): string {
	if (!url) return '';
	return url.endsWith('/') ? url.slice(0, -1) : url;
}

function normalizeId(value: unknown): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'number') return String(value);
	return '';
}

function extractEventTypes(value: unknown): string[] {
	if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
	if (typeof value === 'string') return [value];
	return [];
}

function extractWebhookId(response: unknown): string | undefined {
	if (!response || typeof response !== 'object') return undefined;
	const payload = response as Record<string, unknown>;
	const directId = normalizeId(payload.id);
	if (directId) return directId;
	if (payload.data && typeof payload.data === 'object') {
		const data = payload.data as Record<string, unknown>;
		const nestedId = normalizeId(data.id);
		if (nestedId) return nestedId;
	}
	return undefined;
}

function extractErrorMessage(error: unknown, fallback: string): string {
	const err = error as {
		message?: string;
		description?: string;
		response?: { status?: number; data?: unknown };
		context?: { data?: unknown };
	};

	const status = err.response?.status;
	const responseData = err.response?.data ?? err.context?.data;
	let responseText = '';

	if (typeof responseData === 'string') {
		responseText = responseData;
	} else if (responseData && typeof responseData === 'object') {
		try {
			responseText = JSON.stringify(responseData);
		} catch {
			responseText = '';
		}
	}

	const baseMessage = err.description ?? err.message ?? fallback;
	if (status && responseText) return `${baseMessage} (HTTP ${status}): ${responseText}`;
	if (status) return `${baseMessage} (HTTP ${status})`;
	if (responseText) return `${baseMessage}: ${responseText}`;
	return baseMessage;
}

export class WoopSocialPostFailedTrigger implements INodeType {
	description: INodeTypeDescription = {
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

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const data = this.getWorkflowStaticData('node');
				const webhookId = data.webhookId as string | undefined;
				const webhookUrl = normalizeUrl(this.getNodeWebhookUrl('default'));

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'woopSocialApi', {
						method: 'GET',
						baseURL: API_BASE_URL,
						url: '/webhooks',
						json: true,
					});

					const hooks = pickArrayFromResponse(response) as Array<{
						id: unknown;
						url?: string;
						eventTypes?: unknown;
					}>;

					const existingHook = hooks.find(
						(hook) =>
							normalizeUrl(hook.url) === webhookUrl &&
							extractEventTypes(hook.eventTypes).includes(EVENT_TYPE),
					);

					if (!existingHook) return false;
					const existingHookId = normalizeId(existingHook.id);
					if (!existingHookId) return false;
					if (!webhookId) data.webhookId = existingHookId;
					return webhookId ? normalizeId(webhookId) === existingHookId : true;
				} catch {
					return false;
				}
			},
			async create(this: IHookFunctions): Promise<boolean> {
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
						throw new NodeApiError(this.getNode(), {
							message:
								'WoopSocial webhook registration succeeded but no webhook ID was returned. Please retry activation.',
						});
					}
					data.webhookId = webhookId;
					return true;
				} catch (error) {
					throw new NodeApiError(this.getNode(), {
						message: `${extractErrorMessage(error, 'Failed to register failed-post webhook.')} Hint: Ensure WEBHOOK_URL is a public HTTPS URL and your WoopSocial key can create webhooks.`,
					});
				}
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const data = this.getWorkflowStaticData('node');
				const webhookId = data.webhookId as string | undefined;
				if (!webhookId) return true;

				try {
					await this.helpers.httpRequestWithAuthentication.call(this, 'woopSocialApi', {
						method: 'DELETE',
						baseURL: API_BASE_URL,
						url: `/webhooks/${webhookId}`,
						json: true,
					});
					return true;
				} catch {
					return true;
				}
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;
		const eventPayload =
			typeof body.event === 'object' && body.event !== null ? (body.event as IDataObject) : body;

		return {
			workflowData: [this.helpers.returnJsonArray([eventPayload])],
		};
	}
}
