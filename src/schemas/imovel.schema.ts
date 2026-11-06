import { z } from 'zod';

/**
 * 1. Schema do Endpoint Ultra-Leve de Mapa (/api/imoveis/mapa)
 * Projetado especificamente para renderizar centenas de marcadores no Leaflet
 * em smartphones conectados via 3G/4G com mínimo tráfego de dados.
 */
export const imovelMapaItemSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string(),
  preco: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  fotoThumbnail: z.string().nullable(),
});

export const imoveisMapaResponseSchema = z.array(imovelMapaItemSchema);

/**
 * 2. Schema de Query de Busca e Filtros Geoespaciais (/api/imoveis)
 */
export const buscaImoveisQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  minPreco: z.coerce.number().positive().optional(),
  maxPreco: z.coerce.number().positive().optional(),
  quartos: z.coerce.number().int().min(1).optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  apenasComTour360: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.toLowerCase() === 'true';
      return Boolean(val);
    }, z.boolean())
    .optional(),
  destaqueAltoPadrao: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.toLowerCase() === 'true';
      return Boolean(val);
    }, z.boolean())
    .optional(),
});

/**
 * 3. Schema de Cadastro de Imóvel (/api/imoveis)
 */
export const criarImovelBodySchema = z.object({
  titulo: z.string().min(5, 'Título deve ter no mínimo 5 caracteres'),
  descricao: z.string().min(10, 'Descrição detalhada é obrigatória'),
  preco: z.number().positive('Preço deve ser maior que zero'),
  areaMetragem: z.number().positive('Área deve ser maior que zero'),
  quartos: z.number().int().min(0, 'Número de quartos não pode ser negativo'),
  banheiros: z.number().int().min(0, 'Número de banheiros não pode ser negativo'),
  vagasGaragem: z.number().int().min(0, 'Número de vagas não pode ser negativo'),
  cidade: z.string().default('Santo Antônio de Jesus'),
  bairro: z.string().min(2, 'Bairro é obrigatório'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  fotosComuns: z.array(z.string().url()).default([]),
  fotoPanoramica360Url: z.string().url().nullable().optional(),
  temTourVirtual: z.boolean().default(false),
  destaqueAltoPadrao: z.boolean().default(false),
  corretorId: z.string().uuid().optional(),
});

/**
 * 4. Schema de Atualização de Imóvel (/api/imoveis/:id)
 */
export const atualizarImovelBodySchema = criarImovelBodySchema.partial();

/**
 * 5. Schema dos Parâmetros de Rota com ID (/api/imoveis/:id)
 */
export const imovelParamsSchema = z.object({
  id: z.string().uuid('ID do imóvel deve ser um UUID válido'),
});

/**
 * 6. Schema de Detalhes Completos do Imóvel com Lead WhatsApp e Tour 360
 */
export const imovelDetalhesResponseSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string(),
  descricao: z.string(),
  preco: z.number(),
  areaMetragem: z.number(),
  quartos: z.number(),
  banheiros: z.number(),
  vagasGaragem: z.number(),
  cidade: z.string(),
  bairro: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  fotosComuns: z.array(z.string()),
  fotoPanoramica360Url: z.string().nullable(),
  temTourVirtual: z.boolean(),
  destaqueAltoPadrao: z.boolean(),
  corretorId: z.string().uuid(),
  corretor: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    email: z.string().email(),
    telefoneWhatsApp: z.string(),
    creci: z.string(),
  }),
  linkWhatsAppCorretor: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

/**
 * 7. Schema de Resposta Paginada da Busca
 */
export const imoveisPaginadosResponseSchema = z.object({
  data: z.array(imovelDetalhesResponseSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

/**
 * 8. Schema da Geração de Lead WhatsApp Direto (/api/imoveis/:id/whatsapp-lead)
 */
export const whatsappLeadResponseSchema = z.object({
  whatsappUrl: z.string().url(),
  mensagem: z.string(),
  corretor: z.object({
    nome: z.string(),
    telefoneWhatsApp: z.string(),
    creci: z.string(),
  }),
  imovel: z.object({
    id: z.string().uuid(),
    titulo: z.string(),
    preco: z.number(),
    bairro: z.string(),
  }),
});

export type ImovelMapaItem = z.infer<typeof imovelMapaItemSchema>;
export type BuscaImoveisQuery = z.infer<typeof buscaImoveisQuerySchema>;
export type CriarImovelBody = z.infer<typeof criarImovelBodySchema>;
export type AtualizarImovelBody = z.infer<typeof atualizarImovelBodySchema>;
export type ImovelDetalhesResponse = z.infer<typeof imovelDetalhesResponseSchema>;
export type WhatsappLeadResponse = z.infer<typeof whatsappLeadResponseSchema>;
