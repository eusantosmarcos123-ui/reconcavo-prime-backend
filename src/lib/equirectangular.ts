/**
 * Helper de Validação de Imagens Panorâmicas Equirretangulares (WebXR / A-Frame 360)
 * 
 * Uma projeção equirretangular mapeia uma esfera completa de 360° x 180°
 * em uma malha retangular que estritamente segue a proporção 2:1 (largura = 2 * altura).
 */

export interface EquirectangularValidationResult {
  valido: boolean;
  motivo?: string;
  isEquirectangularFormat: boolean;
  proporcaoRecomendada: string;
}

export function validarUrlPanoramica360(url?: string | null): EquirectangularValidationResult {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return {
      valido: false,
      motivo: 'A URL da imagem 360 não foi informada.',
      isEquirectangularFormat: false,
      proporcaoRecomendada: '2:1 (ex: 4096x2048 ou 2048x1024)',
    };
  }

  const cleanUrl = url.trim();

  // Verifica se é uma URL válida ou caminho local
  const isHttp = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://');
  const isLocalUpload = cleanUrl.startsWith('/uploads/') || cleanUrl.startsWith('./uploads/');

  if (!isHttp && !isLocalUpload) {
    return {
      valido: false,
      motivo: 'A URL deve iniciar com http://, https:// ou /uploads/',
      isEquirectangularFormat: false,
      proporcaoRecomendada: '2:1 (ex: 4096x2048)',
    };
  }

  // Verifica extensões de imagem suportadas por A-Frame e WebXR no navegador mobile
  const extensaoValida = /\.(jpe?g|png|webp)(\?.*)?$/i.test(cleanUrl);
  if (!extensaoValida) {
    return {
      valido: false,
      motivo: 'Formato de arquivo incompatível. Use arquivos JPEG, PNG ou WebP.',
      isEquirectangularFormat: false,
      proporcaoRecomendada: '2:1 (ex: 4096x2048)',
    };
  }

  return {
    valido: true,
    isEquirectangularFormat: true,
    proporcaoRecomendada: '2:1 (360x180 graus)',
  };
}
