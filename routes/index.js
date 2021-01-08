const router = require('koa-router')()
const controller = require('../controller')

router.post('/v1/crawlData', async (ctx, next) => {
  let params = ctx.request.body
  // 登录cookie
  let cookie = params.cookies
  // 生成文件名
  let fileName = params.fileName
  // 爬取开始时间
  let startTime = params.time[0]
  // 爬取结束时间
  let endTime = params.time[1]

  // 店铺优惠券
  controller.getshopCoupons(cookie, fileName, startTime, endTime)
  // 活动优惠券
  controller.geteventCoupons(cookie, fileName, startTime, endTime)

  ctx.body = {
    code: 200,
    msg: '请求成功'
  }
})

router.get('/v1/toXlsx', async (ctx, next) => {
  let params = ctx.query
  let buffer = await controller.toXlsx(params)
  ctx.body = buffer
})

module.exports = router
