
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Helper function to check for admin role
async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === 'ADMIN';
}

// GET /api/admin/courses - Get all courses (including unpublished)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const courses = await prisma.course.findMany({
      include: {
        category: true,
        user: {
          select: { username: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error('[ADMIN_COURSES_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PATCH /api/admin/courses - Update a course (admin only)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id, ...values } = await req.json(); // Course ID and fields to update

    if (!id) {
      return new NextResponse('Course ID is required', { status: 400 });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: id },
      data: { ...values },
    });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error('[ADMIN_COURSES_PATCH]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/admin/courses - Delete a course (admin only)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await req.json(); // Course ID to delete

    if (!id) {
      return new NextResponse('Course ID is required', { status: 400 });
    }

    await prisma.course.delete({
      where: { id: id },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error('[ADMIN_COURSES_DELETE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
