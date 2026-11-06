"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
async function authenticate(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        return reply.status(401).send({
            error: true,
            message: 'Acesso não autorizado. Token JWT ausente ou expirado.',
            statusCode: 401,
        });
    }
}
