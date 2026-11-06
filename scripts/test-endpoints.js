"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("../src/app");
async function runTests() {
    console.log('🧪 ========================================================');
    console.log('🧪 INICIANDO BATERIA DE TESTES AUTOMATIZADOS DE ENDPOINTS');
    console.log('🏛️  Imobiliária Recôncavo Prime - Santo Antônio de Jesus (BA)');
    console.log('🧪 ========================================================\n');
    const app = (0, app_1.buildApp)();
    await app.ready();
    let passed = 0;
    let failed = 0;
    function assert(condition, testName, extra) {
        if (condition) {
            console.log(`✅ [PASS] ${testName}`);
            passed++;
        }
        else {
            console.error(`❌ [FAIL] ${testName}`, extra ? JSON.stringify(extra, null, 2) : '');
            failed++;
        }
    }
    // 1. Health Check
    const healthRes = await app.inject({ method: 'GET', url: '/api/health' });
    assert(healthRes.statusCode === 200, 'GET /api/health deve retornar status 200');
    const healthBody = healthRes.json();
    assert(healthBody.status === 'UP', 'GET /api/health deve retornar status UP');
    // 2. Login inválido
    const invalidLoginRes = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
            email: 'carlos.barreto@reconcavoprime.com.br',
            senha: 'senha-errada-qualquer',
        },
    });
    assert(invalidLoginRes.statusCode === 401, 'POST /api/auth/login com senha errada deve retornar 401');
    const invalidLoginBody = invalidLoginRes.json();
    assert(invalidLoginBody.error === true, 'Resposta de erro deve conter { error: true }');
    // 3. Login válido de corretor
    const validLoginRes = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
            email: 'carlos.barreto@reconcavoprime.com.br',
            senha: 'Prime@2026',
        },
    });
    assert(validLoginRes.statusCode === 200, 'POST /api/auth/login com credenciais válidas deve retornar 200');
    const loginData = validLoginRes.json();
    assert(Boolean(loginData.token), 'Login deve retornar token JWT');
    assert(loginData.corretor.nome === 'Carlos Eduardo Barreto', 'Login deve retornar dados do corretor Carlos');
    const token = loginData.token;
    // 4. Perfil do corretor autenticado (GET /api/auth/me)
    const meRes = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
            authorization: `Bearer ${token}`,
        },
    });
    assert(meRes.statusCode === 200, 'GET /api/auth/me deve retornar 200 com token válido');
    const meBody = meRes.json();
    assert(meBody.email === 'carlos.barreto@reconcavoprime.com.br', 'GET /api/auth/me deve identificar o corretor logado');
    // 5. Endpoint Ultra-Leve de Mapa (GET /api/imoveis/mapa)
    const mapaRes = await app.inject({ method: 'GET', url: '/api/imoveis/mapa' });
    assert(mapaRes.statusCode === 200, 'GET /api/imoveis/mapa deve retornar status 200');
    const mapaPins = mapaRes.json();
    assert(Array.isArray(mapaPins) && mapaPins.length >= 5, 'GET /api/imoveis/mapa deve retornar array com os pins do seed');
    const primeiroPin = mapaPins[0];
    assert(primeiroPin.id &&
        primeiroPin.titulo &&
        typeof primeiroPin.preco === 'number' &&
        typeof primeiroPin.latitude === 'number' &&
        typeof primeiroPin.longitude === 'number' &&
        ('fotoThumbnail' in primeiroPin), 'Pin ultra-leve deve conter apenas id, titulo, preco, latitude, longitude e fotoThumbnail', primeiroPin);
    // 6. Listagem de Imóveis com filtros (GET /api/imoveis)
    const listRes = await app.inject({
        method: 'GET',
        url: '/api/imoveis?bairro=Maria Preta&apenasComTour360=true',
    });
    assert(listRes.statusCode === 200, 'GET /api/imoveis com filtros deve retornar 200');
    const listBody = listRes.json();
    assert(Array.isArray(listBody.data), 'Resposta deve conter campo data[]');
    assert(listBody.pagination && listBody.pagination.total >= 1, 'Paginação deve reportar total de itens correspondentes');
    const imovelMariaPreta = listBody.data[0];
    assert(imovelMariaPreta.bairro === 'Maria Preta', 'Filtro por bairro deve filtrar corretamente');
    assert(Boolean(imovelMariaPreta.linkWhatsAppCorretor), 'Imóvel deve incluir linkWhatsAppCorretor dinâmico');
    // 7. Detalhes completos do imóvel (GET /api/imoveis/:id)
    const idParaTeste = primeiroPin.id;
    const detalheRes = await app.inject({
        method: 'GET',
        url: `/api/imoveis/${idParaTeste}`,
    });
    assert(detalheRes.statusCode === 200, `GET /api/imoveis/:id deve retornar 200 para id ${idParaTeste}`);
    const detalheBody = detalheRes.json();
    assert(Array.isArray(detalheBody.fotosComuns), 'fotosComuns deve ser array desserializado de strings');
    assert(Boolean(detalheBody.corretor.telefoneWhatsApp), 'Deve incluir telefone do corretor responsável');
    // 8. Lead direto no WhatsApp (GET /api/imoveis/:id/whatsapp-lead)
    const leadRes = await app.inject({
        method: 'GET',
        url: `/api/imoveis/${idParaTeste}/whatsapp-lead`,
    });
    assert(leadRes.statusCode === 200, 'GET /api/imoveis/:id/whatsapp-lead deve retornar 200');
    const leadBody = leadRes.json();
    assert(leadBody.whatsappUrl.startsWith('https://wa.me/'), 'URL do lead deve começar com https://wa.me/');
    assert(leadBody.whatsappUrl.includes('Ol%C3%A1') || leadBody.whatsappUrl.includes('Olá'), 'URL deve conter mensagem codificada');
    assert(leadBody.mensagem.includes('Recôncavo Prime'), 'Mensagem de lead deve citar a Recôncavo Prime');
    // 9. Cadastro de Imóvel autenticado (POST /api/imoveis)
    const createRes = await app.inject({
        method: 'POST',
        url: '/api/imoveis',
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            titulo: 'Casa Térrea de Luxo Alphaville III',
            descricao: 'Excelente oportunidade de investimento em Santo Antônio de Jesus, acabamento premium.',
            preco: 1850000.0,
            areaMetragem: 310.0,
            quartos: 4,
            banheiros: 5,
            vagasGaragem: 3,
            cidade: 'Santo Antônio de Jesus',
            bairro: 'São Benedito',
            latitude: -12.9805,
            longitude: -39.2715,
            fotosComuns: [
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
            ],
            fotoPanoramica360Url: 'https://cdn.jsdelivr.net/gh/aframevr/aframe@v1.4.0/examples/boilerplate/panorama/puydesancy.jpg',
            temTourVirtual: true,
            destaqueAltoPadrao: true,
        },
    });
    assert(createRes.statusCode === 201, 'POST /api/imoveis autenticado deve retornar 201 Created');
    const createdBody = createRes.json();
    const novoId = createdBody.id;
    assert(Boolean(novoId), 'Novo imóvel deve ter UUID gerado');
    assert(createdBody.temTourVirtual === true, 'Novo imóvel com foto 360 deve ter temTourVirtual = true');
    // 10. Atualização de Imóvel (PUT /api/imoveis/:id)
    const updateRes = await app.inject({
        method: 'PUT',
        url: `/api/imoveis/${novoId}`,
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            preco: 1950000.0,
        },
    });
    assert(updateRes.statusCode === 200, 'PUT /api/imoveis/:id deve retornar 200');
    const updatedBody = updateRes.json();
    assert(updatedBody.preco === 1950000.0, 'Preço atualizado deve ser refletido');
    // 11. Remoção de Imóvel (DELETE /api/imoveis/:id)
    const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/api/imoveis/${novoId}`,
        headers: {
            authorization: `Bearer ${token}`,
        },
    });
    assert(deleteRes.statusCode === 200, 'DELETE /api/imoveis/:id deve retornar 200');
    // 12. Export OpenAPI JSON puro (/api/openapi.json)
    const openApiRes = await app.inject({
        method: 'GET',
        url: '/api/openapi.json',
    });
    assert(openApiRes.statusCode === 200, 'GET /api/openapi.json deve retornar 200');
    const openApiSpec = openApiRes.json();
    assert(openApiSpec.openapi === '3.0.3', 'Especificação deve ser OpenAPI 3.0.3');
    assert(Boolean(openApiSpec.paths['/api/imoveis/mapa']), 'Deve expor endpoint de mapa');
    console.log('\n========================================================');
    console.log(`📊 RESULTADO DOS TESTES: ${passed} passaram | ${failed} falharam`);
    console.log('========================================================\n');
    if (failed > 0) {
        process.exit(1);
    }
    else {
        process.exit(0);
    }
}
runTests().catch((e) => {
    console.error('Erro executando testes:', e);
    process.exit(1);
});
