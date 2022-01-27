import { Client } from './client';
export interface IBackend {
    serverName: string[];
    host: string;
    port: number;
    version: string;
    handlePing: boolean;
    onlineMode: boolean;
    useProxy: boolean;
    ping?: {
        maxPlayer: number;
        description?: string;
        favicon?: string;
    };
}
export declare class Backend implements IBackend {
    readonly protocolVersion: number;
    readonly serverName: string[];
    readonly host: string;
    readonly port: number;
    readonly version: string;
    readonly handlePing: boolean;
    readonly onlineMode: boolean;
    readonly useProxy: boolean;
    readonly ping: IBackend['ping'];
    private clients;
    private clusterRequest;
    constructor(data: IBackend);
    addClient(client: Client): void;
    removeClient(client: Client): void;
    getOnline(curr?: boolean): Promise<number>;
}
