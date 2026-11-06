"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middlewares/auth");
const auth_schema_1 = require("../schemas/auth.schema");
// Rastreador em memória de tentativas de login para mitigar força bruta
const failedLoginAttempts = new Map();
async function authRoutes(app) {
    const router = app.withTypeProvider();
    /**
     * POST /api/auth/login
     * Autentica o corretor e devolve o token JWT para gestão dos imóveis.
     */
    router.post('/login', {
        schema: {
            tags: ['Autenticação & Corretores'],
            summary: 'Autentica um corretor',
            description: 'Recebe e-mail e senha, valida credenciais e retorna o token JWT e dados do corretor.',
            body: auth_schema_1.loginBodySchema,
            response: {
                200: auth_schema_1.loginResponseSchema,
                401: auth_schema_1.errorResponseSchema,
                400: auth_schema_1.errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        const { email, senha } = request.body;
        const clientIp = request.ip || 'unknown';
        const rateLimitKey = `${clientIp}_${email.toLowerCase()}`;
        const now = Date.now();
        const attemptRecord = failedLoginAttempts.get(rateLimitKey);
        if (attemptRecord && attemptRecord.lockedUntil > now) {
            const remainingMinutes = Math.ceil((attemptRecord.lockedUntil - now) / 60000);
            return reply.status(401).send({
                error: true,
                message: `Muitas tentativas incorretas. Conta temporariamente bloqueada por segurança. Tente novamente em ${remainingMinutes} minuto(s).`,
                statusCode: 401,
            });
        }
        const corretor = await prisma_1.prisma.corretor.findUnique({
            where: { email },
        });
        if (!corretor || !corretor.ativo) {
            const count = (attemptRecord ? attemptRecord.count : 0) + 1;
            failedLoginAttempts.set(rateLimitKey, {
                count,
                lockedUntil: count >= 5 ? now + 15 * 60 * 1000 : 0,
            });
            return reply.status(401).send({
                error: true,
                message: 'Credenciais inválidas ou corretor inativo.',
                statusCode: 401,
            });
        }
        const senhaValida = await bcryptjs_1.default.compare(senha, corretor.senhaHash);
        if (!senhaValida) {
            const count = (attemptRecord ? attemptRecord.count : 0) + 1;
            failedLoginAttempts.set(rateLimitKey, {
                count,
                lockedUntil: count >= 5 ? now + 15 * 60 * 1000 : 0,
            });
            return reply.status(401).send({
                error: true,
                message: 'Credenciais inválidas.',
                statusCode: 401,
            });
        }
        // Sucesso: Limpa tentativas falhas
        failedLoginAttempts.delete(rateLimitKey);
        // Gera o token JWT com payload essencial
        const token = app.jwt.sign({
            id: corretor.id,
            email: corretor.email,
            nome: corretor.nome,
        }, {
            expiresIn: '7d',
        });
        return reply.send({
            token,
            corretor: {
                id: corretor.id,
                nome: corretor.nome,
                email: corretor.email,
                telefoneWhatsApp: corretor.telefoneWhatsApp,
                creci: corretor.creci,
                ativo: corretor.ativo,
                createdAt: corretor.createdAt,
                updatedAt: corretor.updatedAt,
            },
        });
    });
    /**
     * GET /api/auth/me
     * Retorna os dados do corretor atualmente autenticado através do JWT.
     */
    router.get('/me', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['Autenticação & Corretores'],
            summary: 'Dados do corretor autenticado',
            description: 'Retorna as informações do perfil do corretor com base no cabeçalho Authorization Bearer.',
            security: [{ bearerAuth: [] }],
            response: {
                200: auth_schema_1.corretorResponseSchema,
                401: auth_schema_1.errorResponseSchema,
                404: auth_schema_1.errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        const { id } = request.user;
        const corretor = await prisma_1.prisma.corretor.findUnique({
            where: { id },
        });
        if (!corretor) {
            return reply.status(404).send({
                error: true,
                message: 'Corretor não encontrado.',
                statusCode: 404,
            });
        }
        return reply.send({
            id: corretor.id,
            nome: corretor.nome,
            email: corretor.email,
            telefoneWhatsApp: corretor.telefoneWhatsApp,
            creci: corretor.creci,
            ativo: corretor.ativo,
            createdAt: corretor.createdAt,
            updatedAt: corretor.updatedAt,
        });
    });
}
