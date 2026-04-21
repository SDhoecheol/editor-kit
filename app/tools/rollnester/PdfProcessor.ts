import { PDFDocument, rgb } from 'pdf-lib';
import type { PlacedItem } from './NestingEngine';

const PT_TO_MM = 25.4 / 72;
const MM_TO_PT = 72 / 25.4;

export type MarkOption = 'none' | 'corner' | 'crosshair';

/**
 * 업로드된 PDF 파일의 각 페이지 크기를 mm 단위로 추출하여 배열로 반환합니다.
 */
export async function parsePdfDimensions(fileBuffer: ArrayBuffer) {
  const pdfDoc = await PDFDocument.load(fileBuffer);
  const pages = pdfDoc.getPages();
  return pages.map(page => {
    const { width, height } = page.getSize();
    return {
      widthMm: width * PT_TO_MM,
      heightMm: height * PT_TO_MM,
    };
  });
}

/**
 * 조판된 데이터를 바탕으로 하나의 큰 롤 미디어 캔버스 PDF를 생성합니다.
 */
export async function generateNestedPdf(
  placedItems: PlacedItem[],
  fileBuffers: Record<string, ArrayBuffer>,
  totalWidthMm: number,
  totalHeightMm: number,
  markOption: MarkOption
): Promise<Uint8Array> {
  const finalPdf = await PDFDocument.create();
  
  // 돔보나 재단선을 그리기 위한 캔버스 외곽 마진 (mm)
  const marginMm = markOption === 'none' ? 0 : 15; 
  
  const canvasWidthPt = (totalWidthMm + marginMm * 2) * MM_TO_PT;
  const canvasHeightPt = (totalHeightMm + marginMm * 2) * MM_TO_PT;
  
  const page = finalPdf.addPage([canvasWidthPt, canvasHeightPt]);
  
  // 파일 캐싱 (동일한 파일은 한 번만 로드하여 자원 낭비 방지)
  const loadedPdfs: Record<string, PDFDocument> = {};
  for (const [id, buffer] of Object.entries(fileBuffers)) {
    loadedPdfs[id] = await PDFDocument.load(buffer);
  }

  for (const item of placedItems) {
    const srcPdf = loadedPdfs[item.fileId];
    if (!srcPdf) continue;
    
    // 다중 페이지 PDF인 경우를 대비해, 지정된 인덱스의 페이지를 임베드합니다.
    const [embeddedPage] = await finalPdf.embedPages([srcPdf.getPages()[item.pageIndex]]);
    
    // 좌표 변환: pdf-lib의 원점(0,0)은 좌측 하단, NestingEngine의 원점은 좌측 상단입니다.
    const xPt = (item.x + marginMm) * MM_TO_PT;
    const yPt = canvasHeightPt - (item.y + marginMm + item.height) * MM_TO_PT;
    const wPt = item.width * MM_TO_PT;
    const hPt = item.height * MM_TO_PT;
    
    page.drawPage(embeddedPage, {
      x: xPt,
      y: yPt,
      width: wPt,
      height: hPt,
    });
    
    // 마크 옵션에 따른 재단 가이드선 그리기
    if (markOption === 'corner') {
      drawCornerMarks(page, xPt, yPt, wPt, hPt);
    } else if (markOption === 'crosshair') {
      drawCrosshairMarks(page, xPt, yPt, wPt, hPt);
    }
  }

  return await finalPdf.save();
}

/**
 * L자형 코너 재단선을 그립니다.
 */
function drawCornerMarks(page: any, x: number, y: number, w: number, h: number) {
  const offset = 3 * MM_TO_PT; // 객체로부터 3mm 띄움
  const len = 5 * MM_TO_PT;    // 마크 길이 5mm
  const thickness = 0.5;
  const color = rgb(0, 0, 0);

  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
  };

  // 좌하단 (Bottom-Left)
  drawLine(x - offset, y, x - offset - len, y);
  drawLine(x, y - offset, x, y - offset - len);

  // 우하단 (Bottom-Right)
  drawLine(x + w + offset, y, x + w + offset + len, y);
  drawLine(x + w, y - offset, x + w, y - offset - len);

  // 좌상단 (Top-Left)
  drawLine(x - offset, y + h, x - offset - len, y + h);
  drawLine(x, y + h + offset, x, y + h + offset + len);

  // 우상단 (Top-Right)
  drawLine(x + w + offset, y + h, x + w + offset + len, y + h);
  drawLine(x + w, y + h + offset, x + w, y + h + offset + len);
}

/**
 * 십자(Crosshair) 돔보 마크를 그립니다. (커팅기 인식용)
 */
function drawCrosshairMarks(page: any, x: number, y: number, w: number, h: number) {
  const offset = 5 * MM_TO_PT; // 5mm 여백 밖으로 배치
  const len = 6 * MM_TO_PT;    // 십자선의 길이 6mm
  const thickness = 0.5;
  const color = rgb(0, 0, 0);

  const drawCross = (cx: number, cy: number) => {
    page.drawLine({ start: { x: cx - len/2, y: cy }, end: { x: cx + len/2, y: cy }, thickness, color });
    page.drawLine({ start: { x: cx, y: cy - len/2 }, end: { x: cx, y: cy + len/2 }, thickness, color });
  };

  // 4개 모서리 외곽에 십자 돔보 생성
  drawCross(x - offset, y - offset);
  drawCross(x + w + offset, y - offset);
  drawCross(x - offset, y + h + offset);
  drawCross(x + w + offset, y + h + offset);
}
