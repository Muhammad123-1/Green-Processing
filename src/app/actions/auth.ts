'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

const COOKIE_NAME = 'gp_session'

export async function login(prevState: any, formData: FormData) {
  let username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'Username va parolni kiriting' }
  }
  
  username = username.trim()

  // In a real app, you'd use bcrypt for passwords. 
  // We check plain text or simply match for now in this offline app.
  let user = await prisma.user.findUnique({
    where: { username }
  })

  // Auto-provision default role users if they don't exist yet
  const defaultRolesMap: Record<string, { name: string; role: string }> = {
    director: { name: 'Direktor', role: 'DIRECTOR' },
    admin: { name: 'Tizim Administratori', role: 'ADMIN' },
    quality: { name: 'Bosh Sifat Nazorati', role: 'QUALITY_CONTROL' },
    inspector: { name: 'Sex Nazoratchisi', role: 'INSPECTOR' },
    production: { name: 'Ishlab Chiqarish', role: 'PRODUCTION' },
    tech: { name: 'Texnolog', role: 'TECHNOLOGY' },
    warehouse: { name: 'Ombor (Sklad)', role: 'WAREHOUSE' },
    supply: { name: "Ta'minot", role: 'SUPPLY' },
    accounting: { name: 'Buxgalteriya', role: 'ACCOUNTING' },
    hr: { name: 'Kadrlar (HR)', role: 'HR' },
    kitchen: { name: 'Oshxona (Bosh Oshpaz)', role: 'KITCHEN' },
    security: { name: 'Xavfsizlik Xizmati', role: 'SECURITY' },
  }

  const lowerUsername = username.toLowerCase()
  if (!user && defaultRolesMap[lowerUsername] && password === '123') {
    try {
      user = await prisma.user.create({
        data: {
          name: defaultRolesMap[lowerUsername].name,
          username: lowerUsername,
          password: '123',
          role: defaultRolesMap[lowerUsername].role,
          isActive: true,
        }
      })
    } catch (createErr) {
      console.warn('Auto-provision user failed, checking if created concurrently:', createErr)
      user = await prisma.user.findUnique({ where: { username: lowerUsername } })
    }
  }

  if (!user || user.password !== password) {
    return { error: "Username yoki parol noto'g'ri" }
  }

  if (!user.isActive) {
    return { error: "Ushbu akkaunt faol emas" }
  }

  // Set session cookie
  const sessionData = JSON.stringify({ id: user.id, role: user.role, name: user.name })
  // Using next/headers cookies
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, Buffer.from(sessionData).toString('base64'), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  })

  // Redirect based on role
  let redirectUrl = '/dashboard'
  switch (user.role) {
    case 'DIRECTOR': redirectUrl = '/director'; break;
    case 'QUALITY_CONTROL': redirectUrl = '/dashboard'; break;
    case 'INSPECTOR': redirectUrl = '/inspector'; break;
    case 'TECHNOLOGY': redirectUrl = '/technology'; break;
    case 'PRODUCTION': redirectUrl = '/production'; break;
    case 'KITCHEN': redirectUrl = '/kitchen'; break;
    case 'LOGISTICS': redirectUrl = '/logistics'; break;
    case 'WAREHOUSE': redirectUrl = '/warehouse'; break;
    case 'ACCOUNTING': redirectUrl = '/accounting'; break;
    case 'SUPPLY': redirectUrl = '/supply'; break;
    case 'HR': redirectUrl = '/hr'; break;
    case 'SECURITY': redirectUrl = '/security'; break;
    case 'ADMIN': redirectUrl = '/dashboard'; break;
  }

  redirect(redirectUrl)
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  redirect('/login')
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(COOKIE_NAME)
  if (!sessionCookie?.value) return null

  try {
    const data = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'))
    return data as { id: number; role: string; name: string }
  } catch {
    return null
  }
}
