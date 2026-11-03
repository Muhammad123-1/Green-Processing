import { redirect } from 'next/navigation'

export const metadata = {
  title: "Omborxona (WMS) | Green Processing ERP",
  description: "Ombor kirim, chiqim, tayyor mahsulot va qoldiqlar"
}

export default function RawMovementPage() {
  redirect('/warehouse')
}
