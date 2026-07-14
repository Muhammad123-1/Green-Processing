'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

const COOKIE_NAME = 'gp_session'

export async function login(prevState: any, formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'Username va parolni kiriting' }
  }

  // In a real app, you'd use bcrypt for passwords. 
  // We check plain text or simply match for now in this offline app.
  const user = await prisma.user.findUnique({
    where: { username }
  })

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
    case 'TECHNOLOGY': redirectUrl = '/technology'; break;
    case 'PRODUCTION': redirectUrl = '/production'; break;
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
