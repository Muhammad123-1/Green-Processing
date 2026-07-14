const fs = require('fs');
const path = require('path');

const roles = [
  { path: 'director', title: 'Direktor Paneli' },
  { path: 'technology', title: 'Texnologiya Bo\'limi' },
  { path: 'production', title: 'Ishlab Chiqarish' },
  { path: 'logistics', title: 'Logistika' },
  { path: 'warehouse', title: 'Sklad' },
  { path: 'accounting', title: 'Buxgalteriya' },
  { path: 'supply', title: 'Ta\'minot' },
  { path: 'hr', title: 'Kadrlar' },
  { path: 'security', title: 'Xavfsizlik Xizmati' },
];

const template = (title) => `'use client'

import { Construction } from 'lucide-react'

export default function PlaceholderPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] animate-enter">
      <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
        <Construction size={40} className="text-blue-400" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">${title}</h1>
      <p className="text-slate-400 text-center max-w-md">
        Ushbu bo'lim hozirda ishlab chiqilmoqda. Tizim to'liq ishga tushganda bu yerda sizning rolingizga mos statistikalar va boshqaruv paneli bo'ladi.
      </p>
    </div>
  )
}
`;

roles.forEach(role => {
  const dirPath = path.join(__dirname, 'src', 'app', '(dashboard)', role.path);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(path.join(dirPath, 'page.tsx'), template(role.title));
});

console.log('Placeholder pages created successfully.');
