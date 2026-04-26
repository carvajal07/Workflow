export type Unit = 'mm' | 'pt' | 'px';

export type ElementType =
  | 'text'
  | 'rect'
  | 'circle'
  | 'line'
  | 'pen'
  | 'image'
  | 'table'
  | 'qr'
  | 'dataField'
  | 'frame'
  | 'flowable';

export interface BaseEl {
  id: string;
  type: ElementType;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  layer?: string;
}

export interface TextEl extends BaseEl {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: 'normal' | 'italic';
  fontWeight: number;
  textDecoration?: 'underline' | 'line-through';
  align: 'left' | 'center' | 'right' | 'justify-left' | 'justify-center' | 'justify-right' | 'justify-block';
  lineHeight: number;
  color: string;
}

export interface RectEl extends BaseEl {
  type: 'rect';
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
}

export interface CircleEl extends BaseEl {
  type: 'circle';
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface LineEl extends BaseEl {
  type: 'line';
  points: number[];
  stroke: string;
  strokeWidth: number;
  dash?: number[];
}

export interface PenEl extends BaseEl {
  type: 'pen';
  points: number[];
  stroke: string;
  strokeWidth: number;
  tension: number;
}

export interface ImageEl extends BaseEl {
  type: 'image';
  src: string;
  opacity: number;
  cropX?: number;
  cropY?: number;
}

export interface TableColumn {
  widthPercent: number;
  minWidth: number;
}
export interface TableCell {
  text: string;
  align?: 'left' | 'center' | 'right';
}
export interface TableEl extends BaseEl {
  type: 'table';
  columns: TableColumn[];
  rows: TableCell[][];
  borderWidth: number;
  borderColor: string;
  cellSpacing: number;
}

export interface QrEl extends BaseEl {
  type: 'qr';
  data: string;
  variable?: string;
  errorLevel: 'L' | 'M' | 'Q' | 'H';
  moduleSize: number;
}

export interface DataFieldEl extends BaseEl {
  type: 'dataField';
  binding: string;
  fallback: string;
  fontFamily: string;
  fontSize: number;
  color: string;
}

export interface FrameEl extends BaseEl {
  type: 'frame';
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  padding: { top: number; right: number; bottom: number; left: number };
}

export interface FlowableEl extends BaseEl {
  type: 'flowable';
  frameId: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  flowType: 'content' | 'paragraph' | 'spacer' | 'table' | 'image';
}

export type ElementModel =
  | TextEl
  | RectEl
  | CircleEl
  | LineEl
  | PenEl
  | ImageEl
  | TableEl
  | QrEl
  | DataFieldEl
  | FrameEl
  | FlowableEl;

export interface Page {
  id: string;
  name: string;
  size: { width: number; height: number; unit: Unit };
  background: string;
  margin: { top: number; right: number; bottom: number; left: number };
  rotation: number;
  visible: boolean;
  weight: number;
  repeatedBy: 'Empty' | string;
  addHeight: number;
  elements: ElementModel[];
}

export interface Font {
  id: string;
  name: string;
  fontName: string;
  subFonts: { name: string; location: string }[];
}

export interface ColorToken {
  id: string;
  name: string;
  rgb: string;
}

export interface TextStyle {
  id: string;
  name: string;
  fontSize: number;
  fontId: string;
  subFont: string;
  fillStyleId: string;
  ancestorId?: string;
}

export interface ParagraphStyle {
  id: string;
  name: string;
  ancestorId?: string;
  leftIndent: number;
  rightIndent: number;
  firstLineLeftIndent: number;
  spaceBefore: number;
  spaceAfter: number;
  lineSpacing: number;
  widow: number;
  orphan: number;
  keepWithNext: boolean;
  keepLinesTogether: 'No' | 'Yes';
  dontWrap: boolean;
  hAlign: 'Left' | 'Center' | 'Right' | 'Justify';
}

export interface BorderStyle {
  id: string;
  name: string;
  colorId: string;
  lineWidth: number;
  cornerRadius: number;
}

export interface LineStyle {
  id: string;
  name: string;
  width: number;
  dash?: number[];
}

export interface FillStyle {
  id: string;
  name: string;
  colorId: string;
}

export interface ImageAsset {
  id: string;
  name: string;
  imageType: 'Simple' | 'Variable' | 'InlCond';
  imageLocation?: string;
  variableId?: string;
}

export interface TableDef {
  id: string;
  name: string;
  bordersType: string;
  horizontalCellSpacing: number;
  verticalCellSpacing: number;
  tableAlignment: 'Left' | 'Center' | 'Right';
  columnWidths: { percentWidth: number; minWidth: number }[];
  rowSetId: string;
}

export interface RowSet {
  id: string;
  name: string;
  rowSetType: 'Row' | 'RowSet' | 'InlCond';
  subRowIds: string[];
  minHeight: number;
  cellVerticalAlignment: 'Top' | 'Middle' | 'Bottom';
  borderId?: string;
}

export interface CellDef {
  id: string;
  name: string;
  flowId: string;
  borderId?: string;
}

export interface DataSources {
  variables: { id: string; name: string; defaultValue?: string }[];
  datasets: { id: string; name: string; rows: Record<string, unknown>[] }[];
}

export interface DynamicComm {
  id: string;
  name: string;
}
export interface Flow {
  id: string;
  name: string;
  type: 'Simple' | 'Variable' | 'InlCond';
  content: string;
}

export interface DocumentModel {
  id: string;
  name: string;
  unit: Unit;
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
  data: DataSources;
  dynamicComms: DynamicComm[];
  flows: Flow[];
  createdAt: string;
  updatedAt: string;
}
