const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const path = require('path')
process.env.DATABASE_URL = 'file:' + path.join(__dirname, 'prisma', 'dev.db').replace(/\\/g, '/')

const dev = false
const app = next({ dev, dir: __dirname })
const handle = app.getRequestHandler()

const fs = require('fs')
const path = require('path')
process.on('uncaughtException', (err) => {
  fs.appendFileSync(path.join(require('os').homedir(), 'Desktop', 'crash.log'), new Date().toISOString() + ' ' + (err.stack || err) + '\n')
})
process.on('unhandledRejection', (reason) => {
  fs.appendFileSync(path.join(require('os').homedir(), 'Desktop', 'crash.log'), new Date().toISOString() + ' REJECTION: ' + String(reason) + '\n')
})

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(3000, (err) => {
    if (err) throw err
    console.log('> Oflayn server http://localhost:3000 da ishga tushdi')
  })
})
