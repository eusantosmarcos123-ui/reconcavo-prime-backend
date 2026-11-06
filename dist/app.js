"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const static_1 = __importDefault(require("@fastify/static"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const path_1 = __importDefault(require("path"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const env_1 = require("./config/env");
const errorHandler_1 = require("./middlewares/errorHandler");
const auth_routes_1 = require("./routes/auth.routes");
const imoveis_routes_1 = require("./routes/imoveis.routes");
function buildApp() {
    const app = (0, fastify_1.default)({
        logger: false,
    });
    // Configuração dos compiladores de validação e serialização Zod
    app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
    app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
    // Tratamento Global de Erros Padronizado { error: true, message: ... }
    app.setErrorHandler(errorHandler_1.errorHandler);
    // 1. CORS Totalmente Aberto e Flexível para o Google Stitch e protótipos externos
    app.register(cors_1.default, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
        credentials: true,
    });
    // 2. Autenticação JWT
    app.register(jwt_1.default, {
        secret: env_1.env.JWT_SECRET,
    });
    // 3. Servidor de Arquivos Estáticos para Imagens 360 e Fotos Locais
    const uploadsDir = path_1.default.resolve(__dirname, '..', 'uploads');
    app.register(static_1.default, {
        root: uploadsDir,
        prefix: '/uploads/',
    });
    // 4. Configuração do Swagger / OpenAPI 3.0
    app.register(swagger_1.default, {
        openapi: {
            openapi: '3.0.3',
            info: {
                title: 'Imobiliária Recôncavo Prime API',
                description: 'API de Alta Performance para o Portal da Imobiliária Recôncavo Prime (Santo Antônio de Jesus - BA). Inclui suporte a coordenadas geoespaciais, imagens panorâmicas 360 equirretangulares para WebXR/A-Frame, geração de leads de WhatsApp e endpoints ultra-leves para mobile. Totalmente acoplável ao Google Stitch.',
                version: '1.0.0',
                contact: {
                    name: 'Staff Backend Architecture Team',
                    email: 'suporte@reconcavoprime.com.br',
                },
            },
            servers: [
                {
                    url: env_1.env.API_BASE_URL,
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
        transform: fastify_type_provider_zod_1.jsonSchemaTransform,
    });
    // Interface Visual do Swagger (/docs)
    app.register(swagger_ui_1.default, {
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
    app.register(auth_routes_1.authRoutes, { prefix: '/api/auth' });
    app.register(imoveis_routes_1.imoveisRoutes, { prefix: '/api/imoveis' });
    return app;
}
