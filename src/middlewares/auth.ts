import { FastifyRequest, FastifyReply } from 'fastify';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      nome: string;
    };
    user: {
      id: string;
      email: string;
      nome: string;
    };
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({
      error: true,
      message: 'Acesso não autorizado. Token JWT ausente ou expirado.',
      statusCode: 401,
    });
  }
}
