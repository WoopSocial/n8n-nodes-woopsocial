"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WoopSocialApi = void 0;
class WoopSocialApi {
    constructor() {
        this.name = 'woopSocialApi';
        this.displayName = 'WoopSocial API';
        this.icon = {
            light: 'file:../nodes/WoopSocial/woopSocial.svg',
            dark: 'file:../nodes/WoopSocial/woopSocial.dark.svg',
        };
        this.documentationUrl = 'https://docs.woopsocial.com';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                required: true,
                default: '',
                description: 'Your WoopSocial API key. WoopSocial keys usually start with the "wsk_" prefix.',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '=Bearer {{$credentials.apiKey}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: 'https://api.woopsocial.com/v1',
                url: '/health',
                method: 'GET',
            },
        };
    }
}
exports.WoopSocialApi = WoopSocialApi;
//# sourceMappingURL=WoopSocialApi.credentials.js.map