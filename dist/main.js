"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = void 0;
require("reflect-metadata");
const typedi_1 = require("typedi");
const config_1 = require("./config");
const proxy_server_1 = require("./proxy-server");
async function bootstrap() {
    const config = await (0, config_1.loadConfig)();
    typedi_1.Container.set('config', config);
    typedi_1.Container.set(config_1.Config, config);
    const proxy = new proxy_server_1.ProxyServer(config.proxy.port, config.proxy.host);
    typedi_1.Container.set('proxy', proxy);
    for (const server of config.servers) {
        proxy.addBackend(server.serverName, {
            ...server,
            host: server.proxyHost,
            port: server.proxyPort,
        });
    }
    proxy.defaultServer = config.defaultServer;
    await proxy.plugin.loadPlugin();
    await proxy.listen();
}
exports.bootstrap = bootstrap;
if (require.main === module) {
    bootstrap()
        .catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
//# sourceMappingURL=main.js.map