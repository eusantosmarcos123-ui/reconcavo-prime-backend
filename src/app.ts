import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import path from 'path';
import {
  validatorCompiler,
  serializerCompiler,
  jsonSchemaTransform,
} from 'fastify-type-provider-zod';

import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { authRoutes } from './routes/auth.routes';
import { imoveisRoutes } from './routes/imoveis.routes';

export function buildApp(): FastifyInstance {
  const app = fastify({
    logger: false,
  });

  // Configuração dos compiladores de validação e serialização Zod
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Tratamento Global de Erros Padronizado { error: true, message: ... }
  app.setErrorHandler(errorHandler);

  // 1. CORS Totalmente Aberto e Flexível para o Google Stitch e protótipos externos
  app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    credentials: true,
  });

  // 2. Autenticação JWT
  app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  // 3. Servidor de Arquivos Estáticos para Imagens 360 e Fotos Locais
  const uploadsDir = path.resolve(__dirname, '..', 'uploads');
  app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/',
  });

  // 4. Configuração do Swagger / OpenAPI 3.0
  app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Imobiliária Recôncavo Prime API',
        description:
          'API de Alta Performance para o Portal da Imobiliária Recôncavo Prime (Santo Antônio de Jesus - BA). Inclui suporte a coordenadas geoespaciais, imagens panorâmicas 360 equirretangulares para WebXR/A-Frame, geração de leads de WhatsApp e endpoints ultra-leves para mobile. Totalmente acoplável ao Google Stitch.',
        version: '1.0.0',
        contact: {
          name: 'Staff Backend Architecture Team',
          email: 'suporte@reconcavoprime.com.br',
        },
      },
      servers: [
        {
          url: env.API_BASE_URL,
          description: 'Servidor Local de Desenvolvimento',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Insira o token JWT gerado em /api/auth/login',
          },
        },
      },
      tags: [
        { name: 'Autenticação & Corretores', description: 'Gestão de credenciais e acesso seguro dos corretores' },
        { name: 'Imóveis & Mapa Interativo', description: 'Busca geoespacial, tour 360 e mapa ultra-leve para Leaflet' },
        { name: 'Lead WhatsApp Direto', description: 'Geração de links parametrizados de contato instantâneo' },
        { name: 'Gestão de Imóveis (Corretores)', description: 'Cadastro e manutenção restrita do catálogo de imóveis' },
      ],
    },
    transform: jsonSchemaTransform,
  });

  // Interface Visual do Swagger (/docs)
  app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // 5. Rota dedicada para exportar o OpenAPI JSON puro para o Google Stitch (@google/stitch-sdk)
  app.get('/api/openapi.json', async (_request, reply) => {
    return reply.send(app.swagger());
  });

  // 6. Health Check
  app.get('/api/health', async () => {
    return {
      status: 'UP',
      app: 'Imobiliária Recôncavo Prime API',
      cidade: 'Santo Antônio de Jesus - BA',
      timestamp: new Date().toISOString(),
    };
  });

  // 7. Registro de Rotas de Negócio
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(imoveisRoutes, { prefix: '/api/imoveis' });

  return app;
}
