/**
 * Motor de Reglas Normativas para el Concurso Docente / Bibliotecario
 * Ley 647-E Art. 266 - Provincia del Chaco
 * 
 * Aplica automáticamente:
 * 1. Exclusión / Desafectación (RES-2026-4798)
 * 2. Inclusión de nuevas vacantes (RES-2026-4409)
 * 3. Rectificación de regiones (RES-2026-4409)
 */

export const REGLAS_NORMATIVAS = {
  EXCLUSIONES_RES_4798: [
    { orden: 140, bp: "453", motivo: "Desafectada por RES-2026-4798" },
    { orden: 144, bp: "499", motivo: "Desafectada por RES-2026-4798" }
  ],
  RECTIFICACIONES_RES_4409: [
    {
      orden: 99,
      localidad: "Campo Largo",
      regionAnterior: "REGION VIII A - Las Breñas",
      regionNueva: "REGION IV A - Pres. Roque Sáenz Peña",
      motivo: "Rectificada por RES-2026-4409"
    },
    {
      orden: 115,
      localidad: "Campo Largo",
      regionAnterior: "REGION VIII A - Las Breñas",
      regionNueva: "REGION IV A - Pres. Roque Sáenz Peña",
      motivo: "Rectificada por RES-2026-4409"
    }
  ],
  INCLUSIONES_RES_4409: [
    {
      id: "inc-res-4409-55",
      orden: 55, // Se le asigna orden o número libre en Región V
      region: "REGION V - Gral. José de San Martín",
      nombre: "Fray Rafael Gobelli",
      bp: "55",
      cat: "3ª",
      mod: "Pública",
      zona: "ZU4",
      jornada: "Simple",
      localidad: "Pampa del Indio",
      origen: "J.O.M. - SRA. ROMERO, ROSA LIDIA - RES. N° 5616/25 - MECCYT",
      estado: "disponible",
      titular_nombre: "",
      titular_dni: "",
      reserva_nombre: "",
      reserva_dni: "",
      etiqueta_normativa: "Incluida por RES-2026-4409",
      observaciones: "Incorporada por rectificación de vacantes normativa RES-2026-4409"
    },
    {
      id: "inc-res-4409-234",
      orden: 204, // Se le asigna orden o número libre en Región X B
      region: "REGION X B - Resistencia",
      nombre: "Evita",
      bp: "234",
      cat: "2ª",
      mod: "Pública",
      zona: "ZU 1",
      jornada: "Simple",
      localidad: "Resistencia",
      origen: "FALLECIMIENTO - SRA. MEDINA, LUISA - RES. N° 4076/26 - MECCYT",
      estado: "disponible",
      titular_nombre: "",
      titular_dni: "",
      reserva_nombre: "",
      reserva_dni: "",
      etiqueta_normativa: "Incluida por RES-2026-4409",
      observaciones: "Incorporada por rectificación de vacantes normativa RES-2026-4409"
    }
  ]
};

/**
 * Aplica las reglas normativas al conjunto de cargos parseados o existentes
 * @param {Array} rawCargos - Lista de cargos extraídos del PDF o cargados
 * @returns {{ cargos: Array, reporte: { exclusiones: number, inclusiones: number, rectificaciones: number, logs: Array } }}
 */
export function aplicarReglasNormativas(rawCargos) {
  const cargosMap = new Map();
  const logs = [];
  let contExclusiones = 0;
  let contRectificaciones = 0;
  let contInclusiones = 0;

  // 1. Cargar cargos base en el mapa indexado por 'orden'
  for (const cargo of rawCargos) {
    cargosMap.set(Number(cargo.orden), {
      ...cargo,
      orden: Number(cargo.orden),
      estado: cargo.estado || 'disponible',
      etiqueta_normativa: cargo.etiqueta_normativa || '',
      observaciones: cargo.observaciones || ''
    });
  }

  // 2. Aplicar Exclusiones / Desafectaciones (RES-2026-4798)
  for (const exc of REGLAS_NORMATIVAS.EXCLUSIONES_RES_4798) {
    if (cargosMap.has(exc.orden)) {
      const c = cargosMap.get(exc.orden);
      c.estado = 'no_habilitada';
      c.etiqueta_normativa = exc.motivo;
      c.observaciones = `${c.observaciones ? c.observaciones + ' | ' : ''}Desafectada del concurso por RES-2026-4798`;
      contExclusiones++;
      logs.push(`[RES-2026-4798] Cargo orden ${exc.orden} (B.P. ${exc.bp}): Marcado como NO HABILITADA (Desafectada).`);
    } else {
      // Si no estaba en el lote pero la norma lo especifica, agregarlo como no_habilitada
      cargosMap.set(exc.orden, {
        id: `cargo-${exc.orden}`,
        orden: exc.orden,
        region: "REGION IX - Misión Nueva Pompeya / El Impenetrable",
        nombre: `B.P. N° ${exc.bp}`,
        bp: exc.bp,
        cat: "3ª",
        mod: "Pública",
        zona: "ZU 4",
        jornada: "Simple",
        localidad: exc.orden === 140 ? "El Sauzalito" : "Miraflores",
        origen: "DESAFECTACIÓN NORMATIVA",
        estado: "no_habilitada",
        titular_nombre: "",
        titular_dni: "",
        reserva_nombre: "",
        reserva_dni: "",
        etiqueta_normativa: exc.motivo,
        observaciones: "Desafectada del concurso por RES-2026-4798"
      });
      contExclusiones++;
      logs.push(`[RES-2026-4798] Cargo orden ${exc.orden} (B.P. ${exc.bp}): Agregado como NO HABILITADA.`);
    }
  }

  // 3. Aplicar Rectificación de Regiones (RES-2026-4409)
  for (const rect of REGLAS_NORMATIVAS.RECTIFICACIONES_RES_4409) {
    if (cargosMap.has(rect.orden)) {
      const c = cargosMap.get(rect.orden);
      const regAnterior = c.region;
      c.region = rect.regionNueva;
      c.etiqueta_normativa = c.etiqueta_normativa ? `${c.etiqueta_normativa} | ${rect.motivo}` : rect.motivo;
      c.observaciones = `${c.observaciones ? c.observaciones + ' | ' : ''}Región corregida de ${regAnterior} a ${rect.regionNueva}`;
      contRectificaciones++;
      logs.push(`[RES-2026-4409] Cargo orden ${rect.orden} (${c.localidad}): Región rectificada a "${rect.regionNueva}".`);
    }
  }

  // 4. Aplicar Inclusión de Nuevas Vacantes (RES-2026-4409)
  for (const inc of REGLAS_NORMATIVAS.INCLUSIONES_RES_4409) {
    // Verificar si ya existe por orden o por nombre/bp
    const existePorBp = Array.from(cargosMap.values()).some(c => c.bp === inc.bp && c.nombre.toLowerCase().includes(inc.nombre.toLowerCase()));
    if (!existePorBp) {
      // Asignar un orden único si ya estuviera ocupado
      let ordenFinal = inc.orden;
      while (cargosMap.has(ordenFinal)) {
        ordenFinal++;
      }
      const nuevoCargo = {
        ...inc,
        orden: ordenFinal,
        id: `cargo-${ordenFinal}-${Date.now()}`
      };
      cargosMap.set(ordenFinal, nuevoCargo);
      contInclusiones++;
      logs.push(`[RES-2026-4409] Nueva vacante incorporada: "${inc.nombre}" (B.P. ${inc.bp}, ${inc.localidad}, ${inc.region}) con orden N° ${ordenFinal}.`);
    }
  }

  // Convertir a lista y ordenar ascendentemente por número de orden
  const cargosOrdenados = Array.from(cargosMap.values()).sort((a, b) => Number(a.orden) - Number(b.orden));

  return {
    cargos: cargosOrdenados,
    reporte: {
      exclusiones: contExclusiones,
      inclusiones: contInclusiones,
      rectificaciones: contRectificaciones,
      logs
    }
  };
}
