"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappLeadResponseSchema = exports.imoveisPaginadosResponseSchema = exports.imovelDetalhesResponseSchema = exports.imovelParamsSchema = exports.atualizarImovelBodySchema = exports.criarImovelBodySchema = exports.buscaImoveisQuerySchema = exports.imoveisMapaResponseSchema = exports.imovelMapaItemSchema = void 0;
const zod_1 = require("zod");
/**
 * 1. Schema do Endpoint Ultra-Leve de Mapa (/api/imoveis/mapa)
 * Projetado especificamente para renderizar centenas de marcadores no Leaflet
 * em smartphones conectados via 3G/4G com mínimo tráfego de dados.
 */
exports.imovelMapaItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    titulo: zod_1.z.string(),
    preco: zod_1.z.number(),
    latitude: zod_1.z.number(),
    longitude: zod_1.z.number(),
    fotoThumbnail: zod_1.z.string().nullable(),
});
exports.imoveisMapaResponseSchema = zod_1.z.array(exports.imovelMapaItemSchema);
/**
 * 2. Schema de Query de Busca e Filtros Geoespaciais (/api/imoveis)
 */
exports.buscaImoveisQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(10),
    minPreco: zod_1.z.coerce.number().positive().optional(),
    maxPreco: zod_1.z.coerce.number().positive().optional(),
    quartos: zod_1.z.coerce.number().int().min(1).optional(),
    bairro: zod_1.z.string().optional(),
    cidade: zod_1.z.string().optional(),
    apenasComTour360: zod_1.z
        .preprocess((val) => {
        if (typeof val === 'string')
            return val.toLowerCase() === 'true';
        return Boolean(val);
    }, zod_1.z.boolean())
        .optional(),
    destaqueAltoPadrao: zod_1.z
        .preprocess((val) => {
        if (typeof val === 'string')
            return val.toLowerCase() === 'true';
        return Boolean(val);
    }, zod_1.z.boolean())
        .optional(),
});
/**
 * 3. Schema de Cadastro de Imóvel (/api/imoveis)
 */
exports.criarImovelBodySchema = zod_1.z.object({
    titulo: zod_1.z.string().min(5, 'Título deve ter no mínimo 5 caracteres'),
    descricao: zod_1.z.string().min(10, 'Descrição detalhada é obrigatória'),
    preco: zod_1.z.number().positive('Preço deve ser maior que zero'),
    areaMetragem: zod_1.z.number().positive('Área deve ser maior que zero'),
    quartos: zod_1.z.number().int().min(0, 'Número de quartos não pode ser negativo'),
    banheiros: zod_1.z.number().int().min(0, 'Número de banheiros não pode ser negativo'),
    vagasGaragem: zod_1.z.number().int().min(0, 'Número de vagas não pode ser negativo'),
    cidade: zod_1.z.string().default('Santo Antônio de Jesus'),
    bairro: zod_1.z.string().min(2, 'Bairro é obrigatório'),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    fotosComuns: zod_1.z.array(zod_1.z.string().url()).default([]),
    fotoPanoramica360Url: zod_1.z.string().url().nullable().optional(),
    temTourVirtual: zod_1.z.boolean().default(false),
    destaqueAltoPadrao: zod_1.z.boolean().default(false),
    corretorId: zod_1.z.string().uuid().optional(),
});
/**
 * 4. Schema de Atualização de Imóvel (/api/imoveis/:id)
 */
exports.atualizarImovelBodySchema = exports.criarImovelBodySchema.partial();
/**
 * 5. Schema dos Parâmetros de Rota com ID (/api/imoveis/:id)
 */
exports.imovelParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('ID do imóvel deve ser um UUID válido'),
});
/**
 * 6. Schema de Detalhes Completos do Imóvel com Lead WhatsApp e Tour 360
 */
exports.imovelDetalhesResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    titulo: zod_1.z.string(),
    descricao: zod_1.z.string(),
    preco: zod_1.z.number(),
    areaMetragem: zod_1.z.number(),
    quartos: zod_1.z.number(),
    banheiros: zod_1.z.number(),
    vagasGaragem: zod_1.z.number(),
    cidade: zod_1.z.string(),
    bairro: zod_1.z.string(),
    latitude: zod_1.z.number(),
    longitude: zod_1.z.number(),
    fotosComuns: zod_1.z.array(zod_1.z.string()),
    fotoPanoramica360Url: zod_1.z.string().nullable(),
    temTourVirtual: zod_1.z.boolean(),
    destaqueAltoPadrao: zod_1.z.boolean(),
    corretorId: zod_1.z.string().uuid(),
    corretor: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        nome: zod_1.z.string(),
        email: zod_1.z.string().email(),
        telefoneWhatsApp: zod_1.z.string(),
        creci: zod_1.z.string(),
    }),
    linkWhatsAppCorretor: zod_1.z.string(),
    createdAt: zod_1.z.union([zod_1.z.date(), zod_1.z.string()]),
    updatedAt: zod_1.z.union([zod_1.z.date(), zod_1.z.string()]),
});
/**
 * 7. Schema de Resposta Paginada da Busca
 */
exports.imoveisPaginadosResponseSchema = zod_1.z.object({
    data: zod_1.z.array(exports.imovelDetalhesResponseSchema),
    pagination: zod_1.z.object({
        total: zod_1.z.number(),
        page: zod_1.z.number(),
        limit: zod_1.z.number(),
        totalPages: zod_1.z.number(),
        hasNextPage: zod_1.z.boolean(),
        hasPrevPage: zod_1.z.boolean(),
    }),
});
/**
 * 8. Schema da Geração de Lead WhatsApp Direto (/api/imoveis/:id/whatsapp-lead)
 */
exports.whatsappLeadResponseSchema = zod_1.z.object({
    whatsappUrl: zod_1.z.string().url(),
    mensagem: zod_1.z.string(),
    corretor: zod_1.z.object({
        nome: zod_1.z.string(),
        telefoneWhatsApp: zod_1.z.string(),
        creci: zod_1.z.string(),
    }),
    imovel: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        titulo: zod_1.z.string(),
        preco: zod_1.z.number(),
        bairro: zod_1.z.string(),
    }),
});
