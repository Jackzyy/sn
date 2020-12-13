const Koa = require('koa')
const app = new Koa()
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const compress = require('koa-compress')

const index = require('./routes/index')
const middleware = require('./middlewares')
const openUrl = require('./utils/open_url')

// error handler
onerror(app)
const options = {
  threshold: 1024 //数据超过1kb时压缩
}
// openUrl('http://127.0.0.1:3001')

app
  // Gzip
  .use(compress(options))
  // 跨域
  .use(middleware.crossDomain)
  .use(
    bodyparser({
      enableTypes: ['json', 'form', 'text']
    })
  )
  .use(json())
  .use(logger())
  .use(require('koa-static')(__dirname + '/public'))

  // logger
  .use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
  })

  // routes
  .use(index.routes(), index.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
})

module.exports = app
