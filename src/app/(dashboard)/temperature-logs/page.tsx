import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Xomashyo Kirish Nazorati va Qabul Harorati Jurnali | Green Processing',
}

export default function TemperatureLogsPage() {
  redirect('/incoming-acts')
}
