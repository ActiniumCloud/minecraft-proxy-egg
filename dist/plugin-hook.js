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
exports.PluginHook = exports.MinecraftProxyPlugin = void 0;
const is_1 = require("@sindresorhus/is");
const bunyan_1 = require("bunyan");
const lodash_1 = require("lodash");
const tapable_1 = require("tapable");
const typedi_1 = require("typedi");
const verror_1 = require("verror");
const config_1 = require("./config");
const proxy_server_1 = require("./proxy-server");
class MinecraftProxyPlugin {
    constructor(server, plugin) {
        this.server = server;
        this.plugin = plugin;
    }
}
exports.MinecraftProxyPlugin = MinecraftProxyPlugin;
let PluginHook = class PluginHook {
    constructor(config, server) {
        this.config = config;
        this.server = server;
        this.hooks = Object.freeze({
            server: {
                lookupBackend: new tapable_1.AsyncSeriesBailHook(['serverName']),
                prePipeToBackend: new tapable_1.AsyncParallelHook(['client', 'backend']),
            },
        });
        this.plugins = new Map();
        this.logger = (0, bunyan_1.createLogger)({ name: 'plugin' });
    }
    async loadPlugin() {
        if ((0, lodash_1.isEmpty)(this.config.plugins))
            return;
        for (const pluginPackage of this.config.plugins) {
            try {
                const plugin = require(pluginPackage).default;
                const instance = new plugin(this.server, this);
                let name = instance.name;
                if (!name) {
                    this.logger.warn(`${pluginPackage} has no name, using package name`);
                    name = pluginPackage;
                }
                if (this.plugins.has(name)) {
                    this.logger.warn(`${pluginPackage} has conflict name ${name}, rename to ${pluginPackage}:${name}`);
                    name = `${pluginPackage}:${name}`;
                }
                this.plugins.set(name, instance);
                this.logger.info(`loaded plugin ${name}`);
            }
            catch (e) {
                throw new verror_1.VError({
                    cause: e,
                }, `failed to load plugin ${pluginPackage}`);
            }
        }
    }
    constructPlugin(plugin) {
        if (!is_1.default.class_(plugin))
            throw new verror_1.VError(`${plugin} is not a constructor`);
        return new plugin(this.server, this);
    }
};
PluginHook = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [config_1.Config,
        proxy_server_1.ProxyServer])
], PluginHook);
exports.PluginHook = PluginHook;
//# sourceMappingURL=plugin-hook.js.map