/// <reference types="node" />
import { EventEmitter } from 'events';
import { Backend, IBackend } from './backend';
import { Client } from './client';
import { Config } from './config';
import { PluginHook } from './plugin-hook';
export declare class ProxyServer extends EventEmitter {
    private port;
    private host?;
    clients: Set<Client>;
    defaultServer: string;
    readonly config: Config;
    readonly plugin: PluginHook;
    readonly workdir: string;
    private server;
    private logger;
    private backends;
    constructor(port: number, host?: string);
    static getConfig(): Config;
    listen(): Promise<void>;
    addBackend(names: string[], backend: IBackend): void;
    getBackend(name: string): Promise<Backend>;
    private onConnection;
    private onDisconnect;
    private isIpBanned;
    private isUsernameBanned;
    private isUuidBanned;
}
