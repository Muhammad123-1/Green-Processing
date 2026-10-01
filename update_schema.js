const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
const models = ['FsscQcLog', 'DisinfectionLog', 'CalibrationLog', 'DegustationLog', 'ProcessQCLog', 'ReceivingLog'];
models.forEach(model => {
  const regex = new RegExp('(model ' + model + ' \\{[^}]+?)(\\})', 'g');
  schema = schema.replace(regex, '$1  updatedBy       String?\n$2');
});
fs.writeFileSync('prisma/schema.prisma', schema);
