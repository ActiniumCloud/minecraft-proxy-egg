"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const bunyan_1 = require("bunyan");
const crypto_1 = require("crypto");
const events_1 = require("events");
const got_1 = require("got");
const lodash_1 = require("lodash");
const minecraft_protocol_1 = require("minecraft-protocol");
const framing = require("minecraft-protocol/src/transforms/framing");
const net_1 = require("net");
class Client extends events_1.EventEmitter {
    constructor(socket, proxy) {
        super();
        this.socket = socket;
        this.proxy = proxy;
        this.version = '1.8';
        this.fml = false;
        this.splitter = framing.createSplitter();
        this.framer = framing.createFramer();
        this.logger = (0, bunyan_1.createLogger)({ name: 'client' });
        this.socket.on('end', () => {
            this.emit('end');
        });
        Object.assign(this.logger.fields, (0, lodash_1.pick)(socket, 'remoteAddress', 'remotePort'));
        this.config = proxy.config;
    }
    get closed() {
        return this._closed;
    }
    get state() {
        return this._state;
    }
    set state(state) {
        var _a, _b;
        this._state = state;
        this.socket.unpipe();
        (_a = this.deserializer) === null || _a === void 0 ? void 0 : _a.unpipe();
        (_b = this.serializer) === null || _b === void 0 ? void 0 : _b.unpipe();
        this.framer.unpipe();
        this.serializer = (0, minecraft_protocol_1.createSerializer)({ state, isServer: true, version: this.version, customPackets: {} });
        this.deserializer = (0, minecraft_protocol_1.createDeserializer)({ state, isServer: true, version: this.version, customPackets: {} });
        this.socket.pipe(this.splitter);
        this.serializer.pipe(this.framer).pipe(this.socket);
    }
    async awaitHandshake() {
        if (this.host)
            return;
        this.state = minecraft_protocol_1.states.HANDSHAKING;
        return new Promise((resolve) => {
            this.splitter.on('data', (chunk) => {
                const packet = this.deserializer.parsePacketBuffer(chunk);
                const { name, params } = packet.data;
                switch (name) {
                    case 'set_protocol':
                        this.protocolVersion = params.protocolVersion;
                        this.host = params.serverHost;
                        if (this.host.includes('\0')) {
                            const split = this.host.split('\0');
                            this.host = split[0];
                            this.fml = split[1] === 'FML';
                        }
                        switch (params.nextState) {
                            case 1:
                                this.state = minecraft_protocol_1.states.STATUS;
                                this.splitter.removeAllListeners('data');
                                return resolve(params.nextState);
                            case 2:
                                this.state = minecraft_protocol_1.states.LOGIN;
                                break;
                            default:
                                throw new Error(`wrong next state, except 1 or 2, got ${params.nextState}`);
                        }
                        break;
                    case 'login_start':
                        this.username = params.username;
                        this.logger.fields['username'] = this.username;
                        this.splitter.removeAllListeners('data');
                        return resolve(2);
                }
            });
        });
    }
    async pipeToBackend(backend, nextState) {
        this.socket.unpipe();
        await this.proxy.plugin.hooks.server.prePipeToBackend.promise(this, backend);
        if (this.closed)
            return;
        const socket = (0, net_1.connect)(backend.port, backend.host);
        await (0, events_1.once)(socket, 'connect');
        backend.addClient(this);
        if (backend.useProxy) {
            socket.write('PROXY TCP4 '
                + `${this.socket.remoteAddress} ${socket.remoteAddress} ${this.socket.remotePort} ${socket.remotePort}\r\n`);
        }
        let serializer = (0, minecraft_protocol_1.createSerializer)({ state: minecraft_protocol_1.states.HANDSHAKING, isServer: false, version: backend.version, customPackets: {} });
        const framer = framing.createFramer();
        serializer.pipe(framer).pipe(socket);
        if (this.username) {
            const serverHost = [backend.host, this.socket.remoteAddress, await this.getUUID(backend)];
            if (this.fml)
                serverHost.push('FML\0');
            serializer.write({ name: 'set_protocol', params: {
                    protocolVersion: this.protocolVersion,
                    serverHost: serverHost.join('\0'),
                    serverPort: backend.port, nextState,
                } });
            serializer = (0, minecraft_protocol_1.createSerializer)({ state: minecraft_protocol_1.states.LOGIN, isServer: false, version: backend.version, customPackets: {} });
            serializer.pipe(framer);
            serializer.write({ name: 'login_start', params: { username: this.username } });
        }
        else {
            serializer.write({ name: 'set_protocol', params: {
                    protocolVersion: this.protocolVersion,
                    serverHost: `${backend.host}`,
                    serverPort: backend.port, nextState,
                } });
        }
        if (nextState === 1) {
            serializer = (0, minecraft_protocol_1.createSerializer)({ state: minecraft_protocol_1.states.STATUS, isServer: false, version: backend.version, customPackets: {} });
            serializer.pipe(framer);
            serializer.write({ name: 'ping_start', params: {} });
        }
        this.socket.pipe(socket);
        socket.pipe(this.socket);
        socket.on('close', () => {
            backend.removeClient(this);
        });
        socket.on('error', (err) => {
            this.logger.error({ err });
            this.close(`failed to connect backend: ${err.message}`);
        });
        return socket;
    }
    async responsePing(backend) {
        const response = JSON.stringify({
            version: {
                name: backend.version,
                protocol: backend.protocolVersion,
            },
            players: {
                max: backend.ping.maxPlayer,
                online: await backend.getOnline(),
                sample: [],
            },
            description: {
                text: backend.ping.description,
            },
            favicon: backend.ping.favicon ? backend.ping.favicon : undefined,
        });
        this.write('server_info', { response });
        return new Promise((resolve) => {
            this.splitter.on('data', (chunk) => {
                const packet = this.deserializer.parsePacketBuffer(chunk);
                const { name, params } = packet.data;
                if (name === 'ping') {
                    this.splitter.removeAllListeners('data');
                    this.write(name, params);
                    resolve();
                }
            });
        });
    }
    async getUUID(backend) {
        if (this._uuid)
            return this._uuid;
        if (!backend.onlineMode) {
            const buf = (0, crypto_1.createHash)('md5').update('OfflinePlayer:').update(this.username)
                .digest();
            buf[6] = buf[6] & 0x0f | 0x30;
            buf[8] = buf[8] & 0x3f | 0x80;
            this._uuid = buf.toString('hex');
        }
        else {
            const resp = await (0, got_1.default)(this.config.profileEndpoint, { method: 'POST', responseType: 'json', body: JSON.stringify([this.username]) });
            if (resp.body.length > 0) {
                this._uuid = resp.body[0].id;
            }
            else {
                this.close('cannot get uuid for the user');
            }
        }
        return this._uuid;
    }
    close(reason) {
        try {
            this.write('disconnect', { reason: JSON.stringify({ text: reason }) });
            this._closed = true;
            this.logger.info(`force disconnecting ${this.socket.address()}, reason: ${reason}`);
        }
        catch (err) {
            this.logger.warn(err, 'failed to disconnect');
            this.kill();
        }
    }
    kill() {
        this.socket.end();
    }
    write(name, params) {
        this.serializer.write({ name, params });
    }
}
exports.Client = Client;
//# sourceMappingURL=client.js.map