# Corregir etiquetas restantes

# --- AdminDashboard.jsx ---
content = open('src/pages/AdminDashboard.jsx', encoding='utf-8').read()
content = content.replace('Asignadas: <strong', 'Adjudicadas: <strong')
print('AdminDashboard.jsx patched')
open('src/pages/AdminDashboard.jsx', 'w', encoding='utf-8').write(content)

# --- PublicBoard.jsx ---
content = open('src/pages/PublicBoard.jsx', encoding='utf-8').read()
content = content.replace('<th className="p-3">1\u00b0 Titular</th>', '<th className="p-3">Titular</th>')
content = content.replace('<th className="p-3">2\u00b0 Reserva</th>', '<th className="p-3">Reserva</th>')
content = content.replace('1\u00b0 Concurso de Traslado Definitivo', 'Concurso de Traslado Definitivo')
content = content.replace('2\u00b0 Concurso de Ingreso a la Docencia', 'Concurso de Ingreso a la Docencia')
content = content.replace('1\u00b0 Traslado', 'Traslado')
content = content.replace('2\u00b0 Ingreso', 'Ingreso')
open('src/pages/PublicBoard.jsx', 'w', encoding='utf-8').write(content)
print('PublicBoard.jsx patched')

# --- CargoDetailModal.jsx ---
content = open('src/components/CargoDetailModal.jsx', encoding='utf-8').read()
content = content.replace('1\u00b0 Traslado Definitivo (Sin reservas)', 'Traslado Definitivo (Sin reservas)')
content = content.replace('2\u00b0 Ingreso a la Docencia (Con reservas)', 'Ingreso a la Docencia (Con reservas)')
content = content.replace('1\u00b0 Concurso de Traslado Definitivo', 'Concurso de Traslado Definitivo')
content = content.replace('2\u00b0 Concurso de Ingreso a la Docencia', 'Concurso de Ingreso a la Docencia')
content = content.replace('1\u00b0 Aspirante \u2014 Titular:', 'Aspirante (Titular Adjudicado):')
content = content.replace('2\u00b0 Aspirante \u2014 En Reserva (Ingreso):', 'Aspirante (Reserva):')
open('src/components/CargoDetailModal.jsx', 'w', encoding='utf-8').write(content)
print('CargoDetailModal.jsx patched')

# --- Verificacion final ---
files = [
    'src/components/CargoCard.jsx',
    'src/components/StatCounters.jsx',
    'src/pages/AdminDashboard.jsx',
    'src/pages/PublicBoard.jsx',
    'src/components/CargoDetailModal.jsx',
]

search_ui_labels = ['1\u00b0 Titular', '2\u00b0 Reserva', '1\u00b0 Aspirante', '2\u00b0 Aspirante', 
                    '1\u00b0 Concurso', '2\u00b0 Concurso', '<<<<<<<']
# Note: '1\u00b0 Traslado' and '2\u00b0 Ingreso' standalone are ok to remain as badges (like 'Traslado' label in table)
# But in full labels like '1\u00b0 Traslado Definitivo' they should be gone

print('\n=== Final verification ===')
for f in files:
    c = open(f, encoding='utf-8').read()
    found = []
    for term in search_ui_labels:
        cnt = c.count(term)
        if cnt > 0:
            found.append(f'{term}({cnt})')
    if found:
        print(f'REMAINING: {f}: {found}')
    else:
        print(f'OK: {f}')

print('\nAll done!')
