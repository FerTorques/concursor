import re

# ============================================================
# 1. CargoCard.jsx
# ============================================================
content = open('src/components/CargoCard.jsx', encoding='utf-8').read()
print(f'CargoCard conflicts: {content.count("<<<<<<<")}')

# Conflicto 1: badge/badgeText del estado asignada
# Tomamos version remota pero con badgeText='ADJUDICADA'
c1_start = content.find('<<<<<<< HEAD\n      badge:')
c1_end = content.find('\n>>>>>>> ', c1_start) + len('\n>>>>>>> ') + 40
c1_end = content.find('\n', c1_end) + 1
if c1_start >= 0:
    old1 = content[c1_start:c1_end]
    new1 = """      badge: concurso_asignacion === 'traslado'
        ? 'bg-sky-500 text-slate-950 font-black border-sky-400'
        : 'bg-amber-500 text-slate-950 font-black border-amber-400 animate-pulse-fast',
      badgeText: 'ADJUDICADA',
"""
    content = content[:c1_start] + new1 + content[c1_end:]
    print('  conflict 1 (badge) resolved OK')
else:
    print('  conflict 1 NOT FOUND')

# Conflicto 2: boton Tomar Reserva - tomamos version remota pero sin '2°'
c2_start = content.find('<<<<<<< HEAD\n                <button\n                  onClick={() => onQuickAction')
if c2_start >= 0:
    c2_end_marker = '\n>>>>>>> '
    c2_end_idx = content.find(c2_end_marker, c2_start)
    c2_end_idx = content.find('\n', c2_end_idx + len(c2_end_marker) + 20) + 1
    old2 = content[c2_start:c2_end_idx]
    new2 = """                {concurso_asignacion === 'traslado' ? (
                  <span className="text-[11px] font-semibold text-sky-300 bg-sky-950/80 px-2 py-1 rounded border border-sky-800">
                    Sin reserva (Traslado)
                  </span>
                ) : (
                  <button
                    onClick={() => onQuickAction && onQuickAction(cargo, 'reservar')}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-sm"
                  >
                    Tomar Reserva
                  </button>
                )}
"""
    content = content[:c2_start] + new2 + content[c2_end_idx:]
    print('  conflict 2 (tomar reserva) resolved OK')
else:
    print('  conflict 2 NOT FOUND')

# Cambiar '1° Concurso de Traslado Definitivo' y '2° Concurso de Ingreso'
content = content.replace('1\u00b0 Concurso de Traslado Definitivo', 'Concurso de Traslado Definitivo')
content = content.replace('2\u00b0 Concurso de Ingreso a la Docencia', 'Concurso de Ingreso a la Docencia')
print(f'  Remaining conflicts: {content.count("<<<<<<<")}')
open('src/components/CargoCard.jsx', 'w', encoding='utf-8').write(content)
print('CargoCard.jsx DONE')

# ============================================================
# 2. StatCounters.jsx
# ============================================================
content = open('src/components/StatCounters.jsx', encoding='utf-8').read()
print(f'\nStatCounters conflicts: {content.count("<<<<<<<")}')

# Conflicto: tomar la version remota (nueva logica traslado/ingreso) 
# pero cambiar '1° Traslado Definitivo' -> 'Traslado Definitivo' 
# y '2° Ingreso a la Docencia' -> 'Ingreso a la Docencia'
c_start = content.find('<<<<<<< HEAD')
if c_start >= 0:
    c_end_marker = '\n>>>>>>> '
    c_end_idx = content.find(c_end_marker, c_start)
    c_end_idx = content.find('\n', c_end_idx + len(c_end_marker) + 20) + 1
    old = content[c_start:c_end_idx]
    # Tomamos la parte remota (despues de =======)
    sep = old.find('\n=======\n')
    remote_part = old[sep + len('\n=======\n'):]
    end_marker_in_old = remote_part.find('\n>>>>>>> ')
    remote_part = remote_part[:end_marker_in_old] + '\n'
    content = content[:c_start] + remote_part + content[c_end_idx:]
    print('  conflict resolved OK (took remote)')
else:
    print('  no conflict found')

# Cambiar etiquetas con numero
content = content.replace("label: '1\u00b0 Traslado Definitivo'", "label: 'Traslado Definitivo'")
content = content.replace("label: '2\u00b0 Ingreso a la Docencia'", "label: 'Ingreso a la Docencia'")
# Tambien en texto de concurso activo
content = content.replace("'1\u00b0 Traslado Definitivo'", "'Traslado Definitivo'")
content = content.replace("'2\u00b0 Ingreso a la Docencia'", "'Ingreso a la Docencia'")
print(f'  Remaining conflicts: {content.count("<<<<<<<")}')
open('src/components/StatCounters.jsx', 'w', encoding='utf-8').write(content)
print('StatCounters.jsx DONE')

# ============================================================
# 3. AdminDashboard.jsx
# ============================================================
content = open('src/pages/AdminDashboard.jsx', encoding='utf-8').read()
print(f'\nAdminDashboard conflicts: {content.count("<<<<<<<")}')

# Resolver cada conflicto: tomar version HEAD pero con ajustes
# Conflicto en headers de tabla (2 th headers)
c_start = content.find('<<<<<<< HEAD')
while c_start >= 0:
    c_end_marker = '\n>>>>>>> '
    c_end_idx = content.find(c_end_marker, c_start)
    c_end_idx = content.find('\n', c_end_idx + len(c_end_marker) + 20) + 1
    old = content[c_start:c_end_idx]
    # Tomamos la parte HEAD
    sep = old.find('\n=======\n')
    head_part = old[len('<<<<<<< HEAD\n'):sep] + '\n'
    content = content[:c_start] + head_part + content[c_end_idx:]
    c_start = content.find('<<<<<<< HEAD')

# Ahora aplicar cambios: 
# - '1° Titular Asignado' -> 'Titular Adjudicado' (ya teniamos 'Titular Adjudicado' en HEAD)  
# - '2° Reserva' -> 'Reserva' (ya en HEAD sin numero)
# - '1° Traslado Definitivo' -> 'Traslado Definitivo' en labels de UI
# - '2° Ingreso a la Docencia' -> 'Ingreso a la Docencia' en labels de UI
# - '1° Concurso de Traslado Definitivo' -> 'Concurso de Traslado Definitivo'
# - '2° Concurso de Ingreso a la Docencia' -> 'Concurso de Ingreso a la Docencia'
content = content.replace('1\u00b0 Concurso de Traslado Definitivo', 'Concurso de Traslado Definitivo')
content = content.replace('2\u00b0 Concurso de Ingreso a la Docencia', 'Concurso de Ingreso a la Docencia')
content = content.replace('1\u00b0 Traslado Definitivo', 'Traslado Definitivo')
content = content.replace('2\u00b0 Ingreso a la Docencia', 'Ingreso a la Docencia')
content = content.replace('1\u00b0 Traslado', 'Traslado')
content = content.replace('2\u00b0 Ingreso', 'Ingreso')
# Asignada -> Adjudicada en etiquetas display (no enum)
content = content.replace("? 'Adjudicada'", "? 'Adjudicada'")  # ya correcto
# Tabla header 'Titular Adjudicado' ya bien en HEAD
print(f'  Remaining conflicts: {content.count("<<<<<<<")}')
open('src/pages/AdminDashboard.jsx', 'w', encoding='utf-8').write(content)
print('AdminDashboard.jsx DONE')

# ============================================================
# 4. PublicBoard.jsx
# ============================================================
content = open('src/pages/PublicBoard.jsx', encoding='utf-8').read()
print(f'\nPublicBoard conflicts: {content.count("<<<<<<<")}')

c_start = content.find('<<<<<<< HEAD')
while c_start >= 0:
    c_end_marker = '\n>>>>>>> '
    c_end_idx = content.find(c_end_marker, c_start)
    c_end_idx = content.find('\n', c_end_idx + len(c_end_marker) + 20) + 1
    old = content[c_start:c_end_idx]
    # Tomamos la parte remota (que tiene la logica traslado/ingreso)
    sep = old.find('\n=======\n')
    remote_part = old[sep + len('\n=======\n'):]
    end_marker_in_remote = remote_part.find('\n>>>>>>> ')
    remote_part = remote_part[:end_marker_in_remote] + '\n'
    content = content[:c_start] + remote_part + content[c_end_idx:]
    c_start = content.find('<<<<<<< HEAD')

# Ahora aplicar cambios de etiquetas:
# 'Asignada (Traslado)' -> 'Adjudicada', 'Asignada (Ingreso)' -> 'Adjudicada'
content = content.replace("'Asignada (Traslado)'", "'Adjudicada'")
content = content.replace("'Asignada (Ingreso)'", "'Adjudicada'")
# '1° Traslado' -> 'Traslado', '2° Ingreso' -> 'Ingreso' en badges de tabla
content = content.replace('1\u00b0 Traslado', 'Traslado')
content = content.replace('2\u00b0 Ingreso', 'Ingreso')
# Filtros: 'Asignadas (1 Reserva)' -> dejarlo como esta (ya es el label de filtro correcto en la version remota)
# Asignar Titular sin numero -> ya correcto

print(f'  Remaining conflicts: {content.count("<<<<<<<")}')
open('src/pages/PublicBoard.jsx', 'w', encoding='utf-8').write(content)
print('PublicBoard.jsx DONE')

print('\n=== All files processed ===')
