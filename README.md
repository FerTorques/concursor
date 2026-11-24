# Pizarra Interactiva en Vivo — Concurso Bibliotecario N° 55 y N° 47
### Traslados, Reincorporaciones e Ingreso (Ley 647-E Art. 266) — Provincia del Chaco

Aplicación web full-stack de alto rendimiento construida con **React + Vite + Tailwind CSS**, conectada a **Supabase (PostgreSQL + Real-time)** y optimizada para despliegue en **Vercel**, diseñada para gestionar y proyectar en directo la asignación de cargos durante el concurso presencial.

---

## 🚀 Características Principales

### 1. Dos Vistas Diferenciadas y Enrutadas
- **Vista Pública (`/`)**:
  - Pizarra interactiva en tiempo real de solo lectura sin necesidad de recargar la página.
  - **Modo Proyector / Pantalla Completa**: Interfaz de ultra-alto contraste para pantallas gigantes o proyectores a distancia (oculta controles secundarios, amplía tipografías a 24-32px y destaca los números de orden).
  - **Destacado Dinámico de Asignación**: Las vacantes recién modificadas vibran y se resaltan con brillo dorado, badge animado y chime sonoro suave.
  - **Buscador predictivo instantáneo y filtros**: Búsqueda multi-campo (N° orden, biblioteca, localidad, B.P., región o titular) y pastillas de estado.
  - **Contadores en vivo en la cabecera**: Desglose instantáneo de Disponibles, Asignadas para 1 reserva, Reservadas/Completas y No habilitadas.

- **Vista Administrador (`/admin`)**:
  - Acceso protegido con autenticación por email y contraseña.
  - **Operación ultrarrápida durante el acto presencial**: Botones de acción directa con un solo clic (`Asignar Titular`, `Tomar Reserva`, `Liberar`).
  - **Botón "Deshacer último cambio" (Undo Stack)**: Pila de historial con reversión instantánea en 1 segundo para corregir cualquier clic accidental durante el concurso.
  - **Selector de visualización**: Alterna entre tarjetas grandes y una **Tabla compacta de alta velocidad** ideal para operar en laptop.
  - **Exportación oficial del acta**: Descarga instantánea en formato CSV / Excel del estado completo de todas las vacantes.

### 2. Motor de Normativa y Parser de Planilla PDF
- Importador integrado en `/admin` con `pdfjs-dist` para procesar la "Planilla Anexa I" (columnas: orden, nombre, bp, cat, mod, zona, jornada, localidad, origen y región).
- **Reglas normativas automáticas aplicadas**:
  1. **Exclusión / Desafectación (RES-2026-4798)**: Marca automáticamente de inicio como `no_habilitada` (sombreadas, bloqueadas y con badge "Desafectada por RES-2026-4798") los cargos de **orden 140** (B.P. 453) y **orden 144** (B.P. 499).
  2. **Inclusión de vacantes (RES-2026-4409)**: Agrega automáticamente como `disponible` con badge "Incluida por RES-2026-4409":
     - Región V - Gral. José de San Martín: *Fray Rafael Gobelli*, B.P. 55, Mod. Pública, Cat. 3ª, Zona ZU4, Jornada Simple, Localidad Pampa del Indio, Origen `J.O.M. - SRA. ROMERO, ROSA LIDIA - RES. N° 5616/25 - MECCYT`.
     - Región X B - Resistencia: *Evita*, B.P. 234, Mod. Pública, Cat. 2ª, Zona ZU 1, Jornada Simple, Localidad Resistencia, Origen `FALLECIMIENTO - SRA. MEDINA, LUISA - RES. N° 4076/26 - MECCYT`.
  3. **Rectificación de región (RES-2026-4409)**: Actualiza automáticamente la región de los cargos de **orden 99** y **orden 115** (ambos de Campo Largo) de `REGION VIII A - Las Breñas` a `REGION IV A - Pres. Roque Sáenz Peña`.
- **Vista previa editable**: Permite inspeccionar todo el lote, modificar celdas en tiempo real, agregar cargos manualmente o descartar filas antes de confirmar el guardado en base de datos.
- **Botón de carga de lote oficial de prueba**: Permite probar y verificar la aplicación completa sin necesidad de contar físicamente con el PDF.

### 3. Estados Visuales y Reglas de Negocio
| Estado | Color e Indicador | Regla de Negocio |
| :--- | :--- | :--- |
| `no_habilitada` | Gris sombreado / apagado | Bloqueada sin interacción en la vista pública (Órdenes 140 y 144). |
| `disponible` | Esmeralda suave / neutro | Habilitada para asignación de titular. |
| `asignada` | Ámbar / Dorado intenso | Titular registrado. **Disponible para 1 reserva** (admite 2° aspirante). |
| `reservada` | Rojo carmesí de alto contraste | **Vacante completa**. Titular y reserva asignados. Bloquea nuevas asignaciones. |

---

## 📁 Estructura del Proyecto

```
concursor/
├── public/
│   └── favicon.svg              # Isotipo vectorial de libro/biblioteca
├── src/
│   ├── components/
│   │   ├── AdminLogin.jsx       # Pantalla de inicio de sesión con atajo demo
│   │   ├── CargoCard.jsx        # Tarjeta reactiva de vacante con estados y badges
│   │   ├── CargoDetailModal.jsx # Modal de detalle técnico / edición integral
│   │   ├── Navbar.jsx           # Cabecera con selector proyector, sonido y rutas
│   │   ├── PdfImportModal.jsx   # Importador PDF + vista previa editable
│   │   ├── QuickActionModal.jsx # Modal relámpago con autofocus para el acto
│   │   └── StatCounters.jsx     # Tarjetas de contadores en vivo
│   ├── context/
│   │   └── CargosContext.jsx    # Store global, Supabase Realtime, Undo y BroadcastChannel
│   ├── data/
│   │   └── initialData.js       # Dataset oficial precargado del concurso
│   ├── lib/
│   │   ├── normativeRules.js    # Motor de reglas automáticas (RES-4798 y RES-4409)
│   │   ├── pdfParser.js         # Parser de Planilla Anexa I con pdfjs-dist
│   │   ├── sound.js             # Sintetizador de tonos con Web Audio API
│   │   └── supabase.js          # Cliente resiliente de Supabase
│   ├── pages/
│   │   ├── AdminDashboard.jsx   # Tablero de control y mesa de operaciones
│   │   └── PublicBoard.jsx      # Pizarra pública de proyección en vivo
│   ├── App.jsx                  # Enrutador cliente SPA sin recarga
│   ├── index.css                # Directivas Tailwind y estilos de alto contraste
│   └── main.jsx                 # Punto de entrada de React 19
├── supabase/
│   └── schema.sql               # Esquema SQL (tablas, RLS, Realtime, índices y auditoría)
├── .env.example                 # Plantilla de variables de entorno
├── index.html                   # HTML semántico con tipografías Inter y JetBrains Mono
├── package.json                 # Dependencias y scripts
├── tailwind.config.js           # Paleta de colores de alto contraste y animaciones
├── vercel.json                  # Reglas de reescritura SPA y cabeceras de seguridad
└── vite.config.js               # Configuración Vite con Rollup code-splitting
```

---

## 🛠️ Puesta en Marcha Local

### Prerrequisitos
- Node.js v18 o superior (probado con v24)
- npm v9 o superior

### Pasos de Instalación

1. **Clonar o ingresar al proyecto:**
   ```bash
   cd "d:\Proyectos TORQUES DEV\concursor"
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo local:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

> **💡 Modo Demo / Offline Automático**: Si no configuras las variables de Supabase de inmediato, la aplicación detectará el entorno y activará automáticamente el motor local con `BroadcastChannel`. Podrás abrir dos ventanas del navegador lado a lado (una en `/` y otra en `/admin`), y ver cómo cualquier cambio se refleja **en tiempo real sin recargar**.

---

## 🗄️ Configuración de Supabase (Paso a Paso)

1. Ingresa a [supabase.com](https://supabase.com) y crea un nuevo proyecto (ej. `concursor-chaco`).
2. En el menú lateral izquierdo, ve a **SQL Editor**.
3. Abre el archivo `supabase/schema.sql` de este repositorio, copia todo su contenido y pégalo en el editor SQL de Supabase.
4. Presiona **Run** (Ejecutar). Esto creará:
   - El tipo `estado_cargo`.
   - La tabla `public.cargos` con todos los campos y metadatos.
   - La tabla `public.historial_cambios`.
   - Los índices de alto rendimiento.
   - Las políticas RLS (lectura pública y escritura protegida).
   - La suscripción en tiempo real: `ALTER PUBLICATION supabase_realtime ADD TABLE public.cargos;`.
5. Ve a **Project Settings -> API** y copia:
   - `Project URL`
   - `Project API Keys` (la clave pública `anon` `public`).
6. En la raíz de tu proyecto, crea un archivo `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
   VITE_SUPABASE_TABLE=cargos
   ```
7. En el menú **Authentication -> Users** de Supabase, crea un usuario con email y contraseña para el administrador (ej: `admin@chaco.gob.ar`).

---

## ☁️ Despliegue en Vercel (Paso a Paso)

El proyecto incluye el archivo `vercel.json` con las reglas de reescritura para que las rutas SPA (`/` y `/admin`) funcionen sin error 404 al refrescar.

### Método 1: Mediante GitHub y Vercel Dashboard (Recomendado)
1. Sube tu código a un repositorio de GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: Pizarra interactiva Concurso Bibliotecario"
   git remote add origin https://github.com/TU_USUARIO/concursor.git
   git push -u origin main
   ```
2. Inicia sesión en [vercel.com](https://vercel.com) y haz clic en **Add New... -> Project**.
3. Importa el repositorio `concursor`.
4. En la sección **Environment Variables**, añade:
   - `VITE_SUPABASE_URL` -> Tu URL de Supabase.
   - `VITE_SUPABASE_ANON_KEY` -> Tu anon key pública de Supabase.
   - `VITE_SUPABASE_TABLE` -> `cargos`
5. Haz clic en **Deploy**. ¡Tu aplicación estará en línea con HTTPS y CDN global en menos de 1 minuto!

### Método 2: Mediante Vercel CLI
```bash
npm install -g vercel
vercel
```

---

## 🔒 Acceso y Demostración Rápida
- **Vista Pública**: `https://tu-proyecto.vercel.app/`
- **Vista Administrador**: `https://tu-proyecto.vercel.app/admin`
- **Credenciales Demo**: Puedes hacer clic en el botón *"Cargar credenciales de prueba"* en la pantalla de login para ingresar inmediatamente.
