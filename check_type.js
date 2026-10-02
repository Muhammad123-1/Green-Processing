const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.surveyQuestion.findFirst({where: {id: 156}}).then(d => {
  console.log('typeof d.options:', typeof d.options);
  console.log('d.options:', d.options);
  const parsed = JSON.parse(d.options);
  console.log('typeof parsed:', typeof parsed);
  console.log('Array.isArray(parsed):', Array.isArray(parsed));
}).catch(e => {
  console.error(e)
}).finally(() => {
  prisma.$disconnect();
});
