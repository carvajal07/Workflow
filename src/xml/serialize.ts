import type {
  CircleEl,
  DataFieldEl,
  DocumentModel,
  ElementModel,
  ImageEl,
  LineEl,
  Page,
  PenEl,
  QrEl,
  RectEl,
  TableEl,
  TextEl,
} from '@/types/document';
import { mmToMeters } from '@/utils/units';

/**
 * Serializa un DocumentModel al XML simplificado del backend (proyectoPDF).
 * Referencia: `Scheme_Simplified.xml` en `carvajal07/proyectoPDF`.
 *
 * Reglas de mapeo:
 * - Todas las coordenadas y tamaños se convierten de mm → metros.
 * - Rect/Circle/Line/Pen → `PathObject` con `Path` (MoveTo/LineTo/BezierTo/ClosePath).
 * - Text/DataField → `FlowArea` + `Flow` con `P`/`T`/`O`.
 * - Image           → `ImageObject` + asset `Image`.
 * - QR              → `Barcode` con `BarcodeGenerator Type=QR`.
 * - Table           → `Table` + `RowSet` + `Cell` (stub mínimo).
 */
export function serializeToXml(doc: DocumentModel): string {
  const b: string[] = [];
  b.push('<?xml version="1.0" encoding="UTF-8"?>');
  b.push('<WorkFlow>');
  b.push('  <Layout>');
  b.push('    <Id>Layout1</Id>');
  b.push(`    <Name>${esc(doc.name)}</Name>`);
  b.push('    <Layout>');

  // ---- Pages (jerarquía + config) ----
  doc.pages.forEach((page, i) => {
    b.push('      <Page>');
    b.push(`        <Id>${esc(page.id)}</Id>`);
    b.push(`        <Name>${esc(page.name)}</Name>`);
    b.push('        <ParentId>Def.Pages</ParentId>');
    b.push(`        <IndexInParent>${i}</IndexInParent>`);
    b.push('      </Page>');

    b.push('      <Page>');
    b.push(`        <Id>${esc(page.id)}</Id>`);
    b.push('        <ConditionType>Simple</ConditionType>');
    b.push(`        <Width>${m(page.size.width)}</Width>`);
    b.push(`        <Height>${m(page.size.height)}</Height>`);
    b.push('        <NextPageId/>');
    b.push('      </Page>');
  });

  // ---- Elementos de cada página ----
  doc.pages.forEach((page) => {
    page.elements.forEach((el, idx) => serializeElement(b, el, page, idx));
  });

  // ---- Assets mínimos ----
  b.push('      <Font>');
  b.push('        <Id Name="Inter">Def.Font</Id>');
  b.push('        <Name>Inter</Name>');
  b.push('        <FontName>Inter</FontName>');
  b.push('        <SubFont Name="Regular">');
  b.push('          <FontLocation>vcs://Produccion/Fonts/Inter-Regular.ttf</FontLocation>');
  b.push('        </SubFont>');
  b.push('      </Font>');

  b.push('      <Color>');
  b.push('        <Id Name="Black">Def.Color</Id>');
  b.push('        <RGB>0,0,0</RGB>');
  b.push('      </Color>');

  b.push('    </Layout>');
  b.push('  </Layout>');
  b.push('</WorkFlow>');
  return b.join('\n');
}

// ---- helpers ----

function esc(s: string | number): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** mm → metros con 12 decimales (formato del XML backend). */
function m(mm: number): string {
  return mmToMeters(mm).toFixed(12);
}

function posSize(b: string[], el: { x: number; y: number; width: number; height: number }) {
  b.push(`        <Pos X="${m(el.x)}" Y="${m(el.y)}"/>`);
  b.push(`        <Size X="${m(el.width)}" Y="${m(el.height)}"/>`);
}

function parentHeader(
  b: string[],
  tag: string,
  id: string,
  name: string,
  parentId: string,
  idx: number,
) {
  b.push(`      <${tag}>`);
  b.push(`        <Id>${esc(id)}</Id>`);
  b.push(`        <Name>${esc(name)}</Name>`);
  b.push(`        <ParentId>${esc(parentId)}</ParentId>`);
  b.push(`        <IndexInParent>${idx}</IndexInParent>`);
  b.push(`      </${tag}>`);
}

// ---- mapeo por tipo ----

function serializeElement(b: string[], el: ElementModel, page: Page, idx: number): void {
  switch (el.type) {
    case 'rect':
    case 'circle':
    case 'line':
    case 'pen':
      return pathObject(b, el, page, idx);
    case 'text':
    case 'dataField':
      return flowArea(b, el, page, idx);
    case 'image':
      return imageObject(b, el, page, idx);
    case 'qr':
      return barcodeObject(b, el, page, idx);
    case 'table':
      return tableObject(b, el, page, idx);
  }
}

function pathObject(
  b: string[],
  el: RectEl | CircleEl | LineEl | PenEl,
  page: Page,
  idx: number,
) {
  parentHeader(b, 'PathObject', el.id, el.name ?? el.type, page.id, idx);
  b.push('      <PathObject>');
  b.push(`        <Id>${esc(el.id)}</Id>`);
  posSize(b, el);
  b.push('        <Scale X="1" Y="1"/>');
  b.push('        <Path>');
  if (el.type === 'rect') {
    b.push(`          <MoveTo X="0" Y="0"/>`);
    b.push(`          <LineTo X="${m(el.width)}" Y="0"/>`);
    b.push(`          <LineTo X="${m(el.width)}" Y="${m(el.height)}"/>`);
    b.push(`          <LineTo X="0" Y="${m(el.height)}"/>`);
    b.push('          <ClosePath/>');
  } else if (el.type === 'circle') {
    // aproximación con 4 beziers (k = 0.5522847498)
    const rx = el.width / 2;
    const ry = el.height / 2;
    const k = 0.5522847498;
    b.push(`          <MoveTo X="${m(0)}" Y="${m(ry)}"/>`);
    b.push(
      `          <BezierTo X1="${m(0)}" Y1="${m(ry - ry * k)}" X2="${m(rx - rx * k)}" Y2="${m(0)}" X="${m(rx)}" Y="${m(0)}"/>`,
    );
    b.push(
      `          <BezierTo X1="${m(rx + rx * k)}" Y1="${m(0)}" X2="${m(el.width)}" Y2="${m(ry - ry * k)}" X="${m(el.width)}" Y="${m(ry)}"/>`,
    );
    b.push(
      `          <BezierTo X1="${m(el.width)}" Y1="${m(ry + ry * k)}" X2="${m(rx + rx * k)}" Y2="${m(el.height)}" X="${m(rx)}" Y="${m(el.height)}"/>`,
    );
    b.push(
      `          <BezierTo X1="${m(rx - rx * k)}" Y1="${m(el.height)}" X2="${m(0)}" Y2="${m(ry + ry * k)}" X="${m(0)}" Y="${m(ry)}"/>`,
    );
    b.push('          <ClosePath/>');
  } else if (el.type === 'line') {
    const pts = el.points;
    for (let i = 0; i < pts.length; i += 2) {
      const tag = i === 0 ? 'MoveTo' : 'LineTo';
      b.push(`          <${tag} X="${m(pts[i])}" Y="${m(pts[i + 1])}"/>`);
    }
  } else {
    // pen: secuencia de puntos como LineTo
    const pts = el.points;
    for (let i = 0; i < pts.length; i += 2) {
      const tag = i === 0 ? 'MoveTo' : 'LineTo';
      b.push(`          <${tag} X="${m(pts[i])}" Y="${m(pts[i + 1])}"/>`);
    }
  }
  b.push('        </Path>');
  if ('fill' in el) b.push(`        <Fill>${esc(el.fill)}</Fill>`);
  b.push(`        <Stroke>${esc(el.stroke)}</Stroke>`);
  b.push(`        <StrokeWidth>${el.strokeWidth}</StrokeWidth>`);
  b.push('      </PathObject>');
}

function flowArea(b: string[], el: TextEl | DataFieldEl, page: Page, idx: number) {
  const flowId = `${el.id}_flow`;
  parentHeader(b, 'FlowArea', el.id, el.name ?? 'Text', page.id, idx);
  b.push('      <FlowArea>');
  b.push(`        <Id>${esc(el.id)}</Id>`);
  posSize(b, el);
  b.push(`        <FlowId>${esc(flowId)}</FlowId>`);
  b.push('        <BorderStyleId/>');
  b.push('        <FlowingToNextPage>False</FlowingToNextPage>');
  if (el.type === 'text') {
    b.push(`        <FontFamily>${esc(el.fontFamily)}</FontFamily>`);
    b.push(`        <FontSize>${el.fontSize}</FontSize>`);
    b.push(`        <FontWeight>${el.fontWeight}</FontWeight>`);
    b.push(`        <FontStyle>${esc(el.fontStyle)}</FontStyle>`);
    b.push(`        <TextColor>${esc(el.color)}</TextColor>`);
    b.push(`        <LineHeight>${el.lineHeight}</LineHeight>`);
    b.push(`        <Align>${esc(el.align)}</Align>`);
  }
  b.push('      </FlowArea>');

  b.push('      <Flow>');
  b.push(`        <Id>${esc(flowId)}</Id>`);
  b.push('        <Type>Simple</Type>');
  b.push('        <FlowContent>');
  b.push('          <P Id="Def.ParaStyle">');
  if (el.type === 'text') {
    b.push(`            <T Id="Def.TextStyle">${esc(el.text)}</T>`);
  } else {
    b.push(`            <T Id="Def.TextStyle">${esc(el.fallback)}<O Id="${esc(el.binding)}"/></T>`);
  }
  b.push('          </P>');
  b.push('        </FlowContent>');
  b.push('      </Flow>');
}

function imageObject(b: string[], el: ImageEl, page: Page, idx: number) {
  const assetId = `${el.id}_img`;
  parentHeader(b, 'Image', assetId, el.name ?? 'Image', 'Def.ImagesGroup', idx);
  b.push('      <Image>');
  b.push(`        <Id>${esc(assetId)}</Id>`);
  b.push('        <ImageType>Simple</ImageType>');
  b.push(`        <ImageLocation>${esc(el.src)}</ImageLocation>`);
  b.push('      </Image>');

  parentHeader(b, 'ImageObject', el.id, el.name ?? 'Image', page.id, idx);
  b.push('      <ImageObject>');
  b.push(`        <Id>${esc(el.id)}</Id>`);
  posSize(b, el);
  b.push(`        <ImageId>${esc(assetId)}</ImageId>`);
  b.push('      </ImageObject>');
}

function barcodeObject(b: string[], el: QrEl, page: Page, idx: number) {
  parentHeader(b, 'Barcode', el.id, el.name ?? 'QR', page.id, idx);
  b.push('      <Barcode>');
  b.push(`        <Id>${esc(el.id)}</Id>`);
  posSize(b, el);
  if (el.variable) b.push(`        <VariableId>${esc(el.variable)}</VariableId>`);
  b.push('        <FillStyleId>Def.BlackFill</FillStyleId>');
  b.push('        <BarcodeGenerator>');
  b.push('          <Type>QR</Type>');
  b.push(`          <ErrorLevel>${esc(el.errorLevel)}</ErrorLevel>`);
  b.push(`          <ModulWidth>${m(el.moduleSize)}</ModulWidth>`);
  b.push(`          <ModulSize>${m(el.moduleSize)}</ModulSize>`);
  b.push(`          <Height>${m(el.height)}</Height>`);
  b.push('        </BarcodeGenerator>');
  b.push('      </Barcode>');
}

function tableObject(b: string[], el: TableEl, page: Page, idx: number) {
  parentHeader(b, 'Table', el.id, el.name ?? 'Table', page.id, idx);
  b.push('      <Table>');
  b.push(`        <Id>${esc(el.id)}</Id>`);
  b.push('        <BordersType>MergeBorders</BordersType>');
  b.push(`        <HorizontalCellSpacing>${el.cellSpacing}</HorizontalCellSpacing>`);
  b.push(`        <VerticalCellSpacing>${el.cellSpacing}</VerticalCellSpacing>`);
  b.push('        <TableAlignment>Left</TableAlignment>');
  el.columns.forEach((c) => {
    b.push('        <ColumnWidths>');
    b.push(`          <MinWidth>${m(c.minWidth)}</MinWidth>`);
    b.push(`          <PercentWidth>${c.widthPercent}</PercentWidth>`);
    b.push('        </ColumnWidths>');
  });
  b.push(`        <RowSetId>${esc(el.id)}_rs</RowSetId>`);
  b.push('      </Table>');
}
