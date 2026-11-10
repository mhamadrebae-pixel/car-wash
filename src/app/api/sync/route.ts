import { NextResponse } from 'next/server';
import { readServerDatabase, writeServerDatabase } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SYNC_SECRET = 'carwash-local-sync-v1';

export async function GET(request: Request) {
  try {
    const data = readServerDatabase();
    const authHeader = request.headers.get('x-carwash-sync-key');
    const isAuthorized = authHeader === SYNC_SECRET;

    if (!isAuthorized && data.settings) {
      // Strip master PINs from unauthorized public / TV network requests
      const safeSettings = { ...data.settings };
      delete (safeSettings as any).adminPin;
      delete (safeSettings as any).staffPin;
      return NextResponse.json({
        success: true,
        data: {
          ...data,
          settings: safeSettings,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('x-carwash-sync-key');
    if (authHeader !== SYNC_SECRET) {
      return NextResponse.json(
        { success: false, error: 'دەسەڵاتی نوێکردنەوەی داتابەیس نییە (Unauthorized)' },
        { status: 401 }
      );
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid payload' },
        { status: 400 }
      );
    }

    const updated = writeServerDatabase(body);
    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
