import { z } from 'zod';

export const loginBodySchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export const corretorResponseSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  email: z.string().email(),
  telefoneWhatsApp: z.string(),
  creci: z.string(),
  ativo: z.boolean(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export const loginResponseSchema = z.object({
  token: z.string(),
  corretor: corretorResponseSchema,
});

export const errorResponseSchema = z.object({
  error: z.literal(true),
  message: z.string(),
  statusCode: z.number().optional(),
  details: z.any().optional(),
});

export type LoginBodyInput = z.infer<typeof loginBodySchema>;
export type CorretorResponse = z.infer<typeof corretorResponseSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
