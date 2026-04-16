import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WoopSocialApi implements ICredentialType {
	name = 'woopSocialApi';

	displayName = 'WoopSocial API';

	icon: Icon = {
		light: 'file:../nodes/WoopSocial/woopSocial.svg',
		dark: 'file:../nodes/WoopSocial/woopSocial.dark.svg',
	};

	documentationUrl = 'https://docs.woopsocial.com';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Your WoopSocial API key. WoopSocial keys usually start with the "wsk_" prefix.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.woopsocial.com/v1',
			url: '/health',
			method: 'GET',
		},
	};
}
