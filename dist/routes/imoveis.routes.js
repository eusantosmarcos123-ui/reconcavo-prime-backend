"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imoveisRoutes = imoveisRoutes;
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middlewares/auth");
const whatsapp_1 = require("../lib/whatsapp");
const equirectangular_1 = require("../lib/equirectangular");
const imovel_schema_1 = require("../schemas/imovel.schema");
const auth_schema_1 = require("../schemas/auth.schema");
const zod_1 = require("zod");
async function imoveisRoutes(app) {
    const router = app.withTypeProvider();
    /**
     * Helper para desserializar fotosComuns e gerar o link dinâmico de WhatsApp
     */
    function formatarImovelDetalhes(imovel) {
        let fotosArray = [];
        try {
            fotosArray = typeof imovel.fotosComuns === 'string' ? JSON.parse(imovel.fotosComuns) : (imovel.fotosComuns || []);
        }
        catch {
            fotosArray = [];
        }
        const { whatsappUrl } = (0, whatsapp_1.gerarLinkWhatsAppLead)({
            telefone: imovel.corretor.telefoneWhatsApp,
            nomeCorretor: imovel.corretor.nome,
            tituloImovel: imovel.titulo,
        });
        return {
            ...imovel,
            fotosComuns: fotosArray,
            linkWhatsAppCorretor: whatsappUrl,
        };
    }
    /**
     * A. GET /api/imoveis/mapa
     * Endpoint Ultra-Leve para plotagem em massa de Pins no mapa Leaflet.
     * Não sobrecarrega memória nem conexões móveis (3G/4G).
     */
    router.get('/mapa', {
        schema: {
            tags: ['Imóveis & Mapa Interativo'],
            summary: 'Pins de mapa ultra-leves (Leaflet)',
            description: 'Retorna exclusivamente coordenadas, título, preço e miniatura para renderizar centenas de marcadores no mapa sem travamento mobile.',
            response: {
                200: imovel_schema_1.imoveisMapaResponseSchema,
            },
        },
    }, async (_request, reply) => {
        const imoveis = await prisma_1.prisma.imovel.findMany({
            select: {
                id: true,
                titulo: true,
                preco: true,
                latitude: true,
                longitude: true,
                fotosComuns: true,
                fotoPanoramica360Url: true,
            },
        });
        const pins = imoveis.map((item) => {
            let thumbnail = null;
            try {
                const parsed = JSON.parse(item.fotosComuns);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    thumbnail = parsed[0];
                }
            }
            catch {
                thumbnail = null;
            }
            if (!thumbnail && item.fotoPanoramica360Url) {
                thumbnail = item.fotoPanoramica360Url;
            }
            return {
                id: item.id,
                titulo: item.titulo,
                preco: item.preco,
                latitude: item.latitude,
                longitude: item.longitude,
                fotoThumbnail: thumbnail,
            };
        });
        return reply.send(pins);
    });
    /**
     * B. GET /api/imoveis
     * Busca com filtros geoespaciais, tour 360 e paginação.
     */
    router.get('/', {
        schema: {
            tags: ['Imóveis & Mapa Interativo'],
            summary: 'Listagem e busca de imóveis com filtros',
            description: 'Busca paginada por faixa de preço, quartos, bairros de SAJ e presença de Tour Virtual 360.',
            querystring: imovel_schema_1.buscaImoveisQuerySchema,
            response: {
                200: imovel_schema_1.imoveisPaginadosResponseSchema,
            },
        },
    }, async (request, reply) => {
        const { page = 1, limit = 10, minPreco, maxPreco, quartos, bairro, cidade, apenasComTour360, destaqueAltoPadrao, } = request.query;
        const where = {};
        if (minPreco !== undefined || maxPreco !== undefined) {
            where.preco = {};
            if (minPreco !== undefined)
                where.preco.gte = minPreco;
            if (maxPreco !== undefined)
                where.preco.lte = maxPreco;
        }
        if (quartos !== undefined) {
            where.quartos = { gte: quartos };
        }
        if (bairro) {
            where.bairro = { contains: bairro };
        }
        if (cidade) {
            where.cidade = { contains: cidade };
        }
        if (apenasComTour360) {
            where.temTourVirtual = true;
        }
        if (destaqueAltoPadrao !== undefined) {
            where.destaqueAltoPadrao = destaqueAltoPadrao;
        }
        const skip = (page - 1) * limit;
        const [total, imoveis] = await Promise.all([
            prisma_1.prisma.imovel.count({ where }),
            prisma_1.prisma.imovel.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    corretor: {
                        select: {
                            id: true,
                            nome: true,
                            email: true,
                            telefoneWhatsApp: true,
                            creci: true,
                        },
                    },
                },
            }),
        ]);
        const formatted = imoveis.map(formatarImovelDetalhes);
        const totalPages = Math.ceil(total / limit) || 1;
        return reply.send({
            data: formatted,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    });
    /**
     * C. GET /api/imoveis/:id
     * Detalhes completos do imóvel (inclui linkWhatsAppCorretor e fotoPanoramica360Url).
     */
    router.get('/:id', {
        schema: {
            tags: ['Imóveis & Mapa Interativo'],
            summary: 'Detalhes completos do imóvel',
            description: 'Retorna todas as especificações técnicas, URLs das fotos, imagem 360 equirretangular e link formatado para WhatsApp.',
            params: imovel_schema_1.imovelParamsSchema,
            response: {
                200: imovel_schema_1.imovelDetalhesResponseSchema,
                404: auth_schema_1.errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const imovel = await prisma_1.prisma.imovel.findUnique({
            where: { id },
            include: {
                corretor: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        telefoneWhatsApp: true,
                        creci: true,
                    },
                },
            },
        });
        if (!imovel) {
            return reply.status(404).send({
                error: true,
                message: 'Imóvel não encontrado.',
                statusCode: 404,
            });
        }
        return reply.send(formatarImovelDetalhes(imovel));
    });
    /**
     * D. GET /api/imoveis/:id/whatsapp-lead
     * Gera o link direto ou redireciona o cliente para o WhatsApp do corretor responsável
     */
    router.get('/:id/whatsapp-lead', {
        schema: {
            tags: ['Lead WhatsApp Direto'],
            summary: 'Link dinâmico de WhatsApp para o corretor responsável',
            description: 'Gera a URL de contato direto no WhatsApp com mensagem de lead personalizada.',
            params: imovel_schema_1.imovelParamsSchema,
            querystring: zod_1.z.object({
                redirect: zod_1.z.preprocess((val) => val === 'true' || val === true, zod_1.z.boolean()).optional(),
            }),
            response: {
                200: imovel_schema_1.whatsappLeadResponseSchema,
                404: auth_schema_1.errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const { redirect = false } = request.query;
        const imovel = await prisma_1.prisma.imovel.findUnique({
            where: { id },
            include: {
                corretor: true,
            },
        });
        if (!imovel) {
            return reply.status(404).send({
                error: true,
                message: 'Imóvel não encontrado.',
                statusCode: 404,
            });
        }
        const leadInfo = (0, whatsapp_1.gerarLinkWhatsAppLead)({
            telefone: imovel.corretor.telefoneWhatsApp,
            nomeCorretor: imovel.corretor.nome,
            tituloImovel: imovel.titulo,
        });
        if (redirect) {
            return reply.redirect(leadInfo.whatsappUrl, 302);
        }
        return reply.send({
            whatsappUrl: leadInfo.whatsappUrl,
            mensagem: leadInfo.mensagem,
            corretor: {
                nome: imovel.corretor.nome,
                telefoneWhatsApp: imovel.corretor.telefoneWhatsApp,
                creci: imovel.corretor.creci,
            },
            imovel: {
                id: imovel.id,
                titulo: imovel.titulo,
                preco: imovel.preco,
                bairro: imovel.bairro,
            },
        });
    });
    /**
     * E. POST /api/imoveis
     * Cadastro de imóvel por corretor autenticado (Área Restrita).
     */
    router.post('/', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['Gestão de Imóveis (Corretores)'],
            summary: 'Cadastrar novo imóvel',
            description: 'Endpoint restrito aos corretores. Cria um imóvel com suporte a coordenadas e fotos 360.',
            security: [{ bearerAuth: [] }],
            body: imovel_schema_1.criarImovelBodySchema,
            response: {
                201: imovel_schema_1.imovelDetalhesResponseSchema,
                400: auth_schema_1.errorResponseSchema,
                401: auth_schema_1.errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        const userId = request.user.id;
        const data = request.body;
        // Validação da imagem panorâmica 360 se fornecida
        let temTour = Boolean(data.temTourVirtual);
        if (data.fotoPanoramica360Url) {
            const val360 = (0, equirectangular_1.validarUrlPanoramica360)(data.fotoPanoramica360Url);
            if (!val360.valido) {
                return reply.status(400).send({
                    error: true,
                    message: `Imagem 360 inválida: ${val360.motivo}`,
                    statusCode: 400,
                });
            }
            temTour = true;
        }
        // Prevenção contra Mass Assignment / Spoofing: Força estritamente o ID do corretor autenticado
        const corretorId = userId;
        const novoImovel = await prisma_1.prisma.imovel.create({
            data: {
                titulo: data.titulo,
                descricao: data.descricao,
                preco: data.preco,
                areaMetragem: data.areaMetragem,
                quartos: data.quartos,
                banheiros: data.banheiros,
                vagasGaragem: data.vagasGaragem,
                cidade: data.cidade || 'Santo Antônio de Jesus',
                bairro: data.bairro,
                latitude: data.latitude,
                longitude: data.longitude,
                fotosComuns: JSON.stringify(data.fotosComuns || []),
                fotoPanoramica360Url: data.fotoPanoramica360Url || null,
                temTourVirtual: temTour,
                destaqueAltoPadrao: Boolean(data.destaqueAltoPadrao),
                corretorId,
            },
            include: {
                corretor: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        telefoneWhatsApp: true,
                        creci: true,
                    },
                },
            },
        });
        return reply.status(201).send(formatarImovelDetalhes(novoImovel));
    });
    /**
     * F. PUT /api/imoveis/:id
     * Atualização cadastral de imóvel (Área Restrita).
     */
    router.put('/:id', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['Gestão de Imóveis (Corretores)'],
            summary: 'Atualizar dados de um imóvel',
            description: 'Permite ao corretor responsável atualizar as informações do imóvel.',
            security: [{ bearerAuth: [] }],
            params: imovel_schema_1.imovelParamsSchema,
            body: imovel_schema_1.atualizarImovelBodySchema,
            response: {
                200: imovel_schema_1.imovelDetalhesResponseSchema,
                400: auth_schema_1.errorResponseSchema,
                401: auth_schema_1.errorResponseSchema,
                403: auth_schema_1.errorResponseSchema,
                404: auth_schema_1.errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const data = request.body;
        const imovelExistente = await prisma_1.prisma.imovel.findUnique({
            where: { id },
        });
        if (!imovelExistente) {
            return reply.status(404).send({
                error: true,
                message: 'Imóvel não encontrado.',
                statusCode: 404,
            });
        }
        // Prevenção BOLA / IDOR: Garante que apenas o corretor proprietário pode editar
        if (imovelExistente.corretorId !== request.user.id) {
            return reply.status(403).send({
                error: true,
                message: 'Acesso negado: Você não tem permissão para atualizar imóveis de outro corretor.',
                statusCode: 403,
            });
        }
        // Validação da imagem 360 se atualizada
        let temTour = imovelExistente.temTourVirtual;
        if (data.fotoPanoramica360Url !== undefined) {
            if (data.fotoPanoramica360Url) {
                const val360 = (0, equirectangular_1.validarUrlPanoramica360)(data.fotoPanoramica360Url);
                if (!val360.valido) {
                    return reply.status(400).send({
                        error: true,
                        message: `Imagem 360 inválida: ${val360.motivo}`,
                        statusCode: 400,
                    });
                }
                temTour = true;
            }
            else {
                temTour = false;
            }
        }
        const updateData = { ...data };
        if (data.fotosComuns !== undefined) {
            updateData.fotosComuns = JSON.stringify(data.fotosComuns);
        }
        if (data.fotoPanoramica360Url !== undefined) {
            updateData.temTourVirtual = temTour;
        }
        const imovelAtualizado = await prisma_1.prisma.imovel.update({
            where: { id },
            data: updateData,
            include: {
                corretor: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        telefoneWhatsApp: true,
                        creci: true,
                    },
                },
            },
        });
        return reply.send(formatarImovelDetalhes(imovelAtualizado));
    });
    /**
     * G. DELETE /api/imoveis/:id
     * Remoção de imóvel (Área Restrita).
     */
    router.delete('/:id', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['Gestão de Imóveis (Corretores)'],
            summary: 'Remover imóvel',
            description: 'Exclui o imóvel do catálogo da imobiliária.',
            security: [{ bearerAuth: [] }],
            params: imovel_schema_1.imovelParamsSchema,
            response: {
                200: zod_1.z.object({
                    success: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                }),
                401: auth_schema_1.errorResponseSchema,
                403: auth_schema_1.errorResponseSchema,
                404: auth_schema_1.errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const imovelExistente = await prisma_1.prisma.imovel.findUnique({
            where: { id },
        });
        if (!imovelExistente) {
            return reply.status(404).send({
                error: true,
                message: 'Imóvel não encontrado.',
                statusCode: 404,
            });
        }
        // Prevenção BOLA / IDOR: Garante que apenas o corretor proprietário pode excluir
        if (imovelExistente.corretorId !== request.user.id) {
            return reply.status(403).send({
                error: true,
                message: 'Acesso negado: Você não tem permissão para remover imóveis de outro corretor.',
                statusCode: 403,
            });
        }
        await prisma_1.prisma.imovel.delete({
            where: { id },
        });
        return reply.send({
            success: true,
            message: 'Imóvel removido com sucesso.',
        });
    });
}
