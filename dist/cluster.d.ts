/// <reference types="node" />
import { Worker } from 'cluster';
import { ProxyServer } from './proxy-server';
interface IClusterRpc {
    getOnline(name: string): Promise<number>;
}
interface IRpcRequest {
    type: 'rpc-request';
    service: string;
    method: string;
    arguments: unknown[];
    correlationId: number;
}
interface IRpcResponse {
    type: 'rpc-response';
    data: unknown;
    correlationId: number;
}
declare type IRpcData = IRpcRequest | IRpcResponse;
export declare class ClusterRequest implements IClusterRpc {
    getOnline(name: string): Promise<number>;
}
export declare class ClusterProxy implements IClusterRpc {
    getOnline(name: string): Promise<number>;
}
export declare class ClusterHandler implements IClusterRpc {
    proxyServer: ProxyServer;
    getOnline(name: string): Promise<number>;
}
export declare function masterOnClusterMessage(worker: Worker, data: IRpcData): Promise<void>;
export {};
