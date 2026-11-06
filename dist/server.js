"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
async function bootstrap() {
    const app = (0, app_1.buildApp)();
    try {
        await app.ready();
        await app.listen({ port: env_1.env.PORT, host: env_1.env.HOST });
        console.log('\n=============================================================');
        console.log('🏛️  IMOBILIÁRIA RECÔNCAVO PRIME - BACKEND DE ALTA PERFORMANCE');
        console.log('📍  Santo Antônio de Jesus - Bahia');
        console.log('=============================================================');
        console.log(`🚀 Servidor Ativo em:         http://localhost:${env_1.env.PORT}`);
        console.log(`📄 Documentação Swagger UI:   http://localhost:${env_1.env.PORT}/docs`);
        console.log(`🤖 Export Google Stitch JSON: http://localhost:${env_1.env.PORT}/api/openapi.json`);
        console.log(`🗺️  Pins Mapa Ultra-Leve:      http://localhost:${env_1.env.PORT}/api/imoveis/mapa`);
        console.log(`🏡 Listagem de Imóveis:       http://localhost:${env_1.env.PORT}/api/imoveis`);
        console.log('=============================================================\n');
    }
    catch (err) {
        console.error('Erro crítico ao iniciar o servidor:', err);
        process.exit(1);
    }
}
bootstrap();
