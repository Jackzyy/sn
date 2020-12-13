module.exports = class Middleware {
  // 跨域
  static async crossDomain(ctx, next) {
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild'
    )
    ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS')
    if (ctx.method == 'OPTIONS') {
      ctx.body = 200
    } else {
      await next()
    }
  }
}
