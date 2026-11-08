import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Xomashyo Kirimi (Приход) | Green Processing',
}

export default async function PrihodPage() {
  // The standalone arrival journal has been retired. Preserve old bookmarks
  // without exposing a duplicate data-entry page.
  redirect('/shop-report')
}
