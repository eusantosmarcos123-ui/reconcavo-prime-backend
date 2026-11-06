import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middlewares/auth';
import { gerarLinkWhatsAppLead } from '../lib/whatsapp';
import { validarUrlPanoramica360 } from '../lib/equirectangular';
import {
  imoveisMapaResponseSchema,
  buscaImoveisQuerySchema,
  imoveisPaginadosResponseSchema,
  imovelDetalhesResponseSchema,
  imovelParamsSchema,
  criarImovelBodySchema,
  atualizarImovelBodySchema,
  whatsappLeadResponseSchema,
} from '../schemas/imovel.schema';
import { errorResponseSchema } from '../schemas/auth.schema';
import { z } from 'zod';

export async function imoveisRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>();

  /**
   * Helper para desserializar fotosComuns e gerar o link dinâmico de WhatsApp
   */
  function formatarImovelDetalhes(imovel: any) {
    let fotosArray: string[] = [];
    try {
      fotosArray = typeof imovel.fotosComuns === 'string' ? JSON.parse(imovel.fotosComuns) : (imovel.fotosComuns || []);
    } catch {
      fotosArray = [];
    }

    const { whatsappUrl } = gerarLinkWhatsAppLead({
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
  router.get(
    '/mapa',
    {
      schema: {
        tags: ['Imóveis & Mapa Interativo'],
        summary: 'Pins de mapa ultra-leves (Leaflet)',
        description: 'Retorna exclusivamente coordenadas, título, preço e miniatura para renderizar centenas de marcadores no mapa sem travamento mobile.',
        response: {
          200: imoveisMapaResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      const imoveis = await prisma.imovel.findMany({
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
        let thumbnail: string | null = null;
        try {
          const parsed = JSON.parse(item.fotosComuns);
          if (Array.isArray(parsed) && parsed.length > 0) {
            thumbnail = parsed[0];
          }
        } catch {
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
    }
  );

  /**
   * B. GET /api/imoveis
   * Busca com filtros geoespaciais, tour 360 e paginação.
   */
  router.get(
    '/',
    {
      schema: {
        tags: ['Imóveis & Mapa Interativo'],
        summary: 'Listagem e busca de imóveis com filtros',
        description: 'Busca paginada por faixa de preço, quartos, bairros de SAJ e presença de Tour Virtual 360.',
        querystring: buscaImoveisQuerySchema,
        response: {
          200: imoveisPaginadosResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const {
        page = 1,
        limit = 10,
        minPreco,
        maxPreco,
        quartos,
        bairro,
        cidade,
        apenasComTour360,
        destaqueAltoPadrao,
      } = request.query;

      const where: any = {};

      if (minPreco !== undefined || maxPreco !== undefined) {
        where.preco = {};
        if (minPreco !== undefined) where.preco.gte = minPreco;
        if (maxPreco !== undefined) where.preco.lte = maxPreco;
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
        prisma.imovel.count({ where }),
        prisma.imovel.findMany({
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
    }
  );

  /**
   * C. GET /api/imoveis/:id
   * Detalhes completos do imóvel (inclui linkWhatsAppCorretor e fotoPanoramica360Url).
   */
  router.get(
    '/:id',
    {
      schema: {
        tags: ['Imóveis & Mapa Interativo'],
        summary: 'Detalhes completos do imóvel',
        description: 'Retorna todas as especificações técnicas, URLs das fotos, imagem 360 equirretangular e link formatado para WhatsApp.',
        params: imovelParamsSchema,
        response: {
          200: imovelDetalhesResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const imovel = await prisma.imovel.findUnique({
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
    }
  );

  /**
   * D. GET /api/imoveis/:id/whatsapp-lead
   * Gera o link direto ou redireciona o cliente para o WhatsApp do corretor responsável
   */
  router.get(
    '/:id/whatsapp-lead',
    {
      schema: {
        tags: ['Lead WhatsApp Direto'],
        summary: 'Link dinâmico de WhatsApp para o corretor responsável',
        description: 'Gera a URL de contato direto no WhatsApp com mensagem de lead personalizada.',
        params: imovelParamsSchema,
        querystring: z.object({
          redirect: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
        }),
        response: {
          200: whatsappLeadResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { redirect = false } = request.query;

      const imovel = await prisma.imovel.findUnique({
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

      const leadInfo = gerarLinkWhatsAppLead({
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
    }
  );

  /**
   * E. POST /api/imoveis
   * Cadastro de imóvel por corretor autenticado (Área Restrita).
   */
  router.post(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Gestão de Imóveis (Corretores)'],
        summary: 'Cadastrar novo imóvel',
        description: 'Endpoint restrito aos corretores. Cria um imóvel com suporte a coordenadas e fotos 360.',
        security: [{ bearerAuth: [] }],
        body: criarImovelBodySchema,
        response: {
          201: imovelDetalhesResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = request.user.id;
      const data = request.body;

      // Validação da imagem panorâmica 360 se fornecida
      let temTour = Boolean(data.temTourVirtual);
      if (data.fotoPanoramica360Url) {
        const val360 = validarUrlPanoramica360(data.fotoPanoramica360Url);
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

      const novoImovel = await prisma.imovel.create({
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
    }
  );

  /**
   * F. PUT /api/imoveis/:id
   * Atualização cadastral de imóvel (Área Restrita).
   */
  router.put(
    '/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Gestão de Imóveis (Corretores)'],
        summary: 'Atualizar dados de um imóvel',
        description: 'Permite ao corretor responsável atualizar as informações do imóvel.',
        security: [{ bearerAuth: [] }],
        params: imovelParamsSchema,
        body: atualizarImovelBodySchema,
        response: {
          200: imovelDetalhesResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = request.body;

      const imovelExistente = await prisma.imovel.findUnique({
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
          const val360 = validarUrlPanoramica360(data.fotoPanoramica360Url);
          if (!val360.valido) {
            return reply.status(400).send({
              error: true,
              message: `Imagem 360 inválida: ${val360.motivo}`,
              statusCode: 400,
            });
          }
          temTour = true;
        } else {
          temTour = false;
        }
      }

      const updateData: any = { ...data };
      if (data.fotosComuns !== undefined) {
        updateData.fotosComuns = JSON.stringify(data.fotosComuns);
      }
      if (data.fotoPanoramica360Url !== undefined) {
        updateData.temTourVirtual = temTour;
      }

      const imovelAtualizado = await prisma.imovel.update({
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
    }
  );

  /**
   * G. DELETE /api/imoveis/:id
   * Remoção de imóvel (Área Restrita).
   */
  router.delete(
    '/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Gestão de Imóveis (Corretores)'],
        summary: 'Remover imóvel',
        description: 'Exclui o imóvel do catálogo da imobiliária.',
        security: [{ bearerAuth: [] }],
        params: imovelParamsSchema,
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const imovelExistente = await prisma.imovel.findUnique({
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

      await prisma.imovel.delete({
        where: { id },
      });

      return reply.send({
        success: true,
        message: 'Imóvel removido com sucesso.',
      });
    }
  );
}
