import { AsyncParallelHook, AsyncSeriesBailHook } from 'tapable';
import { Backend, IBackend } from './backend';
import { Client } from './client';
import { Config } from './config';
import { ProxyServer } from './proxy-server';
export declare abstract class MinecraftProxyPlugin {
    protected readonly server: ProxyServer;
    protected readonly plugin: PluginHook;
    abstract name: string;
    protected constructor(server: ProxyServer, plugin: PluginHook);
}
export declare class PluginHook {
    private readonly config;
    private readonly server;
    readonly hooks: Readonly<{
        server: {
            lookupBackend: AsyncSeriesBailHook<[string], IBackend, import("tapable").UnsetAdditionalOptions>;
            prePipeToBackend: AsyncParallelHook<[Client, Backend], import("tapable").UnsetAdditionalOptions>;
        };
    }>;
    readonly plugins: Map<string, MinecraftProxyPlugin>;
    private readonly logger;
    constructor(config: Config, server: ProxyServer);
    loadPlugin(): Promise<void>;
    private constructPlugin;
}
