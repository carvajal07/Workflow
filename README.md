# Handoff: PDF Template Editor (pdfsketch)

## Overview
Aplicación web para el maquetado de archivos PDF con herramientas de arrastrar y soltar sobre un lienzo, formas, texto, imágenes, tablas, códigos QR y campos de datos dinámicos. Inspirado en editores tipo Inspire Designer / InDesign, enfocado a **plantillas reutilizables con datos variables** (facturas, extractos, certificados, etc.).

El usuario final es un usuario general (no diseñador pro) que necesita crear plantillas de PDF con un flujo simple y pocas opciones visibles a la vez.

## About the Design Files
Los archivos en este bundle son **referencias de diseño en HTML** — prototipos mostrando la estética y el comportamiento previsto, **no código de producción para copiar directamente**. La tarea del desarrollador es **recrear estos diseños** en el stack definido abajo usando sus patrones y librerías idiomáticas.

## Fidelity
- **`editor-hifi.html`** → **High-fidelity**. Pixel-perfect con tema oscuro final, paleta, tipografía, spacing e interacciones previstas. Reprodúcelo fielmente.
- **`wireframes.html`** → **Low-fidelity**. Exploración de 3 enfoques (Clásico, Radial, Bloques). Solo el **enfoque 01 Clásico** se lleva a producción. Los otros dos son referencia descartada.

---

## Tech Stack (definido con el cliente)

### Frontend (este repo)
- **React 18 + TypeScript**
- **Vite** como bundler
- **TailwindCSS** + CSS variables (tema oscuro principal, claro como tweak)
- **Konva.js + react-konva** — render del lienzo PDF (formas, texto, imágenes, handles, rotación, z-index)
- **@dnd-kit/core** — drag & drop desde toolbar/tree al lienzo
- **Zustand + zundo** — estado global con undo/redo (⌘Z / ⌘⇧Z)
- **react-resizable-panels** — splitter entre Tree y Properties
- **react-arborist** — Layout Tree con nodos expandibles
- **lucide-react** — iconos SVG
- **react-hook-form + zod** — formularios del inspector de propiedades
- **pdf-lib** (solo para **preview** rápido cliente — NO para export final)
- **axios** o **fetch** nativo + **tanstack-query** para API

### Backend (repo separado, responsabilidad del cliente)
- **Python** (FastAPI recomendado)
- **ReportLab** para generación de PDF final
- **DynamoDB** como base de datos (boto3)
- **JWT** para autenticación (no multi-tenant)
- **S3** (o equivalente) para imágenes subidas

### Repos
Repos **separados** frontend y backend. Este handoff cubre solo el frontend.

### Autenticación
JWT en header `Authorization: Bearer <token>`. Pantalla de login simple (no incluida en este handoff; pídela aparte si se necesita).

---

## Estructura propuesta del proyecto

```
pdfsketch-frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   └── layout/
│   │       ├── AppShell.tsx         # Grid 5×3 (titlebar, menu, toolbar-h, main, status)
│   │       ├── TitleBar.tsx
│   │       ├── MenuBar.tsx
│   │       ├── FormatToolbar.tsx    # Toolbar horizontal de formato
│   │       ├── StatusBar.tsx
│   │       └── LeftRail.tsx         # Toolbar vertical de herramientas
│   ├── features/
│   │   ├── canvas/
│   │   │   ├── Canvas.tsx           # <Stage> de Konva
│   │   │   ├── Rulers.tsx           # Reglas H/V en mm
│   │   │   ├── Sheet.tsx            # Hoja A4 con márgenes
│   │   │   ├── elements/
│   │   │   │   ├── TextElement.tsx
│   │   │   │   ├── RectElement.tsx
│   │   │   │   ├── CircleElement.tsx
│   │   │   │   ├── LineElement.tsx
│   │   │   │   ├── ImageElement.tsx
│   │   │   │   ├── TableElement.tsx
│   │   │   │   ├── QRElement.tsx
│   │   │   │   └── DataFieldElement.tsx
│   │   │   ├── Selection.tsx        # Handles y rotación
│   │   │   └── useCanvasDnd.ts      # Integración dnd-kit + Konva
│   │   ├── tree/
│   │   │   ├── LayoutTree.tsx       # react-arborist
│   │   │   └── nodes/               # Node renderers por tipo
│   │   ├── properties/
│   │   │   ├── Inspector.tsx        # Panel derecho (en left rail bottom)
│   │   │   ├── tabs/
│   │   │   │   ├── PositionTab.tsx
│   │   │   │   ├── GeneralTab.tsx
│   │   │   │   ├── GuidelinesTab.tsx
│   │   │   │   └── HeadsTab.tsx
│   │   │   └── fields/
│   │   │       ├── NumberInput.tsx
│   │   │       ├── UnitSelect.tsx
│   │   │       └── ColorSwatch.tsx
│   │   ├── pages/                   # Gestión de páginas del documento
│   │   │   ├── PagesPanel.tsx
│   │   │   └── PageThumbnail.tsx
│   │   ├── history/
│   │   │   └── useHistory.ts        # zundo wrapper
│   │   └── export/
│   │       └── useExportPdf.ts      # Llama al backend para render final
│   ├── store/
│   │   ├── documentStore.ts         # Zustand: document + páginas + elementos
│   │   ├── selectionStore.ts        # Elementos seleccionados
│   │   ├── toolStore.ts             # Herramienta activa
│   │   └── uiStore.ts               # Panels visibility, theme, zoom
│   ├── api/
│   │   ├── client.ts                # axios instance + JWT interceptor
│   │   ├── templates.ts             # CRUD plantillas
│   │   ├── images.ts                # Upload imágenes
│   │   └── export.ts                # POST /export → returns PDF blob
│   ├── types/
│   │   ├── document.ts              # Document, Page, Element types
│   │   └── api.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── tokens.css               # CSS variables
│   └── main.tsx
├── public/
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

---

## Pantalla: Editor principal

### Layout (grid CSS)
```
grid-template-rows:    30px 34px 38px 1fr 24px;
grid-template-columns: 44px 240px 1fr;
```

Filas:
1. **TitleBar** (30px, full-width) — macOS-style traffic lights + nombre archivo
2. **MenuBar** (34px, full-width) — menús + undo/redo + export
3. **FormatToolbar** (38px, full-width) — formato de texto/párrafo
4. **Main** (1fr) — 3 columnas: [Left rail toolbar | Left panel tree+props | Canvas]
5. **StatusBar** (24px, full-width) — zoom, página, coords, flags, save status

### TitleBar
- Traffic lights macOS (rojo `#ff605c`, amarillo `#ffbd44`, verde `#00ca4e`), 11px diámetro
- Título centrado: `pdfsketch · <filename>.pdfs · borrador`
- Versión a la derecha en gris

### MenuBar
Items de texto: **Archivo, Editar, Ver, Insertar, Formato, Datos, Ayuda**
- Hover: bg `var(--bg-3)` radius 3px
- Deshacer/Rehacer con iconos flecha+kbd (⌘Z / ⌘⇧Z) — lucide `Undo2` / `Redo2`
- Botón **Exportar PDF** (primary):
  - Background: `var(--accent)` = `oklch(0.72 0.15 150)` (verde)
  - Text: `#0b1a10`
  - Font-weight: 600
  - Icono `FileDown` de lucide

### FormatToolbar
Grupos separados por `border-left: 1px solid var(--line-2)`:

**Grupo 1 — Fuente**
- Select familia (ancho 130px, default "Inter")
- Select subfamilia (ancho 86px, default "Regular")
- NumberInput tamaño (ancho 54px, default 10)
- Select unidad (ancho 48px, opciones: `pt`, `px`, `mm`)

**Grupo 2 — Estilo de fuente**
- Botones toggle 22×22px: **B** (bold), **I** (italic), **U** (underline), **S** (strike)
- Swatch de color (22×22 con caret dropdown)

**Grupo 3 — Alineación**
- 3 botones toggle icono lucide: `AlignLeft`, `AlignCenter`, `AlignRight`
- Activo: bg `var(--bg-4)`, text `var(--accent)`

**Grupo 4 — Justificación**
- 4 botones: justificar izq, centro, der, bloque
  (líneas con distintas longitudes simulando justificación)

**Grupo 5 (derecha) — Estilo de párrafo**
- Select 150px, default "Normal"

### LeftRail (Toolbar vertical, 44px)
Botones 32×32 con icono lucide 16px, separados por `<hr>` (22px × 1px línea):

**Grupo Selección/Navegación**
- `MousePointer2` — Seleccionar (V) — estado activo por defecto
- `Hand` — Mover / pan (H)

**Grupo Dibujo/Contenido**
- `Type` — Texto (T)
- `Square` — Rectángulo (R)
- `Circle` — Círculo (O)
- `Slash` — Línea (L)
- `PenLine` — Lápiz / dibujo libre (P)

**Grupo Inserción**
- `Image` — Imagen (I)
- `Table2` — Tabla
- `QrCode` — QR / código

**Estados del botón:**
- Default: color `var(--ink-2)`, bg transparent
- Hover: bg `var(--bg-3)`, color `var(--ink)`
- Active: bg `var(--accent-soft)` = `oklch(0.72 0.15 150 / 0.12)`, color `var(--accent)`, border `var(--accent-dim)`
- Tooltip al hover con nombre + shortcut (aparece a la derecha del rail)

### LeftPanel (240px, split vertical)
Dos secciones apiladas con splitter `react-resizable-panels`:

#### LayoutTree (sección superior)
Componente `react-arborist`. Nodos principales:
```
- Data (3)
- Pages (4) ▼
  · Page H Tiro ExtractoPatrocinadoras
  · Page H Retiro ExtractoPatrocinadoras
  · Page H Anexo ExtractoPatrocinadoras
  · Page 1  [selected]
- DynamicCommunications (2)
- Elements (12)
- Flows (2)
- ParagraphStyles (5)
- TextStyles (8)
- Fonts (3)
- BorderStyles (4)
- LineStyles (3)
- FillStyles (6)
- Colors (9)
- Images (4)
- Tables (3)
- RowSets (2)
- Cells (6)
```

Cada nodo:
- Chevron ▶/▼ (10px, color muted), rota al expandir
- Icono tipo (14px lucide/custom, color `var(--ink-2)`)
- Label flex-1 con ellipsis
- Counter mono 10px color muted a la derecha
- Click selecciona (background `var(--accent-soft)`, texto `var(--accent)`)
- Doble-click abre elemento en canvas (si aplica)
- Nodo **activo/selected**: bg `var(--accent)`, texto `#0b1a10`

Header del panel:
- Título "Layout Tree" font 11px/600
- Botones ➕ (añadir), 🔍 (buscar), ⋯ (más) a la derecha

#### LayoutProperties (sección inferior)
- Breadcrumb: `● Page 1 — Page` (dot de acento)
- **Tabs**: Posición (activo), General, Guías, Heads, … (overflow)
- Tab activo: border-bottom 2px `var(--accent)`, text color `var(--accent)`

**Campos de Posición (para Page seleccionada):**
```
Sección: Posición
  X        [0.00  mm]
  Y        [0.00  mm]
Sección: Tamaño
  Ancho    [210.00 mm]   [A4 preset]
  Alto     [297.00 mm]
Sección: Transformación
  Rotación [0.00°]
  Visible  [Sí/No segmented]
Sección: Página
  Peso     [5.00 g/m²]
  Fondo    [■ White ▾]
  Repetir  [Empty ▾]
  Añadir alto [5.00 mm]
```

Cada input numérico (`NumberInput.tsx`):
- 22px de alto
- bg `var(--bg-3)`, border `var(--line-2)`, radius 3px
- Texto alineado a la derecha, mono 11px
- Unidad en gris a la derecha (mm, pt, °, etc.)
- Drag horizontal sobre el label = cambiar valor (UX pro)
- Doble-click = editar

### Canvas (centro, fill)
- Background: `var(--canvas)` = `#3a3a3f`
- **Reglas**:
  - Esquina 20×20 en top-left (cubre intersección)
  - Ruler-H (top, 20px alto): ticks cada 20px, label mono 9px cada 100px (0, 100, 200…)
  - Ruler-V (left, 20px ancho): ticks y labels idénticos en vertical
  - Color línea `#7d7d82`
- **Hoja A4**:
  - Tamaño en px = mm × escala (default 2.2 px/mm ≈ 462×653px)
  - Background `#fbfbf8`
  - Shadow: `0 2px 20px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.4)`
  - Margen guide: `inset: 30px`, `border: 1px dashed oklch(0.72 0.15 150 / 0.55)`
- **Konva Stage** llena el área del canvas-wrap. La hoja es un `Rect` blanco; los elementos son Konva nodes.
- **Scroll / zoom**:
  - Scroll con rueda = pan
  - Ctrl+scroll = zoom (0.1 a 5x)
  - Espacio + drag = pan
- **Selección**:
  - Click selecciona
  - Handles azules `var(--sel)` = `oklch(0.68 0.19 235)`
  - 8 handles de resize (esquinas + medios) + 1 de rotación (arriba, conectado por línea)
  - Handle 8×8px, paper bg, border sel 1.5px

### Elementos del lienzo (tipos)
| Tipo         | Konva node                        | Props principales                                   |
|--------------|-----------------------------------|-----------------------------------------------------|
| `text`       | `Text`                            | text, fontFamily, fontSize, fontStyle, fill, align, lineHeight |
| `rect`       | `Rect`                            | width, height, fill, stroke, strokeWidth, cornerRadius |
| `circle`     | `Circle` / `Ellipse`              | radiusX, radiusY, fill, stroke                      |
| `line`       | `Line`                            | points[], stroke, strokeWidth, dash                 |
| `pen`        | `Line` (with tension)             | points[] capturados del pointer                     |
| `image`      | `Image`                           | src (S3 URL), cropX/Y, opacity                      |
| `table`      | `Group` custom                    | columns[], rows[], data binding                     |
| `qr`         | `Image` renderizado (canvas→img)  | data or `{ variable }`                              |
| `dataField`  | `Text` con placeholder            | binding: `cliente.nombre`, fallback text            |

### StatusBar
Izquierda a derecha:
- Zoom: `−` / `100 %` / `+` (mono font)
- Separator
- Page nav: `⏮ ◀ [1] / 4 ▶ ⏭`
- Separator
- Coords: `x: 87.40mm`, `y: 122.65mm` (mono, actualiza con pointer move)
- Separator
- Toggle Grid (icono + label)
- Toggle Snap (icono + label)
- Push (flex-1)
- `A4 · 210×297mm` mono muted
- Separator
- ● verde + `guardado hace 12s` (se actualiza cada X segundos)

---

## Design Tokens

### Colors (dark theme, default)
```css
--bg-0:    #1e1e20;   /* window bg */
--bg-1:    #26262a;   /* panel bg */
--bg-2:    #2c2c31;   /* raised */
--bg-3:    #34343a;   /* input / hover */
--bg-4:    #3d3d44;
--canvas:  #3a3a3f;   /* canvas area */
--line:    #1a1a1c;   /* darker divider */
--line-2:  #3a3a40;
--line-3:  #47474e;
--ink:     #e8e8ea;
--ink-2:   #b4b4b8;
--muted:   #7d7d82;
--accent:       oklch(0.72 0.15 150);            /* verde */
--accent-dim:   oklch(0.52 0.12 150);
--accent-soft:  oklch(0.72 0.15 150 / 0.12);
--sel:          oklch(0.68 0.19 235);            /* azul selección */
--paper:        #fbfbf8;
--paper-shadow: rgba(0,0,0,0.45);
--danger:       oklch(0.65 0.18 25);
```

### Light theme (Tweak toggleable)
```css
--bg-0: #eeede8;  --bg-1: #f5f4ef;  --bg-2: #eceae4;
--bg-3: #e2dfd7;  --bg-4: #d6d3ca;  --canvas: #d9d7cf;
--line: #bab8b1;  --line-2: #c9c6be; --line-3: #a8a59c;
--ink: #1a1a1a;   --ink-2: #4a4a4a;  --muted: #7a7a78;
```

### Typography
- **UI**: `Inter`, 400/500/600/700, -webkit-font-smoothing: antialiased
- **Mono** (valores, coords): `JetBrains Mono`, 400/500, font-variant-numeric: tabular-nums
- Tamaños UI: 11px (tooltip/label), 12px (body), 14px (canvas texts), 16px (titles within canvas)

### Spacing / sizing
- Button height: 22px (toolbar), 32px (left rail)
- Input height: 22px
- Panel padding: 8–10px
- Border radius: 3px (inputs/buttons), 5px (floating panels)

### Shadows
- Panel floating: `0 10px 40px rgba(0,0,0,0.5)`
- Canvas paper: `0 2px 20px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.4)`

---

## Data Model

### TypeScript types

```ts
export type Unit = 'mm' | 'pt' | 'px';

export interface DocumentModel {
  id: string;
  name: string;
  unit: Unit;               // default 'mm'
  pages: Page[];
  assets: {
    fonts: Font[];
    colors: ColorToken[];
    textStyles: TextStyle[];
    paragraphStyles: ParagraphStyle[];
    borderStyles: BorderStyle[];
    lineStyles: LineStyle[];
    fillStyles: FillStyle[];
    images: ImageAsset[];
    tables: TableDef[];
    rowSets: RowSet[];
    cells: CellDef[];
  };
  data: DataSources;        // para campos dinámicos
  dynamicComms: DynamicComm[];
  flows: Flow[];
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: string;
  name: string;
  size: { width: number; height: number; unit: Unit };  // 210x297 mm
  background: string;       // color or #fff
  margin: { top: number; right: number; bottom: number; left: number };
  rotation: number;
  visible: boolean;
  weight: number;           // g/m²
  repeatedBy: 'Empty' | string;
  addHeight: number;
  elements: ElementModel[];
}

export type ElementModel =
  | TextEl | RectEl | CircleEl | LineEl | PenEl
  | ImageEl | TableEl | QrEl | DataFieldEl;

interface BaseEl {
  id: string;
  type: string;
  x: number; y: number;      // en mm (unit del doc)
  width: number; height: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  layer?: string;
}

export interface TextEl extends BaseEl {
  type: 'text';
  text: string;              // puede contener `{ variable }`
  fontFamily: string;
  fontSize: number;
  fontStyle: 'normal' | 'italic';
  fontWeight: number;
  textDecoration?: 'underline' | 'line-through';
  align: 'left' | 'center' | 'right' | 'justify';
  justify?: 'left' | 'center' | 'right' | 'block';
  lineHeight: number;
  color: string;
}

// ... (Rect, Circle, Line, Pen, Image, Table, Qr, DataField) análogos
```

### State (Zustand)

```ts
// documentStore.ts
interface DocumentState {
  doc: DocumentModel;
  currentPageId: string;
  setDoc(d: DocumentModel): void;
  updateElement(id: string, patch: Partial<ElementModel>): void;
  addElement(pageId: string, el: ElementModel): void;
  removeElement(id: string): void;
  // etc
}
// wrap with `zundo` for undo/redo

// selectionStore.ts
interface SelectionState {
  selectedIds: string[];
  select(ids: string[]): void;
  clear(): void;
}

// toolStore.ts
type Tool = 'select' | 'hand' | 'text' | 'rect' | 'circle' | 'line'
          | 'pen' | 'image' | 'table' | 'qr';
interface ToolState { active: Tool; setActive(t: Tool): void; }

// uiStore.ts
interface UIState {
  theme: 'dark' | 'light';
  panels: { leftRail: boolean; leftPanel: boolean; formatToolbar: boolean; statusBar: boolean };
  zoom: number;
  showGrid: boolean;
  showSnap: boolean;
}
```

---

## Interactions & Behavior

### Drag & drop desde toolbar al canvas
1. Usuario hace click en herramienta (p.ej. Rectángulo) → `toolStore.setActive('rect')`
2. Cursor cambia en el canvas a crosshair
3. Pointerdown en canvas → comienza draw
4. Pointermove → actualiza tamaño en tiempo real
5. Pointerup → inserta `RectEl` en el store, vuelve a tool `select` (opcional por setting)

**Alternativa:** drag-drop `@dnd-kit` desde el rail — crea elemento del tipo en el drop point.

### Edición de texto inline
- Doble-click en `TextEl` → modo edición inline (HTML contenteditable superpuesto al Konva)
- Enter = nueva línea, Esc/blur = commit

### Selección y manipulación
- Click = seleccionar uno (clear previo)
- Shift+click = añadir a selección
- Drag sobre canvas vacío = box-select
- Drag sobre elemento = mover
- Drag handle esquina = resize proporcional (Shift = libre)
- Drag handle medio = resize un eje
- Drag handle rotación = rotar (snap 15° con Shift)
- Delete = eliminar seleccionados

### Snapping
- Si `showSnap` activo, snap a:
  - Grid (cada 5mm default)
  - Guías de margen
  - Bordes/centros de otros elementos (con líneas de ayuda magenta temporales)

### Undo/Redo
- `zundo` mantiene historial (cap 100 steps)
- ⌘Z / Ctrl+Z → undo
- ⌘⇧Z / Ctrl+Shift+Z → redo
- Undo/Redo buttons en MenuBar llaman las mismas acciones

### Zoom / pan
- Ctrl/Cmd + rueda = zoom (0.1 a 5x) centrado en pointer
- Espacio + drag = pan
- `0` = fit to viewport, `1` = 100%
- StatusBar muestra porcentaje

### Data binding
- Campos de texto pueden contener `{ variable.path }` — se resuelven al exportar
- Panel `Data` del tree permite definir datasets de prueba (CSV/JSON)
- Preview mode muestra valores resueltos

### Persistencia / API
```
POST   /api/templates           → crear plantilla
GET    /api/templates           → listar
GET    /api/templates/:id       → leer
PUT    /api/templates/:id       → guardar (autosave cada N segundos)
DELETE /api/templates/:id
POST   /api/images              → subir imagen (multipart) → S3 URL
POST   /api/export              → body: { templateId, data } → returns application/pdf blob
```

Autosave:
- Debounce 2s tras última mutación
- Indicador en status bar "guardando…" → "guardado hace Xs"
- En fallo: icono rojo + tooltip con error

### Export a PDF
- Botón "Exportar PDF" → abre modal con opciones (dataset, calidad, páginas)
- Submit → `POST /api/export` → backend genera con ReportLab → descarga PDF

---

## Design Tokens — Resumen TailwindCSS

`tailwind.config.ts`:
```ts
export default {
  theme: {
    extend: {
      colors: {
        bg: { 0:'var(--bg-0)', 1:'var(--bg-1)', 2:'var(--bg-2)', 3:'var(--bg-3)', 4:'var(--bg-4)' },
        ink: { DEFAULT:'var(--ink)', 2:'var(--ink-2)', muted:'var(--muted)' },
        line: { DEFAULT:'var(--line)', 2:'var(--line-2)', 3:'var(--line-3)' },
        accent: { DEFAULT:'var(--accent)', dim:'var(--accent-dim)', soft:'var(--accent-soft)' },
        sel: 'var(--sel)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};
```

---

## Assets
- **Iconos**: todos de `lucide-react` (ver mapeo en secciones arriba)
- **Fuentes**: Inter + JetBrains Mono desde Google Fonts o self-hosted
- **Imágenes del usuario**: subir a S3 vía backend, guardar URL en `ImageAsset`

---

## Files en este bundle
- `editor-hifi.html` — Diseño hi-fi de referencia (el que se debe recrear)
- `wireframes.html` — Exploración lo-fi con 3 enfoques (solo el 01 Clásico va a producción)
- `README.md` — este documento

---

## Prioridades de implementación (sugerido)

**MVP 1 — Shell + canvas básico**
1. Layout grid 5×3 funcional con los paneles vacíos
2. Design tokens en CSS + Tailwind
3. Canvas Konva con hoja A4 + reglas + zoom/pan
4. Herramienta Rectángulo (create + select + move + resize)
5. Store Zustand del documento

**MVP 2 — Herramientas core**
6. Texto (con edición inline)
7. Círculo, Línea, Lápiz
8. Imagen (upload al backend)
9. Undo/Redo con zundo

**MVP 3 — Panels completos**
10. LayoutTree con react-arborist, todos los nodos
11. Inspector de propiedades con tabs
12. MenuBar + FormatToolbar funcionales
13. StatusBar con coords live

**MVP 4 — Datos y export**
14. Tabla dinámica
15. QR / código
16. Data binding `{ variable }`
17. Export PDF vía backend ReportLab
18. Autosave

**MVP 5 — Polish**
19. Tema claro (tweak)
20. Snapping y guías inteligentes
21. Múltiples páginas (navegación, thumbnails, reordenar)
22. Atajos de teclado completos

---

## Notas finales para el implementador
- El HTML hi-fi usa valores absolutos en px — tradúcelos a **mm** en el modelo, con una constante `MM_TO_PX = 2.2` inicial (ajustable con zoom)
- Konva opera en coordenadas px del `Stage`; convierte desde/hacia mm en la capa de store
- El scroll del canvas debe preservar posición al cambiar de página
- Los handles de selección NO son parte del elemento — son un overlay que se redibuja según `selectionStore`
- Para accesibilidad: todos los botones con `aria-label`, inputs numéricos con role=spinbutton, soporte teclado para toolbar (flechas navegan)
- El backend define el formato de serialización del `DocumentModel` — coordinar con el equipo Python antes de fijarlo
