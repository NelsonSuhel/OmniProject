import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adjust path as needed

export async function GET() {
  try {
    let visitRecord = await prisma.visit.findFirst();

    if (!visitRecord) {
      // If no record exists, create one
      visitRecord = await prisma.visit.create({
        data: { count: 0 },
      });
    }

    // Increment count
    const updatedVisitRecord = await prisma.visit.update({
      where: { id: visitRecord.id },
      data: { count: { increment: 1 } },
    });

    return NextResponse.json({ visits: updatedVisitRecord.count });
  } catch (error: unknown) {
    console.error('Error handling visit counter:', error);
    return NextResponse.json({ error: 'Failed to update visit counter' }, { status: 500 });
  }
}
