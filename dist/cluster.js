"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.masterOnClusterMessage = exports.ClusterHandler = exports.ClusterProxy = exports.ClusterRequest = void 0;
const Bluebird = require("bluebird");
const cluster_1 = require("cluster");
const lodash_1 = require("lodash");
const typedi_1 = require("typedi");
const proxy_server_1 = require("./proxy-server");
const handlers = new Map();
let ClusterRequest = class ClusterRequest {
    async getOnline(name) {
        return new Promise((resolve) => {
            const correlationId = Math.random();
            process.send({
                type: 'rpc-request',
                service: 'backend',
                method: 'getOnline',
                arguments: [name],
                correlationId,
            });
            handlers.set(correlationId, resolve);
        });
    }
};
ClusterRequest = __decorate([
    (0, typedi_1.Service)()
], ClusterRequest);
exports.ClusterRequest = ClusterRequest;
let ClusterProxy = class ClusterProxy {
    async getOnline(name) {
        const data = await Bluebird.map(Object.values(cluster_1.workers), async (worker) => {
            const correlationId = Math.random();
            worker.send({
                type: 'rpc-request',
                service: 'backend',
                method: 'getOnline',
                arguments: [name],
                correlationId,
            });
            return new Promise((resolve) => handlers.set(correlationId, resolve));
        });
        return (0, lodash_1.sum)(data);
    }
};
ClusterProxy = __decorate([
    (0, typedi_1.Service)()
], ClusterProxy);
exports.ClusterProxy = ClusterProxy;
let ClusterHandler = class ClusterHandler {
    async getOnline(name) {
        const backend = await this.proxyServer.getBackend(name);
        if (!backend)
            return 0;
        return backend.getOnline(true);
    }
};
__decorate([
    (0, typedi_1.Inject)('proxy'),
    __metadata("design:type", proxy_server_1.ProxyServer)
], ClusterHandler.prototype, "proxyServer", void 0);
ClusterHandler = __decorate([
    (0, typedi_1.Service)()
], ClusterHandler);
exports.ClusterHandler = ClusterHandler;
async function masterOnClusterMessage(worker, data) {
    switch (data.type) {
        case 'rpc-request': {
            const clusterProxy = typedi_1.Container.get(ClusterProxy);
            const resp = await clusterProxy[data.method](...data.arguments);
            const rpcResponse = {
                type: 'rpc-response',
                correlationId: data.correlationId,
                data: resp,
            };
            worker.send(rpcResponse);
            break;
        }
        case 'rpc-response': {
            const handler = handlers.get(data.correlationId);
            if (handler)
                await handler(data.data);
            handlers.delete(data.correlationId);
            break;
        }
        default:
    }
}
exports.masterOnClusterMessage = masterOnClusterMessage;
if (cluster_1.isWorker) {
    cluster_1.worker.on('message', async (data) => {
        switch (data.type) {
            case 'rpc-request': {
                const clusterHandler = typedi_1.Container.get(ClusterHandler);
                const resp = await clusterHandler[data.method](...data.arguments);
                const rpcResponse = {
                    type: 'rpc-response',
                    correlationId: data.correlationId,
                    data: resp,
                };
                cluster_1.worker.send(rpcResponse);
                break;
            }
            case 'rpc-response': {
                const handler = handlers.get(data.correlationId);
                if (handler)
                    await handler(data.data);
                handlers.delete(data.correlationId);
                break;
            }
            default:
        }
    });
}
//# sourceMappingURL=cluster.js.map