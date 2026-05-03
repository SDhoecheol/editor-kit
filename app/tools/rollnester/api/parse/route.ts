import { NextResponse } from 'next/server';
import { parsePdfDimensions } from '../../_lib/PdfProcessor';

// Vercel 서버리스 타임아웃 방지 및 Body Size Limit
export const maxDuration = 30; // 30초 제한

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    
    // PdfProcessor 내부에서 Magic Number, 파일 크기(20MB), 최대 페이지(50p) 검증이 실행됨
    const dimensions = await parsePdfDimensions(buffer);

    return NextResponse.json({ dimensions });
  } catch (error: any) {
    console.error('PDF Parse API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse PDF' }, { status: 500 });
  }
}
