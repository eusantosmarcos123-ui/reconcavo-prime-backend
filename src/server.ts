import { buildApp } from './app';
import { env } from './config/env';

async function bootstrap() {
  const app = buildApp();

  try {
    await app.ready();
    await app.listen({ port: env.PORT, host: env.HOST });

    console.log('\n=============================================================');
    console.log('🏛️  IMOBILIÁRIA RECÔNCAVO PRIME - BACKEND DE ALTA PERFORMANCE');
    console.log('📍  Santo Antônio de Jesus - Bahia');
    console.log('=============================================================');
    console.log(`🚀 Servidor Ativo em:         http://localhost:${env.PORT}`);
    console.log(`📄 Documentação Swagger UI:   http://localhost:${env.PORT}/docs`);
    console.log(`🤖 Export Google Stitch JSON: http://localhost:${env.PORT}/api/openapi.json`);
    console.log(`🗺️  Pins Mapa Ultra-Leve:      http://localhost:${env.PORT}/api/imoveis/mapa`);
    console.log(`🏡 Listagem de Imóveis:       http://localhost:${env.PORT}/api/imoveis`);
    console.log('=============================================================\n');
  } catch (err) {
    console.error('Erro crítico ao iniciar o servidor:', err);
    process.exit(1);
  }
}

bootstrap();
