# pdfsketch · frontend

Editor web de plantillas PDF (React 18 + TypeScript + Vite + Konva). El estado del diseño se serializa al XML del backend (`proyectoPDF`) basado en `Scheme_Simplified.xml`.

> Este repo **solo** contiene el frontend. El backend vive en [`carvajal07/proyectoPDF`](https://github.com/carvajal07/proyectoPDF): Python + ReportLab + DynamoDB. El handoff de diseño completo está en `README.md` original (ver `docs/HANDOFF.md`) y la referencia hi-fi en `editor-hifi.html`.

## Requisitos

- Node.js ≥ 20
- npm ≥ 10

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Abre http://localhost:5173.

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor Vite con HMR |
| `npm run build` | Build de producción (`tsc -b && vite build`) |
| `npm run preview` | Preview del build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Stack

- **React 18 + TypeScript**, **Vite**, **TailwindCSS** (dark por defecto, light como tweak)
- **Konva.js + react-konva** para el lienzo
- **@dnd-kit/core** para drag & drop toolbar → canvas
- **Zustand + zundo** (estado + undo/redo)
- **react-resizable-panels**, **react-arborist**, **lucide-react**
- **react-hook-form + zod**
- **axios + @tanstack/react-query** para la API
- **pdf-lib** solo para preview cliente (export final lo hace el backend con ReportLab)

## XML compatible con el backend

El estado del documento se serializa a XML siguiendo `Scheme_Simplified.xml` del repo `proyectoPDF`:

- Coordenadas en **metros** (mm / 1000)
- Estructura `<WorkFlow><Layout><Layout>...</Layout></Layout></WorkFlow>`
- Elementos: `Page`, `FlowArea`, `Flow`, `Table`, `RowSet`, `Cell`, `Font`, `Color`, `ParaStyle`, `TextStyle`, `BorderStyle`, `Image`, `ImageObject`, `PathObject`, `Barcode`, `Chart`, `ElementObject`

Ver `src/xml/serialize.ts` y `src/xml/deserialize.ts`.

## Estructura

```
src/
├── app/                 # Shell (layout 5×3)
├── features/
│   ├── canvas/          # Konva Stage + elementos
│   ├── tree/            # LayoutTree (react-arborist)
│   ├── properties/      # Inspector + tabs
│   ├── pages/           # Panel de páginas
│   ├── history/         # Wrapper de zundo
│   └── export/          # Hook de exportación
├── store/               # Zustand stores
├── api/                 # Cliente HTTP
├── xml/                 # Serialización ↔ esquema backend
├── types/
├── styles/
└── main.tsx
```

## Atajos

- `V` seleccionar · `H` mano · `T` texto · `R` rect · `O` círculo · `L` línea · `P` lápiz · `I` imagen
- `⌘Z` / `⌘⇧Z` undo / redo
- `Ctrl+rueda` zoom · `Espacio+drag` pan · `0` fit · `1` 100 %
- `Supr` elimina selección

## Estado del proyecto

MVP 1 (shell + lienzo básico + rect) y base de MVP 2 están implementados. Ver issues para el resto.
