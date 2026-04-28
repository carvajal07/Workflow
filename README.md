# Handoff: PDF Template Editor (pdfsketch)

## Overview
Aplicación web para el maquetado de archivos PDF con herramientas de arrastrar y soltar sobre un lienzo, formas, texto, imágenes, tablas, códigos QR y campos de datos dinámicos. Inspirado en editores tipo Inspire Designer / InDesign, enfocado a **plantillas reutilizables con datos variables** (facturas, extractos, certificados, etc.).

El usuario final es un usuario general (no diseñador pro) que necesita crear plantillas de PDF con un flujo simple y pocas opciones visibles a la vez.

## About the Design Files
Los archivos en este bundle son **referencias de diseño en HTML** — prototipos mostrando la estética y el comportamiento previsto, **no código de producción para copiar directamente**. La tarea del desarrollador es **recrear estos diseños** en el stack definido abajo usando sus patrones y librerías idiomáticas.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

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
│   │       ├── LeftPanel.tsx
│   │       └── LeftRail.tsx         # Toolbar vertical de herramientas
│   ├── features/
│   │   ├── canvas/
│   │   │   ├── Canvas.tsx           # <Stage> de Konva
│   │   │   ├── Rulers.tsx           # Reglas H/V en mm
│   │   │   ├── Sheet.tsx            # Hoja A4 con márgenes
│   │   │   ├── DraftOverlay.tsx
│   │   │   ├── ElementsLayer.tsx
│   │   │   ├── GuidesLayer.tsx
│   │   │   ├── PdfPreviewModal.tsx
│   │   │   ├── SelectionTransformer.tsx
│   │   │   ├── elements/
│   │   │   │   ├── TextElement.tsx
│   │   │   │   ├── RectElement.tsx
│   │   │   │   ├── CircleElement.tsx
│   │   │   │   ├── LineLikeElement.tsx
│   │   │   │   ├── ImageElement.tsx
│   │   │   │   ├── TableElement.tsx
│   │   │   │   ├── FlowableElement.tsx
│   │   │   │   ├── FrameElement.tsx
│   │   │   │   ├── QrElement.tsx
│   │   │   │   ├── useHtmlImage.ts
│   │   │   │   └── DataFieldElement.tsx
│   │   │   ├── TextEditorOverlay.tsx        # Handles y rotación
│   │   │   └── useCanvasDraw.ts      # Integración dnd-kit + Konva
│   │   ├── data/
│   │   │   ├── DataPanel.tsx 
│   │   ├── pages/
│   │   │   ├── PageSizePicker.tsx 
│   │   ├── propierties/
│   │   │   ├── props/
│   │   │   │   ├── DataFieldProps.ts
│   │   │   │   ├── FlowableProps.ts
│   │   │   │   ├── FrameProps.ts
│   │   │   │   ├── ImageProps.ts
│   │   │   │   ├── LineProps.ts
│   │   │   │   ├── QrProps.ts
│   │   │   │   ├── ShapeProps.ts
│   │   │   │   ├── TableProps.ts
│   │   │   │   └── TextProps.ts
│   │   │   ├── ElementProps.tsx 
│   │   │   ├── Inspector.tsx 
│   │   │   ├── PositionTab.tsx 
│   │   │   └── shared.tsx 
│   │   ├── styles/
│   │   │   ├── StyleEditorModal.tsx
│   │   │   ├── StylesPanel.tsx
│   │   ├── tree/
│   │   │   ├── LayoutTree.tsx       # react-arborist
│   │   ├── pages/                   # Gestión de páginas del documento
│   │   │   └── PageSizePicker.tsx
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
│   ├── utils/
│   │   ├── id.ts
│   │   ├── pageSizes.ts
│   │   ├── richText.ts
│   │   └── units.ts
│   ├── xml/
│   │   ├── deserialize.ts
│   │   └── serialize.ts
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
+### ✅ Funcionalidades implementadas
+
+- **Shell del editor funcional**: title/menu/toolbar/status bar, panel izquierdo con tabs y área de canvas.
+- **Canvas principal con Konva**:
+  - zoom (`Ctrl/Cmd + rueda`), pan (`Espacio + drag`), `fit` (`0`) y zoom 100% (`1`);
+  - selección, transformación y borrado (`Delete/Backspace`);
+  - overlay de edición de texto y guías/reglas;
+  - herramientas activas para crear/editar elementos gráficos y de contenido.
+- **Gestión de documento y páginas** (Zustand + zundo):
+  - documento inicial en mm;
+  - agregar/eliminar páginas;
+  - agregar/editar/eliminar elementos;
+  - historial undo/redo.
+- **Árbol de capas + inspector**:
+  - navegación por páginas/elementos;
+  - selección sincronizada con el canvas;
+  - renombrado inline.
+- **Panel de estilos**:
+  - catálogo de estilos (texto, párrafo, borde, línea, relleno);
+  - creación/edición;
+  - aplicación de estilos a selección.
+- **Panel de datos (JSON)**:
+  - carga de JSON local;
+  - árbol navegable de bindings;
+  - vinculación de campos existentes y creación de `dataField` desde el árbol o drag&drop al canvas.
+- **Entrada/salida**:
+  - importar XML;
+  - exportar XML compatible con `proyectoPDF`;
+  - modal de vista previa multipágina;
+  - cliente API listo para exportación PDF vía backend.

+### Próximos pasos recomendados
+
+1. Corregir los errores de tipado de `DataPanel.tsx` para restablecer `npm run build`.
+2. Definir e implementar el flujo final de exportación PDF con backend en entorno integrado.
+3. Añadir tests (unitarios/componentes) para stores, serialización XML y flujos críticos del editor.