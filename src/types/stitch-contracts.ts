/**
 * Tipagens Geradas Automaticamente pelo Google Stitch Bridge
 * Imobiliária Recôncavo Prime
 * Projeto Stitch: 11909117132411956430
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
