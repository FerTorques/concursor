import React, { useState } from 'react';
import { parsearPdfPlanilla } from '../lib/pdfParser';
import { aplicarReglasNormativas } from '../lib/normativeRules';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Plus, 
  Trash2, 
  X,
  FileCheck,
  RefreshCw
} from 'lucide-react';

export function PdfImportModal({ isOpen, onClose, onSaveBatch }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseReport, setParseReport] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'preview' | 'logs'

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      setErrorMsg('Por favor selecciona un archivo PDF válido (.pdf)');
      return;
    }

    setFile(selectedFile);
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const result = await parsearPdfPlanilla(selectedFile);
      setPreviewRows(result.cargos);
      setParseReport(result.reporte);
      setActiveTab('preview');
    } catch (err) {
      console.error('Error al procesar el PDF:', err);
      setErrorMsg(`Error al procesar el PDF: ${err.message || 'No se pudo leer el contenido'}. Intenta de nuevo o ingresa las vacantes de prueba.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setTimeout(() => {
      const rawSample = [
        { orden: 1, region: "REGION I - Nueva Pompeya", nombre: "B.P. N° 189 'Héroes de Malvinas'", bp: "189", cat: "3ª", mod: "Pública", zona: "ZU 4", jornada: "Simple", localidad: "Misión Nueva Pompeya", origen: "JUBILACIÓN - RES. N° 1102/24" },
        { orden: 28, region: "REGION IV A - Pres. Roque Sáenz Peña", nombre: "B.P. N° 45 'Mariano Moreno'", bp: "45", cat: "1ª", mod: "Pública", zona: "ZU 1", jornada: "Simple", localidad: "Presidencia Roque Sáenz Peña", origen: "JUBILACIÓN - RES. N° 4110/25" },
        { orden: 99, region: "REGION VIII A - Las Breñas", nombre: "B.P. N° 218 'José Hernández'", bp: "218", cat: "2ª", mod: "Pública", zona: "ZU 2", jornada: "Simple", localidad: "Campo Largo", origen: "JUBILACIÓN - RES. N° 3201/25" },
        { orden: 115, region: "REGION VIII A - Las Breñas", nombre: "B.P. N° 350 'Horacio Quiroga'", bp: "350", cat: "3ª", mod: "Pública", zona: "ZU 3", jornada: "Simple", localidad: "Campo Largo", origen: "FALLECIMIENTO - RES. N° 1400/25" },
        { orden: 140, region: "REGION IX - Misión Nueva Pompeya", nombre: "B.P. N° 453", bp: "453", cat: "3ª", mod: "Pública", zona: "ZU 4", jornada: "Simple", localidad: "El Sauzalito", origen: "REVISIÓN" },
        { orden: 144, region: "REGION IX - Castelli / Miraflores", nombre: "B.P. N° 499", bp: "499", cat: "3ª", mod: "Pública", zona: "ZU 4", jornada: "Simple", localidad: "Miraflores", origen: "REVISIÓN" },
        { orden: 185, region: "REGION X B - Resistencia", nombre: "B.P. N° 1 'Nicolás Avellaneda'", bp: "1", cat: "1ª", mod: "Pública", zona: "ZU 1", jornada: "Simple", localidad: "Resistencia", origen: "JUBILACIÓN ORDINARIA - RES. N° 3980/25" }
      ];

      const res = aplicarReglasNormativas(rawSample);
      setPreviewRows(res.cargos);
      setParseReport(res.reporte);
      setActiveTab('preview');
      setIsProcessing(false);
    }, 400);
  };

  const handleUpdateField = (index, field, value) => {
    setPreviewRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeleteRow = (index) => {
    setPreviewRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddNewRow = () => {
    const nextOrden = previewRows.length > 0 ? Math.max(...previewRows.map(r => Number(r.orden) || 0)) + 1 : 1;
    const newRow = {
      id: `cargo-manual-${Date.now()}`,
      orden: nextOrden,
      region: "REGION X B - Resistencia",
      nombre: "Nueva Biblioteca / Establecimiento",
      bp: "",
      cat: "1ª",
      mod: "Pública",
      zona: "ZU 1",
      jornada: "Simple",
      localidad: "Resistencia",
      origen: "AGREGADO MANUAL EN ACTO",
      estado: "disponible",
      titular_nombre: "",
      titular_dni: "",
      reserva_nombre: "",
      reserva_dni: "",
      etiqueta_normativa: "",
      observaciones: ""
    };
    setPreviewRows([newRow, ...previewRows]);
  };

  const handleConfirmAndSave = () => {
    if (previewRows.length === 0) return;
    onSaveBatch(previewRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                Importador de Planilla Anexa I y Motor Normativo
              </h2>
              <p className="text-xs text-slate-400">
                Parsea PDF oficial y aplica automáticamente RES-2026-4798 y RES-2026-4409
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-3 border-b-2 transition-all ${
              activeTab === 'upload' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Cargar Archivo PDF
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            disabled={previewRows.length === 0}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'preview' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200 disabled:opacity-40'
            }`}
          >
            2. Vista Previa Editable ({previewRows.length})
          </button>
          {parseReport && (
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'logs' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              3. Auditoría Normativa ({parseReport.logs.length})
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-2xl p-8 text-center bg-slate-950/50 hover:bg-slate-900/60 transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer"
                onClick={() => document.getElementById('pdf-file-input').click()}
              >
                <input
                  id="pdf-file-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                />
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shadow-inner">
                  {isProcessing ? (
                    <RefreshCw className="w-7 h-7 animate-spin" />
                  ) : (
                    <FileText className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    {file ? file.name : 'Arrastra aquí la "Planilla Anexa I (PDF)"'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    o haz clic para explorar los archivos de tu equipo
                  </p>
                </div>
                <div className="pt-2 text-[11px] text-slate-500">
                  Detecta automáticamente columnas (N°, B.P., Cat., Zona, Jornada, Localidad, Origen) y secciones de Región.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    ¿Quieres probar sin subir un archivo PDF ahora?
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Carga el lote oficial representativo de la Provincia del Chaco con todas las reglas aplicadas en un clic.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 whitespace-nowrap"
                >
                  Cargar Lote de Prueba Oficial
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Reglas Normativas Automáticas Aplicadas:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/40 text-slate-300 space-y-1">
                    <span className="font-bold text-rose-300 block">1. Desafectación (RES-2026-4798)</span>
                    <p className="text-slate-400">
                      Cargos de orden <strong>140</strong> (B.P. 453) y <strong>144</strong> (B.P. 499) marcados como <code>no_habilitada</code>.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-slate-300 space-y-1">
                    <span className="font-bold text-emerald-300 block">2. Inclusión (RES-2026-4409)</span>
                    <p className="text-slate-400">
                      Agrega <strong>Fray Rafael Gobelli</strong> (Región V, B.P. 55) y <strong>Evita</strong> (Región X B, B.P. 234).
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-800/40 text-slate-300 space-y-1">
                    <span className="font-bold text-indigo-300 block">3. Rectificación (RES-2026-4409)</span>
                    <p className="text-slate-400">
                      Corrige región de órdenes <strong>99</strong> y <strong>115</strong> (Campo Largo) de Región VIII A a Región IV A.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 font-bold">
                    Lote a Sincronizar: <strong className="text-sky-400 font-mono text-sm">{previewRows.length}</strong> vacantes
                  </span>
                  {parseReport && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                      +{parseReport.inclusiones} inclusiones • {parseReport.exclusiones} exclusiones • {parseReport.rectificaciones} rectificaciones
                    </span>
                  )}
                </div>
                <button
                  onClick={handleAddNewRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar Vacante Manual
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 max-h-[48vh]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/90 text-slate-300 sticky top-0 z-10 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-2.5">Orden</th>
                      <th className="p-2.5">Región</th>
                      <th className="p-2.5">Establecimiento / Biblioteca</th>
                      <th className="p-2.5">B.P.</th>
                      <th className="p-2.5">Cat / Mod</th>
                      <th className="p-2.5">Zona / Jornada</th>
                      <th className="p-2.5">Localidad</th>
                      <th className="p-2.5">Estado</th>
                      <th className="p-2.5 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {previewRows.map((row, idx) => (
                      <tr
                        key={row.id || idx}
                        className={`hover:bg-slate-800/30 transition-colors ${
                          row.estado === 'no_habilitada' ? 'bg-slate-900/80 opacity-60' : ''
                        }`}
                      >
                        <td className="p-2 font-mono font-bold text-sky-400">
                          <input
                            type="number"
                            value={row.orden}
                            onChange={(e) => handleUpdateField(idx, 'orden', parseInt(e.target.value, 10))}
                            className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-center font-bold text-white focus:outline-none focus:border-sky-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.region}
                            onChange={(e) => handleUpdateField(idx, 'region', e.target.value)}
                            className="w-40 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.nombre}
                            onChange={(e) => handleUpdateField(idx, 'nombre', e.target.value)}
                            className="w-56 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none focus:border-sky-500"
                          />
                          {row.etiqueta_normativa && (
                            <span className="block text-[10px] text-amber-400 font-semibold mt-0.5">
                              {row.etiqueta_normativa}
                            </span>
                          )}
                        </td>
                        <td className="p-2 font-mono">
                          <input
                            type="text"
                            value={row.bp}
                            onChange={(e) => handleUpdateField(idx, 'bp', e.target.value)}
                            className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-300 text-center font-mono focus:outline-none focus:border-sky-500"
                          />
                        </td>
                        <td className="p-2 text-slate-400">
                          <span>{row.cat} / {row.mod}</span>
                        </td>
                        <td className="p-2 text-slate-400">
                          <span>{row.zona} / {row.jornada}</span>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.localidad}
                            onChange={(e) => handleUpdateField(idx, 'localidad', e.target.value)}
                            className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-rose-300 font-medium focus:outline-none focus:border-sky-500"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={row.estado}
                            onChange={(e) => handleUpdateField(idx, 'estado', e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 font-bold focus:outline-none focus:border-sky-500"
                          >
                            <option value="disponible">disponible</option>
                            <option value="asignada">asignada</option>
                            <option value="reservada">reservada</option>
                            <option value="no_habilitada">no_habilitada</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => handleDeleteRow(idx)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'logs' && parseReport && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Historial de Auditoría de Reglas Normativas:
              </span>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-xs max-h-[50vh] overflow-y-auto">
                {parseReport.logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 px-6 border-t border-slate-800 bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancelar
          </button>

          {previewRows.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmAndSave}
              className="px-6 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all"
            >
              <FileCheck className="w-4 h-4" />
              Confirmar y Cargar a la Base de Datos ({previewRows.length} vacantes)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
