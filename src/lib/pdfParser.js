import * as pdfjsLib from 'pdfjs-dist';
import { aplicarReglasNormativas } from './normativeRules';

// Configurar Worker de PDF.js de forma resiliente
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
  } catch (err) {
    console.warn('PDF.js worker fallback notice:', err);
  }
}

/**
 * Parsea el texto extraído de las páginas del PDF de Planilla Anexa I
 * Reconoce columnas: orden, nombre, bp, cat, mod, zona, jornada, localidad, origen
 * y detecta cabeceras de región educativa (ej: "REGION IV A", "REGION X B", etc.)
 */
export async function parsearPdfPlanilla(fileOrBuffer) {
  let arrayBuffer;
  if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer;
  } else if (fileOrBuffer instanceof Blob || fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    throw new Error('Tipo de archivo no soportado para parsear PDF');
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  let currentRegion = 'REGION I - General';
  const rawRows = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Agrupar items por línea basándonos en la coordenada Y
    const lineMap = new Map();
    for (const item of textContent.items) {
      if (!item.str || item.str.trim() === '') continue;
      // Redondear Y a múltiplo cercano (ej 4 puntos) para agrupar palabras de la misma línea
      const y = Math.round(item.transform[5] / 4) * 4;
      if (!lineMap.has(y)) {
        lineMap.set(y, []);
      }
      lineMap.get(y).push({
        text: item.str.trim(),
        x: item.transform[4]
      });
    }

    // Ordenar líneas de arriba hacia abajo (coordenada Y decreciente)
    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);

    for (const y of sortedY) {
      const items = lineMap.get(y);
      // Ordenar items de la línea de izquierda a derecha (coordenada X creciente)
      items.sort((a, b) => a.x - b.x);
      const lineText = items.map(i => i.text).join(' ');

      // 1. Detectar cabecera de Región
      const regionMatch = lineText.match(/(?:REGI[OÓ]N\s+(?:[IVXLCDM]+(?:\s+[A-Z])?|\d+)(?:\s*[-–—]\s*[^\n\r]+)?)/i);
      if (regionMatch) {
        currentRegion = regionMatch[0].trim().toUpperCase();
        continue;
      }

      // 2. Descartar cabeceras repetitivas de tabla
      if (
        /ORDEN|ESTABLECIMIENTO|BIBLIOTECA|B\.?P\.?|CAT|MOD|ZONA|JORNADA|LOCALIDAD|ORIGEN|PLANILLA ANEXA/i.test(lineText) &&
        !/^\d+/.test(lineText)
      ) {
        continue;
      }

      // 3. Detectar si la línea comienza con un número de orden (ej: "1", "99", "140", etc.)
      const ordenMatch = lineText.match(/^(\d{1,4})\s+(.+)$/);
      if (ordenMatch) {
        const ordenNum = parseInt(ordenMatch[1], 10);
        const rest = ordenMatch[2];

        // Extraer B.P. si existe (ej "B.P. 55", "BP 189", "N° 189")
        let bp = '';
        const bpMatch = rest.match(/B\.?P\.?\s*(?:N[°º])?\s*(\d{1,4})/i) || rest.match(/N[°º]\s*(\d{1,4})/i);
        if (bpMatch) {
          bp = bpMatch[1];
        }

        // Extraer Categoría (1ª, 2ª, 3ª, 1ra, etc.)
        let cat = '1ª';
        const catMatch = rest.match(/\b([123][ªra°])\b/i);
        if (catMatch) {
          cat = catMatch[1];
        }

        // Extraer Modalidad (Pública, Escolar, Especial, etc.)
        let mod = 'Pública';
        const modMatch = rest.match(/\b(P[uú]blica|Escolar|Especial|Comunitaria)\b/i);
        if (modMatch) {
          mod = modMatch[1];
        }

        // Extraer Zona (ZU1, ZU 2, ZU4, ZR1, etc.)
        let zona = 'ZU 1';
        const zonaMatch = rest.match(/\b(Z[UR]\s*\d+)\b/i);
        if (zonaMatch) {
          zona = zonaMatch[1].toUpperCase();
        }

        // Extraer Jornada (Simple, Completa, Extendida)
        let jornada = 'Simple';
        const jornadaMatch = rest.match(/\b(Simple|Completa|Extendida)\b/i);
        if (jornadaMatch) {
          jornada = jornadaMatch[1];
        }

        // Intentar separar nombre de establecimiento y localidad
        let nombre = rest;
        let localidad = 'Resistencia';
        let origen = '';

        // Si hay guiones o separadores comunes en planillas ministeriales
        const parts = rest.split(/\s+[-–—]\s+|\s{2,}/);
        if (parts.length >= 3) {
          nombre = parts[0].trim();
          localidad = parts[1].trim();
          origen = parts.slice(2).join(' - ').trim();
        } else if (parts.length === 2) {
          nombre = parts[0].trim();
          localidad = parts[1].trim();
        }

        rawRows.push({
          id: `cargo-pdf-${ordenNum}`,
          orden: ordenNum,
          region: currentRegion,
          nombre: nombre,
          bp: bp || (bpMatch ? bpMatch[1] : ''),
          cat: cat,
          mod: mod,
          zona: zona,
          jornada: jornada,
          localidad: localidad,
          origen: origen || 'CONCURSO GENERAL - MECCYT',
          estado: 'disponible',
          titular_nombre: '',
          titular_dni: '',
          reserva_nombre: '',
          reserva_dni: '',
          etiqueta_normativa: '',
          observaciones: ''
        });
      }
    }
  }

  // Aplicar motor de reglas normativas automáticas
  const resultado = aplicarReglasNormativas(rawRows);

  return {
    rawRows,
    cargos: resultado.cargos,
    reporte: resultado.reporte,
    numPages
  };
}
