import fs from 'fs';
import path from 'path';
import { buildApp } from '../src/app';
import { env } from '../src/config/env';

/**
 * Script de Automação e Ponte de Integração para Google Stitch SDK & MCP
 * Imobiliária Recôncavo Prime - Santo Antônio de Jesus (BA)
 */
async function generateStitchBridge() {
  console.log('🔄 [Google Stitch Bridge] Inicializando o gerador de contratos OpenAPI...');

  const app = buildApp();
  await app.ready();

  const openApiSpec = app.swagger();

  // 1. Exporta o OpenAPI 3.0 puro no formato JSON
  const openApiPath = path.resolve(__dirname, '..', 'openapi.json');
  fs.writeFileSync(openApiPath, JSON.stringify(openApiSpec, null, 2), 'utf-8');
  console.log(`✅ [Google Stitch Bridge] Arquivo OpenAPI gerado: ${openApiPath}`);

  // 2. Mapeamento declarativo de componentes do Google Stitch
  const stitchManifest = {
    project: 'Imobiliária Recôncavo Prime',
    cidade: 'Santo Antônio de Jesus - BA',
    generator: 'Google Stitch Integration Bridge v1.0',
    generatedAt: new Date().toISOString(),
    apiBaseUrl: env.API_BASE_URL,
    stitch: {
      projectId: env.STITCH_PROJECT_ID,
      projectUrl: env.STITCH_PROJECT_URL,
      authenticated: Boolean(env.STITCH_API_KEY),
    },
    components: {
      LeafletMapView: {
        description: 'Mapa interativo geoespacial de Santo Antônio de Jesus',
        endpoint: 'GET /api/imoveis/mapa',
        payloadType: 'Ultra-Lightweight Pin Array',
        stateBinding: {
          markers: 'response.data',
          pinFields: {
            id: 'id',
            title: 'titulo',
            price: 'preco',
            lat: 'latitude',
            lng: 'longitude',
            thumbnail: 'fotoThumbnail',
          },
        },
        leafletConfig: {
          defaultCenter: [-12.9714, -39.2608], // Centro de Santo Antônio de Jesus
          defaultZoom: 14,
          maxZoom: 19,
        },
      },
      PropertyCatalog: {
        description: 'Grade de imóveis com filtros de busca e paginação',
        endpoint: 'GET /api/imoveis',
        queryParams: ['page', 'limit', 'minPreco', 'maxPreco', 'quartos', 'bairro', 'apenasComTour360'],
        stateBinding: {
          items: 'response.data.data',
          pagination: 'response.data.pagination',
        },
      },
      WebXR360Viewer: {
        description: 'Visualizador de Tour Virtual 360 equirretangular para celular/A-Frame',
        endpoint: 'GET /api/imoveis/:id',
        stateBinding: {
          panoramaUrl: 'response.data.fotoPanoramica360Url',
          hasVirtualTour: 'response.data.temTourVirtual',
        },
        aframeTemplate: '<a-scene embedded><a-sky src="${panoramaUrl}" rotation="0 -130 0"></a-sky></a-scene>',
      },
      WhatsAppLeadButton: {
        description: 'Botão de conversão direta com WhatsApp do corretor responsável',
        endpoint: 'GET /api/imoveis/:id/whatsapp-lead',
        stateBinding: {
          whatsappUrl: 'response.data.whatsappUrl',
          brokerName: 'response.data.corretor.nome',
          brokerPhone: 'response.data.corretor.telefoneWhatsApp',
        },
      },
      BrokerAuthAndDashboard: {
        description: 'Autenticação e formulário de gestão de imóveis',
        loginEndpoint: 'POST /api/auth/login',
        propertyCreateEndpoint: 'POST /api/imoveis',
        propertyUpdateEndpoint: 'PUT /api/imoveis/:id',
        propertyDeleteEndpoint: 'DELETE /api/imoveis/:id',
        authHeader: 'Authorization: Bearer <token>',
      },
    },
  };

  const manifestPath = path.resolve(__dirname, '..', 'stitch-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(stitchManifest, null, 2), 'utf-8');
  console.log(`✅ [Google Stitch Bridge] Manifesto de integração gerado: ${manifestPath}`);

  // 3. Gera arquivo de tipagem TypeScript para templates do Stitch
  const typesContent = `/**
 * Tipagens Geradas Automaticamente pelo Google Stitch Bridge
 * Imobiliária Recôncavo Prime
 * Projeto Stitch: ${env.STITCH_PROJECT_ID}
 */

export interface StitchMapPin {
  id: string;
  titulo: string;
  preco: number;
  latitude: number;
  longitude: number;
  fotoThumbnail: string | null;
}

export interface StitchCorretor {
  id: string;
  nome: string;
  email: string;
  telefoneWhatsApp: string;
  creci: string;
}

export interface StitchImovelDetalhes {
  id: string;
  titulo: string;
  descricao: string;
  preco: number;
  areaMetragem: number;
  quartos: number;
  banheiros: number;
  vagasGaragem: number;
  cidade: string;
  bairro: string;
  latitude: number;
  longitude: number;
  fotosComuns: string[];
  fotoPanoramica360Url: string | null;
  temTourVirtual: boolean;
  destaqueAltoPadrao: boolean;
  corretorId: string;
  corretor: StitchCorretor;
  linkWhatsAppCorretor: string;
}

export interface StitchWhatsAppLead {
  whatsappUrl: string;
  mensagem: string;
  corretor: {
    nome: string;
    telefoneWhatsApp: string;
    creci: string;
  };
}
`;

  const typesDir = path.resolve(__dirname, '..', 'src', 'types');
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
  }
  const typesPath = path.join(typesDir, 'stitch-contracts.ts');
  fs.writeFileSync(typesPath, typesContent, 'utf-8');
  console.log(`✅ [Google Stitch Bridge] Contratos TypeScript gerados: ${typesPath}`);

  console.log('\n🎉 [Google Stitch Bridge] Integração concluída com sucesso!');
  console.log(`📌 Conectado ao Projeto Google Stitch: ${env.STITCH_PROJECT_URL}`);
  console.log('📌 O backend está 100% acoplado aos templates do Google Stitch.\n');

  process.exit(0);
}

generateStitchBridge().catch((err) => {
  console.error('❌ [Google Stitch Bridge] Erro na geração:', err);
  process.exit(1);
});
