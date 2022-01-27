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
exports.loadConfig = exports.Config = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const IPCIDR = require("ip-cidr");
const lodash_1 = require("lodash");
const os_1 = require("os");
const path_1 = require("path");
const yimp = require("yaml-import");
class ConfigProxy {
}
__decorate([
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(65535),
    __metadata("design:type", Number)
], ConfigProxy.prototype, "port", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ConfigProxy.prototype, "host", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Transform)((v) => v === 0 ? (0, os_1.cpus)().length : v),
    __metadata("design:type", Number)
], ConfigProxy.prototype, "workers", void 0);
class ServerPingInfo {
}
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ServerPingInfo.prototype, "maxPlayer", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ServerPingInfo.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ServerPingInfo.prototype, "favicon", void 0);
class ConfigServer {
    constructor() {
        this.useProxy = false;
    }
}
__decorate([
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_transformer_1.Transform)((v) => (0, lodash_1.castArray)(v)),
    __metadata("design:type", Array)
], ConfigServer.prototype, "serverName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigServer.prototype, "proxyHost", void 0);
__decorate([
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(65535),
    __metadata("design:type", Number)
], ConfigServer.prototype, "proxyPort", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigServer.prototype, "version", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConfigServer.prototype, "handlePing", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConfigServer.prototype, "onlineMode", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConfigServer.prototype, "useProxy", void 0);
__decorate([
    (0, class_validator_1.IsInstance)(ServerPingInfo),
    (0, class_validator_1.ValidateNested)(),
    (0, class_validator_1.ValidateIf)((e) => e.handlePing),
    __metadata("design:type", ServerPingInfo)
], ConfigServer.prototype, "ping", void 0);
class BlockList {
    constructor() {
        this.ips = [];
        this.usernames = [];
        this.uuids = [];
    }
}
__decorate([
    (0, class_validator_1.IsInstance)(IPCIDR, { each: true }),
    (0, class_transformer_1.Transform)((v) => v.map((e) => new IPCIDR(e))),
    __metadata("design:type", Array)
], BlockList.prototype, "ips", void 0);
__decorate([
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BlockList.prototype, "usernames", void 0);
__decorate([
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BlockList.prototype, "uuids", void 0);
class Config {
    constructor() {
        this.allowListOnly = false;
        this.profileEndpoint = 'https://api.mojang.com/profiles/minecraft';
        this.plugins = [];
    }
}
__decorate([
    (0, class_validator_1.ValidateNested)(),
    __metadata("design:type", ConfigProxy)
], Config.prototype, "proxy", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ConfigServer),
    __metadata("design:type", Array)
], Config.prototype, "servers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], Config.prototype, "defaultServer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], Config.prototype, "allowListOnly", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    __metadata("design:type", BlockList)
], Config.prototype, "blockList", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    __metadata("design:type", BlockList)
], Config.prototype, "allowList", void 0);
__decorate([
    (0, class_validator_1.IsUrl)({ protocols: ['http', 'https'] }),
    __metadata("design:type", Object)
], Config.prototype, "profileEndpoint", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], Config.prototype, "plugins", void 0);
exports.Config = Config;
async function loadConfig(path = (0, path_1.join)(__dirname, '../config/config.yml')) {
    const data = yimp.read(path, { safe: false });
    const config = (0, class_transformer_1.plainToClass)(Config, data, { enableImplicitConversion: true });
    await (0, class_validator_1.validateOrReject)(config);
    return config;
}
exports.loadConfig = loadConfig;
//# sourceMappingURL=config.js.map