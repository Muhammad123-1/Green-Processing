import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const roles = [
      { username: 'director', name: 'Direktor', role: 'DIRECTOR' },
      { username: 'quality', name: 'Bosh Sifat Nazorati', role: 'QUALITY_CONTROL' },
      { username: 'inspector', name: 'Sex Nazoratchisi', role: 'INSPECTOR' },
      { username: 'tech', name: 'Texnolog', role: 'TECHNOLOGY' },
      { username: 'production', name: 'Ishlab Chiqarish', role: 'PRODUCTION' },
      { username: 'kitchen', name: 'Oshxona', role: 'KITCHEN' },
      { username: 'logistics', name: 'Logistika', role: 'LOGISTICS' },
      { username: 'warehouse', name: 'Sklad', role: 'WAREHOUSE' },
      { username: 'accounting', name: 'Buxgalteriya', role: 'ACCOUNTING' },
      { username: 'supply', name: 'Ta\'minot', role: 'SUPPLY' },
      { username: 'hr', name: 'Kadrlar', role: 'HR' },
      { username: 'security', name: 'Xavfsizlik', role: 'SECURITY' },
    ]

    for (const roleUser of roles) {
      await prisma.user.upsert({
        where: { username: roleUser.username },
        update: {},
        create: {
          name: roleUser.name,
          username: roleUser.username,
          password: '123',
          role: roleUser.role,
          isActive: true,
        },
      })
    }
    
    return NextResponse.json({ success: true, count: roles.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
