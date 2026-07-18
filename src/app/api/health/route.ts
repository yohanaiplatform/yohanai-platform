import { NextResponse } from 'next/server';
export async function GET() {
return NextResponse.json({
success: true,
message: 'Yohan.AI Backend Healthy',
version: '1.0.0',
timestamp: new Date().toISOString(),
});
}