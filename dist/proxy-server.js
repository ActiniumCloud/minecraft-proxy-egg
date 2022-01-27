"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyServer = void 0;
const Logger = require("bunyan");
const cluster_1 = require("cluster");
const events_1 = require("events");
const net_1 = require("net");
const typedi_1 = require("typedi");
const backend_1 = require("./backend");
const client_1 = require("./client");
const plugin_hook_1 = require("./plugin-hook");
class ProxyServer extends events_1.EventEmitter {
    constructor(port, host) {
        super();
        this.port = port;
        this.host = host;
        this.clients = new Set();
        this.config = typedi_1.Container.get('config');
        this.plugin = typedi_1.Container.get(plugin_hook_1.PluginHook);
        this.workdir = process.cwd();
        this.backends = new Map();
        const loggerOptions = { name: 'server', port, host };
        if (cluster_1.isWorker) {
            loggerOptions.worker = cluster_1.worker.id;
        }
        this.logger = Logger.createLogger(loggerOptions);
    }
    static getConfig() {
        return typedi_1.Container.get('config');
    }
    async listen() {
        if (this.server)
            throw new Error('already listen');
        const server = this.server = (0, net_1.createServer)();
        await new Promise((resolve) => {
            server.listen(this.port, this.host, () => resolve());
        });
        server.on('connection', async (socket) => this.onConnection(socket));
        this.logger.info('ready');
    }
    addBackend(names, backend) {
        const be = new backend_1.Backend(backend);
        for (const name of names) {
            if (this.backends.has(name)) {
                throw new Error(`duplicate name ${name}`);
            }
            this.backends.set(name, be);
        }
    }
    async getBackend(name) {
        if (this.backends.has(name))
            return this.backends.get(name);
        if (this.backends.has(this.defaultServer))
            return this.backends.get(this.defaultServer);
        const dynamicBackend = await this.plugin.hooks.server.lookupBackend.promise(name);
        if (dynamicBackend) {
            return new backend_1.Backend(dynamicBackend);
        }
        return null;
    }
    async onConnection(socket) {
        if (this.isIpBanned(socket.remoteAddress)) {
            socket.end();
            this.logger.warn({ ip: socket.remoteAddress }, `block ip ${socket.remoteAddress}`);
            return;
        }
        const client = new client_1.Client(socket, this);
        this.clients.add(client);
        socket.once('disconnect', () => this.onDisconnect(client));
        socket.on('error', (err) => {
            this.logger.error({ err });
        });
        try {
            const nextState = await client.awaitHandshake();
            const backend = await this.getBackend(client.host);
            if (!backend)
                return client.close(`${client.host} not found`);
            if (nextState === 2 || !backend.handlePing) {
                if (nextState === 2) {
                    if (client.username && this.isUsernameBanned(client.username)) {
                        this.logger.warn({
                            ip: socket.remoteAddress, username: client.username,
                        }, `block username ${client.username}`);
                        client.close('username banned');
                        return;
                    }
                    if (backend.onlineMode && this.isUuidBanned(await client.getUUID(backend))) {
                        this.logger.warn({
                            ip: socket.remoteAddress, username: client.username, uuid: await client.getUUID(backend),
                        }, `block uuid ${await client.getUUID(backend)}`);
                        client.close('uuid banned');
                        return;
                    }
                }
                await client.pipeToBackend(backend, nextState);
            }
            else {
                await client.responsePing(backend);
            }
        }
        catch (err) {
            this.logger.error(err);
            client.close(err.message);
        }
    }
    onDisconnect(client) {
        this.clients.delete(client);
    }
    isIpBanned(ip) {
        if (this.config.allowListOnly) {
            return !this.config.allowList.ips.some((cidr) => cidr.contains(ip));
        }
        return this.config.blockList.ips.some((cidr) => cidr.contains(ip));
    }
    isUsernameBanned(username) {
        if (this.config.allowListOnly) {
            return !this.config.allowList.usernames.includes(username);
        }
        return this.config.blockList.usernames.includes(username);
    }
    isUuidBanned(uuid) {
        if (this.config.allowListOnly) {
            return !this.config.allowList.uuids.includes(uuid);
        }
        return this.config.blockList.uuids.includes(uuid);
    }
}
exports.ProxyServer = ProxyServer;
//# sourceMappingURL=proxy-server.js.map