"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponseSchema = exports.loginResponseSchema = exports.corretorResponseSchema = exports.loginBodySchema = void 0;
const zod_1 = require("zod");
exports.loginBodySchema = zod_1.z.object({
    email: zod_1.z.string().email('E-mail inválido'),
    senha: zod_1.z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});
exports.corretorResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    nome: zod_1.z.string(),
    email: zod_1.z.string().email(),
    telefoneWhatsApp: zod_1.z.string(),
    creci: zod_1.z.string(),
    ativo: zod_1.z.boolean(),
    createdAt: zod_1.z.union([zod_1.z.date(), zod_1.z.string()]),
    updatedAt: zod_1.z.union([zod_1.z.date(), zod_1.z.string()]),
});
exports.loginResponseSchema = zod_1.z.object({
    token: zod_1.z.string(),
    corretor: exports.corretorResponseSchema,
});
exports.errorResponseSchema = zod_1.z.object({
    error: zod_1.z.literal(true),
    message: zod_1.z.string(),
    statusCode: zod_1.z.number().optional(),
    details: zod_1.z.any().optional(),
});
