"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
function errorHandler(error, _request, reply) {
    // 1. Tratamento específico para erros de validação Zod
    if (error instanceof zod_1.ZodError) {
        const issueMessages = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
        return reply.status(400).send({
            error: true,
            message: `Erro de validação: ${issueMessages}`,
            statusCode: 400,
            details: error.issues,
        });
    }
    // 2. Erros do Fastify com statusCode
    if ('statusCode' in error && typeof error.statusCode === 'number') {
        return reply.status(error.statusCode).send({
            error: true,
            message: error.message || 'Erro durante o processamento da requisição',
            statusCode: error.statusCode,
        });
    }
    // 3. Erro interno não tratado
    console.error('[Internal Server Error]:', error);
    return reply.status(500).send({
        error: true,
        message: 'Ocorreu um erro interno no servidor da Recôncavo Prime.',
        statusCode: 500,
    });
}
