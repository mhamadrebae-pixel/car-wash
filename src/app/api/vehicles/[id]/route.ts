import { NextResponse } from 'next/server';
import { readServerDatabase, writeServerDatabase } from '@/lib/serverDb';
import { Vehicle } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await readServerDatabase();
    const searchId = id.toLowerCase().trim();

    const vehicle = db.vehicles.find(
      (v) =>
        v.id.toLowerCase() === searchId ||
        (v.nfcTagId && v.nfcTagId.toLowerCase() === searchId) ||
        (v.plate.type === 'unified' && v.plate.number && v.plate.number.toLowerCase() === searchId) ||
        (v.plate.type === 'old' && v.plate.oldNumber && v.plate.oldNumber.toLowerCase() === searchId)
    );

    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: 'سەیارەکە نەدۆزرایەوە' },
        { status: 404 }
      );
    }

    // Strip sensitive Master Admin PIN and Staff PIN before returning to public client
    const { adminPin, staffPin, ...safeSettings } = (db.settings || {}) as any;

    // Strip private customer PIN from the public vehicle payload
    const { customerPin, ...safeVehicle } = vehicle;

    return NextResponse.json({
      success: true,
      vehicle: safeVehicle,
      settings: safeSettings,
      services: db.services,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: any = await request.json();
    const db = await readServerDatabase();
    const searchId = id.toLowerCase().trim();

    const vehicle = db.vehicles.find(
      (v) =>
        v.id.toLowerCase() === searchId ||
        (v.nfcTagId && v.nfcTagId.toLowerCase() === searchId)
    );

    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: 'سەیارەکە نەدۆزرایەوە' },
        { status: 404 }
      );
    }

    // Secure Server-side Customer PIN Verification
    if (body.action === 'verify-customer-pin') {
      const targetPin = (vehicle.customerPin || (vehicle.phone ? vehicle.phone.slice(-4) : '1234')).trim();
      const enteredPin = (body.pin || '').toString().trim();
      const isMatch = enteredPin === targetPin;
      return NextResponse.json({ success: isMatch });
    }

    // Secure Server-side Staff PIN Verification
    if (body.action === 'verify-staff-pin') {
      const targetPin = (db.settings?.staffPin || '1234').trim();
      const enteredPin = (body.pin || '').toString().trim();
      const isMatch = enteredPin === targetPin;
      return NextResponse.json({ success: isMatch });
    }

    let found = false;
    const updatedVehicles = db.vehicles.map((v) => {
      if (
        v.id.toLowerCase() === searchId ||
        (v.nfcTagId && v.nfcTagId.toLowerCase() === searchId)
      ) {
        found = true;
        return {
          ...v,
          ...(body.vehicle || body),
        };
      }
      return v;
    });

    if (!found) {
      return NextResponse.json(
        { success: false, message: 'سەیارەکە نەدۆزرایەوە' },
        { status: 404 }
      );
    }

    await writeServerDatabase({ vehicles: updatedVehicles });

    return NextResponse.json({
      success: true,
      message: 'سەیارەکە بە سەرکەوتوویی نوێکرایەوە',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
