import type { IExecuteFunctions, ILoadOptionsFunctions, INodeExecutionData, INodePropertyOptions, INodeType, INodeTypeDescription } from 'n8n-workflow';
export declare class WoopSocial implements INodeType {
    description: INodeTypeDescription;
    methods: {
        loadOptions: {
            getProjects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getSocialAccounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getXAccounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getLinkedinAccounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getLinkedinPagesAccounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getInstagramAccounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getFacebookAccounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getTiktokAccounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getYoutubeAccounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getPinterestAccounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getPinterestBoards(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
        };
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
