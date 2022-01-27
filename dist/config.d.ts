import * as IPCIDR from 'ip-cidr';
declare class ConfigProxy {
    port: number;
    host?: string;
    workers: number;
}
declare class ServerPingInfo {
    maxPlayer: number;
    description?: string;
    favicon?: string;
}
declare class ConfigServer {
    serverName: string[];
    proxyHost: string;
    proxyPort: number;
    version: string;
    handlePing: boolean;
    onlineMode: boolean;
    useProxy: boolean;
    ping: ServerPingInfo;
}
declare class BlockList {
    ips: IPCIDR[];
    usernames: string[];
    uuids: string[];
}
export declare class Config {
    proxy: ConfigProxy;
    servers: ConfigServer[];
    defaultServer?: string;
    allowListOnly: boolean;
    blockList: BlockList;
    allowList: BlockList;
    profileEndpoint: string;
    plugins: string[];
}
export declare function loadConfig(path?: string): Promise<Config>;
export {};
