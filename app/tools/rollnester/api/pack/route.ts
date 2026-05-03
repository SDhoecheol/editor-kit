import { NextResponse } from 'next/server';
import { packItems, PackItem } from '../../_lib/NestingEngine';

export async function POST(req: Request) {
  try {
    const { itemsToPack, effectiveMaxWidth, gutter } = await req.json();
    
    if (!itemsToPack || effectiveMaxWidth == null || gutter == null) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const result = packItems(itemsToPack, effectiveMaxWidth, gutter);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Nesting Engine API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to pack items' }, { status: 500 });
  }
}
