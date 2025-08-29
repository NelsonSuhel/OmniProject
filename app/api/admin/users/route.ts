
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

// GET /api/admin/users - Get all users
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('[ADMIN_USERS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/admin/users - Delete a user
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await req.json(); // User ID to delete

    if (!id) {
      return new NextResponse('User ID is required', { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (id === session.user.id) {
        return new NextResponse('Cannot delete your own admin account', { status: 400 });
    }

    await prisma.user.delete({
      where: { id: id },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error('[ADMIN_USERS_DELETE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
