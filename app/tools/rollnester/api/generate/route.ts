import { NextResponse } from 'next/server';
import { generateNestedPdf, MarkOption } from '../../_lib/PdfProcessor';
import { PlacedItem } from '../../_lib/NestingEngine';

export const maxDuration = 60; // 최대 60초 (무거운 조판)

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const payloadStr = formData.get('payload') as string;
    
    if (!payloadStr) {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }

    const payload = JSON.parse(payloadStr);
    const { placedItems, totalWidthMm, totalHeightMm, markOption } = payload as {
      placedItems: PlacedItem[],
      totalWidthMm: number,
      totalHeightMm: number,
      markOption: MarkOption
    };

    const fileBuffers: Record<string, ArrayBuffer> = {};
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_')) {
        const fileId = key.replace('file_', '');
        const file = value as File;
        
        // 1. 서버 사이즈 제한 재검증
        if (file.size > 20 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large.`);
        }
        
        fileBuffers[fileId] = await file.arrayBuffer();
        
        // 2. Magic Number 재검증 (방어적 프로그래밍)
        const view = new Uint8Array(fileBuffers[fileId]);
        if (view.length < 5 || view[0] !== 0x25 || view[1] !== 0x50 || view[2] !== 0x44 || view[3] !== 0x46 || view[4] !== 0x2d) {
          throw new Error(`File ${file.name} is not a valid PDF.`);
        }
      }
    }

    // 서버로 오프로딩된 로직 실행
    const pdfBytes = await generateNestedPdf(placedItems, fileBuffers, totalWidthMm, totalHeightMm, markOption);

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="nested.pdf"',
      },
    });

  } catch (error: any) {
    console.error('PDF Generate API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate PDF' }, { status: 500 });
  }
}
