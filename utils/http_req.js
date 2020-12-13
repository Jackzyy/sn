const request = require('request')

// 封装请求
module.exports = function httpRep(opts) {
  return new Promise((resolve, reject) => {
    request.post(opts, function (err, response, body) {
      if (body !== 'null') {
        resolve(body)
      } else {
        reject(null)
      }
    })
  })
}

