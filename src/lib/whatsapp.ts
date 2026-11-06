/**
 * Utilitário de Geração de Links de Lead para WhatsApp
 * Imobiliária Recôncavo Prime - Santo Antônio de Jesus (BA)
 */

export interface WhatsAppLeadOptions {
  telefone: string;
  nomeCorretor: string;
  tituloImovel: string;
}

export interface WhatsAppLeadResult {
  telefoneFormatado: string;
  mensagem: string;
  whatsappUrl: string;
}

export function gerarLinkWhatsAppLead({
  telefone,
  nomeCorretor,
  tituloImovel,
}: WhatsAppLeadOptions): WhatsAppLeadResult {
  // Limpa caracteres especiais mantendo apenas números
  let cleanPhone = telefone.replace(/\D/g, '');

  // Se o telefone começar sem código de país (55), adiciona o DDI Brasil
  if (!cleanPhone.startsWith('55')) {
    // Se tiver 10 ou 11 dígitos (ex: 75999999999), adiciona 55
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
      cleanPhone = `55${cleanPhone}`;
    }
  }

  // Mensagem padronizada de lead de alto padrão
  const mensagem = `Olá ${nomeCorretor}, vi o imóvel ${tituloImovel} na Recôncavo Prime e gostaria de informações.`;
  const mensagemEncoded = encodeURIComponent(mensagem);

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${mensagemEncoded}`;

  return {
    telefoneFormatado: cleanPhone,
    mensagem,
    whatsappUrl,
  };
}
