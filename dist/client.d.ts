/// <reference types="node" />
import { EventEmitter } from 'events';
import { States } from 'minecraft-protocol';
import { Socket } from 'net';
import { Backend } from './backend';
import { ProxyServer } from './proxy-server';
export declare class Client extends EventEmitter {
    private readonly socket;
    readonly proxy: ProxyServer;
    host: string;
    protocolVersion: number;
    version: string;
    username: string;
    fml: boolean;
    private _state;
    private _uuid;
    private splitter;
    private framer;
    private deserializer;
    private serializer;
    private logger;
    private readonly config;
    private _closed;
    constructor(socket: Socket, proxy: ProxyServer);
    get closed(): boolean;
    get state(): States;
    set state(state: States);
    awaitHandshake(): Promise<number>;
    pipeToBackend(backend: Backend, nextState: number): Promise<Socket>;
    responsePing(backend: Backend): Promise<void>;
    getUUID(backend: Backend): Promise<string>;
    close(reason: string): void;
    kill(): void;
    write(name: any, params: any): void;
}
