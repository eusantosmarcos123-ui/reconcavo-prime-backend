# 🏛️ Imobiliária Recôncavo Prime - Backend & API de Alta Performance
> **Localização do Empreendimento:** Santo Antônio de Jesus - Bahia  
> **Arquitetura:** Microsserviço Fastify + TypeScript + Prisma ORM + Zod + WebXR / 360 Panorâmico + Google Stitch Ready

---

## 📌 Visão Geral da Arquitetura
Este backend foi construído sob padrões de engenharia de software de alta performance, projetado com foco em:
1. **Performance Mobile Extrema:** Respostas JSON ultra-rápidas serializadas nativamente para conexões 3G/4G e aparelhos de entrada.
2. **Endpoint Ultra-Leve de Mapa:** Plotagem de centenas de marcadores no **Leaflet** com payload mínimo (`/api/imoveis/mapa`).
3. **Tour Virtual Imersivo (WebXR / 360):** Suporte e validação de imagens panorâmicas equirretangulares (proporção 2:1, 360° x 180°) prontas para visualizadores A-Frame / WebXR em smartphones.
4. **Conversão de Lead Direto no WhatsApp:** Geração dinâmica do link para o corretor responsável com mensagem padronizada.
5. **Integração Total com o Google Stitch:** OpenAPI 3.0 exportável (`/api/openapi.json`), CORS aberto e manifesto declarativo de componentes (`stitch-manifest.json`).

---

## 📂 Estrutura de Pastas do Projeto

```
reconcavo-prime-backend/
├── prisma/
│   ├── schema.prisma              # Modelagem de dados (Corretores e Imóveis)
│   ├── seed.ts                    # Carga inicial com 6 imóveis de SAJ e corretores
│   └── dev.db                     # Banco SQLite local otimizado
├── src/
│   ├── config/
│   │   └── env.ts                 # Variáveis de ambiente validadas
│   ├── lib/
│   │   ├── prisma.ts              # Instância singleton do PrismaClient
│   │   ├── whatsapp.ts            # Gerador de links parametrizados de WhatsApp
│   │   └── equirectangular.ts     # Validador de imagens 360 para WebXR
│   ├── middlewares/
│   │   ├── auth.ts                # Middleware JWT para rotas restritas
│   │   └── errorHandler.ts        # Handler padronizado { error: true, message: ... }
│   ├── routes/
│   │   ├── auth.routes.ts         # Login e perfil do corretor
│   │   └── imoveis.routes.ts      # Mapa ultra-leve, busca, tour 360, lead e CRUD
│   ├── schemas/
│   │   ├── auth.schema.ts         # Schemas Zod de autenticação
│   │   └── imovel.schema.ts       # Schemas Zod de imóveis e mapa
│   ├── types/
│   │   └── stitch-contracts.ts    # Contratos TypeScript para templates do Stitch
│   ├── app.ts                     # Setup do Fastify, CORS, Swagger e Plugins
│   └── server.ts                  # Bootstrapping do servidor HTTP
├── scripts/
│   ├── stitch-bridge.ts           # Ponte de integração e exportação para o Google Stitch
│   └── test-endpoints.ts          # Bateria completa com 33 testes automatizados
├── uploads/                       # Armazenamento local de fotos e imagens 360
├── openapi.json                   # Especificação OpenAPI 3.0 gerada para o Stitch
├── stitch-manifest.json           # Mapeamento componente-para-endpoint
├── package.json
└── tsconfig.json
```

---

## 🚀 Como Executar o Backend

### 1. Instalar Dependências
```bash
npm install
```

### 2. Sincronizar o Banco e Executar o Seed (Santo Antônio de Jesus)
```bash
npm run db:push
npm run db:seed
```

### 3. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
O servidor iniciará em `http://localhost:3333`.

### 4. Rodar Testes Automatizados (33 Asserções de Regra de Negócio)
```bash
npm test
```

### 5. Exportar Contratos para o Google Stitch
```bash
npm run stitch:integrate
```

---

## 📑 Tabela de Endpoints da API

| Método | Endpoint | Protegido | Descrição |
|---|---|:---:|---|
| `GET` | `/api/health` | Não | Healthcheck do serviço |
| `POST` | `/api/auth/login` | Não | Autentica o corretor e devolve Token JWT |
| `GET` | `/api/auth/me` | **Sim (JWT)** | Dados do perfil do corretor logado |
| `GET` | `/api/imoveis/mapa` | Não | **Ultra-Leve:** Pins para o Leaflet (`id, titulo, preco, lat, lng, fotoThumbnail`) |
| `GET` | `/api/imoveis` | Não | Listagem paginada com filtros (`bairro, minPreco, maxPreco, quartos, apenasComTour360`) |
| `GET` | `/api/imoveis/:id` | Não | Detalhes completos, URL da foto 360 e link dinâmico de WhatsApp |
| `GET` | `/api/imoveis/:id/whatsapp-lead` | Não | Link direto ou redirect 302 para WhatsApp do corretor com mensagem pré-formatada |
| `POST` | `/api/imoveis` | **Sim (JWT)** | Cadastro de imóvel com validação de imagem panorâmica 360 |
| `PUT` | `/api/imoveis/:id` | **Sim (JWT)** | Atualização cadastral de imóvel |
| `DELETE` | `/api/imoveis/:id` | **Sim (JWT)** | Remoção de imóvel |
| `GET` | `/api/openapi.json` | Não | Especificação OpenAPI 3.0 pura para o Google Stitch SDK / MCP |
| `GET` | `/docs` | Não | Documentação interativa Swagger UI |

---

## 🔑 Credenciais de Teste dos Corretores de SAJ
- **Corretor 1:** `carlos.barreto@reconcavoprime.com.br` | Senha: `Prime@2026` | Telefone: `(75) 99123-4567` (CRECI BA-24890)
- **Corretora 2:** `mariana.sampaio@reconcavoprime.com.br` | Senha: `Prime@2026` | Telefone: `(75) 98877-6655` (CRECI BA-28412)

---

## 🥽 Formato de Imagem 360 para WebXR / A-Frame
As imagens panorâmicas devem ser fornecidas no formato **Equirretangular (2:1)**, por exemplo **4096x2048** ou **2048x1024** pixels em JPG ou PNG.
No frontend (que será gerado no Stitch), o componente A-Frame consome diretamente:
```html
<a-scene embedded>
  <a-sky src="URL_RETORNADA_PELO_BACKEND" rotation="0 -130 0"></a-sky>
</a-scene>
```
