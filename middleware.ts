import { NextResponse } from 'next/server';

export async function middleware() {
  // Middleware desativado temporariamente para estabilizar o build
  return NextResponse.next();
}

export const config = {};
