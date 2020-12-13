const shopCoupons = require('./shop_coupons')
const eventCoupons = require('./event_coupons')

const utils = {
  // 店铺优惠券
  async getshopCoupons(cookies, fileName, sTime, eTime) {
    shopCoupons.getGoodsInfo(cookies, fileName, sTime, eTime)
  },

  // 活动优惠券
  async geteventCoupons(cookies, fileName, sTime, eTime) {
    eventCoupons.getGoodsInfo(cookies, fileName, sTime, eTime)
  },

  toXlsx(params) {
    return shopCoupons.toXlsx(params)
  }
}

module.exports = utils
