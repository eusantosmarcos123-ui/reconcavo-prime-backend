import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o Seed do Banco de Dados - Imobiliária Recôncavo Prime (Santo Antônio de Jesus - BA)...');

  // Limpeza prévia para garantir idempotência
  await prisma.imovel.deleteMany();
  await prisma.corretor.deleteMany();

  // Hash de senhas para corretores de teste
  const passwordHash = await bcrypt.hash('Prime@2026', 10);

  // 1. Corretores de Elite de Santo Antônio de Jesus
  const corretor1 = await prisma.corretor.create({
    data: {
      nome: 'Carlos Eduardo Barreto',
      email: 'carlos.barreto@reconcavoprime.com.br',
      senhaHash: passwordHash,
      telefoneWhatsApp: '5575991234567',
      creci: 'BA-24890',
      ativo: true,
    },
  });

  const corretor2 = await prisma.corretor.create({
    data: {
      nome: 'Mariana Sampaio Guimarães',
      email: 'mariana.sampaio@reconcavoprime.com.br',
      senhaHash: passwordHash,
      telefoneWhatsApp: '5575988776655',
      creci: 'BA-28412',
      ativo: true,
    },
  });

  console.log(`Corretores cadastrados: ${corretor1.nome} e ${corretor2.nome}`);

  // 2. Imóveis de Alto Padrão em Santo Antônio de Jesus - BA
  const imoveis = [
    {
      titulo: 'Mansão Suspensa Reserva das Flores',
      descricao: 'Exclusiva residência de alto padrão com arquitetura biofílica, pé-direito duplo de 6 metros, piscina de borda infinita aquecida, espaço gourmet climatizado e vista panorâmica para o vale verde do Recôncavo.',
      preco: 2850000.0,
      areaMetragem: 480.0,
      quartos: 5,
      banheiros: 6,
      vagasGaragem: 4,
      cidade: 'Santo Antônio de Jesus',
      bairro: 'Maria Preta',
      latitude: -12.9685,
      longitude: -39.2612,
      fotosComuns: JSON.stringify([
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      ]),
      fotoPanoramica360Url: 'https://cdn.jsdelivr.net/gh/aframevr/aframe@v1.4.0/examples/boilerplate/panorama/puydesancy.jpg',
      temTourVirtual: true,
      destaqueAltoPadrao: true,
      corretorId: corretor1.id,
    },
    {
      titulo: 'Villa Imperial Condomínio Alphaville Recôncavo',
      descricao: 'Mansão contemporânea com automação residencial completa por voz, suíte master com hidro e closet duplo, energia solar fotovoltaica e acabamentos em mármore importado.',
      preco: 3400000.0,
      areaMetragem: 520.0,
      quartos: 4,
      banheiros: 5,
      vagasGaragem: 4,
      cidade: 'Santo Antônio de Jesus',
      bairro: 'São Benedito',
      latitude: -12.9815,
      longitude: -39.2730,
      fotosComuns: JSON.stringify([
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      ]),
      fotoPanoramica360Url: 'https://pannellum.org/images/cerro-toco-0.jpg',
      temTourVirtual: true,
      destaqueAltoPadrao: true,
      corretorId: corretor1.id,
    },
    {
      titulo: 'Casa Alto Padrão Residencial Bela Vista',
      descricao: 'Imóvel moderno com fino acabamento em porcelanato acetinado, conceito aberto integrando sala e cozinha gourmet, quintal privativo gramado e preparação para carregador de carro elétrico.',
      preco: 1450000.0,
      areaMetragem: 260.0,
      quartos: 3,
      banheiros: 4,
      vagasGaragem: 3,
      cidade: 'Santo Antônio de Jesus',
      bairro: 'Andaiá',
      latitude: -12.9734,
      longitude: -39.2558,
      fotosComuns: JSON.stringify([
        'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1200&q=80',
      ]),
      fotoPanoramica360Url: 'https://pannellum.org/images/alma.jpg',
      temTourVirtual: true,
      destaqueAltoPadrao: false,
      corretorId: corretor2.id,
    },
    {
      titulo: 'Cobertura Duplex Prime Palace',
      descricao: 'Vista inigualável do skyline de Santo Antônio de Jesus. Cobertura duplex com terraço privativo, jacuzzi ao ar livre, sauna seca, adega climatizada para 200 garrafas e elevador com biometria privativa.',
      preco: 2190000.0,
      areaMetragem: 340.0,
      quartos: 4,
      banheiros: 5,
      vagasGaragem: 3,
      cidade: 'Santo Antônio de Jesus',
      bairro: 'Centro',
      latitude: -12.9712,
      longitude: -39.2605,
      fotosComuns: JSON.stringify([
        'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      ]),
      fotoPanoramica360Url: 'https://threejs.org/examples/textures/2294472375_24a3b8ef46_o.jpg',
      temTourVirtual: true,
      destaqueAltoPadrao: true,
      corretorId: corretor2.id,
    },
    {
      titulo: 'Chácara Haras dos Ipês de Alto Luxo',
      descricao: 'Propriedade rural de alto padrão a apenas 8 minutos do centro de SAJ. Casa sede com varanda perimetral colonial, campo de futebol society, pomar produtivo, estábulo para cavalos de raça e lago privativo.',
      preco: 3950000.0,
      areaMetragem: 12500.0,
      quartos: 6,
      banheiros: 7,
      vagasGaragem: 8,
      cidade: 'Santo Antônio de Jesus',
      bairro: 'Amparo',
      latitude: -12.9550,
      longitude: -39.2480,
      fotosComuns: JSON.stringify([
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80',
      ]),
      fotoPanoramica360Url: 'https://cdn.jsdelivr.net/gh/aframevr/aframe@v1.4.0/examples/boilerplate/panorama/puydesancy.jpg',
      temTourVirtual: true,
      destaqueAltoPadrao: true,
      corretorId: corretor1.id,
    },
    {
      titulo: 'Residencial Jardim das Mangueiras',
      descricao: 'Casa térrea com design minimalista, 3 suítes, jardim de inverno, lareira ecológica e área gourmet integrada com piscina aquecida de hidromassagem.',
      preco: 1250000.0,
      areaMetragem: 220.0,
      quartos: 3,
      banheiros: 4,
      vagasGaragem: 2,
      cidade: 'Santo Antônio de Jesus',
      bairro: 'Urbis I',
      latitude: -12.9770,
      longitude: -39.2670,
      fotosComuns: JSON.stringify([
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
      ]),
      fotoPanoramica360Url: 'https://pannellum.org/images/alma.jpg',
      temTourVirtual: true,
      destaqueAltoPadrao: false,
      corretorId: corretor2.id,
    },
  ];

  for (const item of imoveis) {
    const created = await prisma.imovel.create({ data: item });
    console.log(`Imóvel criado: "${created.titulo}" - Bairro: ${created.bairro} (R$ ${created.preco.toLocaleString('pt-BR')})`);
  }

  console.log('Seed de Santo Antônio de Jesus concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
