"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Backend = void 0;
const cluster = require("cluster");
const MinecraftData = require("minecraft-data");
const typedi_1 = require("typedi");
const cluster_1 = require("./cluster");
class Backend {
    constructor(data) {
        var _a;
        this.clients = new Set();
        this.clusterRequest = typedi_1.Container.get(cluster_1.ClusterRequest);
        this.serverName = data.serverName;
        this.host = data.host;
        this.port = data.port;
        this.version = data.version;
        this.handlePing = data.handlePing;
        this.onlineMode = data.onlineMode;
        this.ping = data.ping;
        this.useProxy = data.useProxy;
        const minecraftData = MinecraftData(this.version);
        if (this.handlePing && !minecraftData) {
            throw new Error(`不支持的版本: ${this.version}，不可启用handlePing功能`);
        }
        this.protocolVersion = (_a = minecraftData === null || minecraftData === void 0 ? void 0 : minecraftData.version) === null || _a === void 0 ? void 0 : _a.version;
    }
    addClient(client) {
        this.clients.add(client);
        client.on('end', () => {
            this.removeClient(client);
        });
    }
    removeClient(client) {
        this.clients.delete(client);
    }
    async getOnline(curr = false) {
        if (cluster.isMaster || curr) {
            return this.clients.size;
        }
        return this.clusterRequest.getOnline(this.serverName[0]);
    }
}
exports.Backend = Backend;
//# sourceMappingURL=backend.js.map