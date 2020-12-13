const fs = require('fs')
const cheerio = require('cheerio')
const xlsx = require('../utils/node-xlsx-c')
const request = require('../utils/http_req')

let cookies = ''
let fileName = ''
const goodsPageUrl =
  'https://mpm.suning.com/mpms-web/sp/operateshopcoupon/goPromotionSummaryPage.do'
const goodsDetailUrl =
  'https://mpm.suning.com/mpms-web/sp/operateshopcoupon/goDetailEditPage.do'

const utils = {
  // 爬取商品主函数
  async getGoodsInfo(c, f, sTime, eTime) {
    cookies = c
    fileName = f
    // 商品数量总页数
    let pages = await this.getPages(sTime, eTime)
    console.log('pages', pages)

    let currentPage = 1
    while (currentPage < pages + 1) {
      // 本页商品数量
      let currentPageGoodsInfo = await this.getCurrentPageGoodsId(
        sTime,
        eTime,
        currentPage
      )

      // 开始获取本页商品详情
      currentPageGoodsInfo.forEach(async item => {
        await this.getGoodsDetail(item, true)
      })

      console.log('爬取页数===>', currentPage)
      console.log('当前页商品信息===>', currentPageGoodsInfo)

      currentPage++
    }
  },

  // 获取需要爬取的总页数
  async getPages(sTime, eTime) {
    // 请求配置信息
    const reqOpt = {
      method: 'POST',
      url: goodsPageUrl,
      headers: {
        Cookie: cookies
      },
      form: {
        //参数，注意get和post的参数设置不一样
        startTime: sTime,
        endTime: eTime
      }
    }
    // 获取需要爬取总页数
    let body = await request(reqOpt)
    const $ = cheerio.load(body)
    let snPages = Number($('.snPages .next').prev('a').text())

    console.log('爬取总页数===>', snPages)
    return snPages
  },

  // 获取当前页商品ID信息
  async getCurrentPageGoodsId(sTime, eTime, currentPage) {
    // 请求配置信息
    const reqOpt = {
      method: 'POST',
      url: goodsPageUrl,
      headers: {
        Cookie: cookies
      },
      form: {
        //参数，注意get和post的参数设置不一样
        page: currentPage,
        startTime: sTime,
        endTime: eTime
      }
    }

    let body = await request(reqOpt)
    const $ = cheerio.load(body)
    let tableData = $('.table tbody tr')
    let goodsInfo = []
    tableData.each((index, item) => {
      // 商品编号
      let goodsItemNo = $($(item).find('td')[0]).find('a').attr('ac')
      console.log('=====', goodsItemNo)
      // 券有效期
      let goodsItemTime = $($(item).find('td')[1]).text().replace(/\s+/g, '')
      // 门槛（满减）
      let goodsFd = $($(item).find('td')[2])
        .html()
        .split('<br>')[1]
        .split(';')[1]
        .split('&')[0]
      goodsInfo.push({ goodsItemNo, goodsItemTime, goodsFd })
    })

    return goodsInfo
  },

  // 获取商品详细信息
  async getGoodsDetail(goodsInfo) {
    const reqOpt = {
      url: `${goodsDetailUrl}?activityCode=${goodsInfo.goodsItemNo}`,
      headers: {
        Cookie: cookies
      }
    }

    let body = await request(reqOpt)
    const $ = cheerio.load(body)

    let a = '' // 用券量
    let b = '' // 面值
    let c = '' // 消耗金额
    let d = '' // 领取量
    let e = '' // 活动名称
    let f = '' // 领券时间
    let g = '' // 展示区域
    let h = '' // 发行量
    let i = '' // 每日发放张数
    let j = '' // 领券对象
    let k = goodsInfo.goodsItemTime // 券有效期
    let l = String(goodsInfo.goodsItemNo) // 活动编码
    let m = goodsInfo.goodsFd // 门槛（满减）

    // 活动专享券详情
    $($('.active-detail').find('li')[3]).each((index, item) => {
      $(item)
        .find('i')
        .each((index, item) => {
          if (index === 1) {
            d = $(item).text().replace(/[^\d]/g, '')
          }

          if (index === 2) {
            a = $(item).text().replace(/[^\d]/g, '')
          }
        })
    })

    $('.infoTable')
      .find('tbody')
      .find('tr')
      .each((index, item) => {
        if (index === 0) {
          $(item)
            .find('td')
            .each((index, item) => {
              if (index === 1) {
                e = $(item).text()
              }
            })
        }

        if (index === 3) {
          $(item)
            .find('td')
            .each((index, item) => {
              if (index === 1) {
                g = $(item)
                  .find('span')
                  .text()
                  .replace(/[^\u4e00-\u9fa5]/gi, '')
              }
            })
        }
      })

    $($('.infoTable')[1])
      .find('tbody')
      .find('tr')
      .each((index, item) => {
        if (index === 0) {
          $(item)
            .find('td')
            .each((index, item) => {
              if (index === 1) {
                f = $(item).find('span').text()
              }
            })
        }
        if (index === 2) {
          $(item)
            .find('td')
            .each((index, item) => {
              if (index === 1) {
                b = $(item)
                  .find('span')
                  .text()
                  .replace(/[^0-9]/gi, '')
              }
            })
        }
        if (index === 4) {
          $(item)
            .find('td')
            .each((index, item) => {
              if (index === 1) {
                h = $(item).find('span').text()
              }
            })
        }
      })

    a = Number(a)
    b = Number(b)
    c = a * b
    d = Number(d)
    m = Number(m)

    // 插入数据
    this.appendDataToJson([a, b, m, c, d, e, f, g, h, i, j, k, l])
  },

  // 插入JSON数据
  appendDataToJson(data) {
    console.log('插入项===>', data)
    fs.appendFile(
      `../data/${fileName}.json`,
      `${JSON.stringify(data)},\n`,
      () => {}
    )
  },

  // 生成表格
  async toXlsx(data) {
    return new Promise((resolve, reject) => {
      fs.readFile(`../data/${data.fileName}.json`, 'utf-8', (err, data) => {
        if (err) throw err

        data = String(data).substring(0, data.lastIndexOf(','))
        let jsonData = JSON.parse(`[${data}]`)
        jsonData.unshift([
          '用券量',
          '面值',
          '门槛',
          '消耗金额',
          '领取量',
          '活动名称',
          '领券时间',
          '展示区域',
          '发行量',
          '每日发放张数',
          '领券对象',
          '券有效期',
          '活动编码'
        ])

        const options = {
          '!cols': [
            { wpx: 70 },
            { wpx: 70 },
            { wpx: 70 },
            { wpx: 70 },
            { wpx: 70 },
            { wpx: 130 },
            { wpx: 130 },
            { wpx: 130 },
            { wpx: 70 },
            { wpx: 70 },
            { wpx: 70 },
            { wpx: 130 },
            { wpx: 190 }
          ],
          '!rows': [
            { hpx: 13.2 },
            { hpx: 13.2 },
            { hpx: 13.2 },
            { hpx: 13.2 },
            { hpx: 13.2 },
            { hpx: 13.2 },
            { hpx: 13.2 },
            { hpx: 13.2 },
            { hpx: 13.2 },
            { hpx: 13.2 },
            { hpx: 13.2 },
            { hpx: 13.2 },
            { hpx: 13.2 }
          ]
        }
        var buffer = xlsx.build(
          [{ name: '数据项', data: this.toXlsxStyle(jsonData) }],
          options
        )

        // fs.writeFile(`data/${fileName}.xlsx`, buffer, (err, data) => {})
        resolve(buffer)
      })

      // 读取之后删除文件
      fs.unlink(`../data/${data.fileName}.json`, () => {})
    })
  },

  // 表格样式设置
  toXlsxStyle(data) {
    // 指定标题单元格样式：加粗居中
    let headerStyle = {
      font: {
        name: '微软雅黑',
        sz: 9
      },
      alignment: {
        horizontal: 'center',
        vertical: 'center'
      },
      fill: {
        fgColor: { rgb: 'BFBFBF' }
      },
      border: {
        //单元格外侧框线
        top: {
          style: 'thin'
        },
        bottom: {
          style: 'thin'
        },
        left: {
          style: 'thin'
        },
        right: {
          style: 'thin'
        }
      }
    }

    let cellStyleCenter = {
      font: {
        name: '微软雅黑',
        sz: 9
      },
      alignment: {
        horizontal: 'center',
        vertical: 'center'
      },
      border: {
        //单元格外侧框线
        top: {
          style: 'thin'
        },
        bottom: {
          style: 'thin'
        },
        left: {
          style: 'thin'
        },
        right: {
          style: 'thin'
        }
      }
    }

    let cellStyleLeft = {
      font: {
        name: '微软雅黑',
        sz: 9
      },
      alignment: {
        horizontal: 'left',
        vertical: 'center'
      },
      border: {
        //单元格外侧框线
        top: {
          style: 'thin'
        },
        bottom: {
          style: 'thin'
        },
        left: {
          style: 'thin'
        },
        right: {
          style: 'thin'
        }
      }
    }

    let fromatData = data.map((items, _index) => {
      return items.map((item, index) => {
        if (_index === 0) {
          return {
            v: item,
            s: headerStyle
          }
        } else {
          if (
            index === 5 ||
            index === 6 ||
            index === 7 ||
            index === 11 ||
            index === 12
          ) {
            return {
              v: item,
              s: cellStyleLeft
            }
          } else {
            return {
              v: item,
              s: cellStyleCenter
            }
          }
        }
      })
    })

    return fromatData
  }
}

module.exports = utils
