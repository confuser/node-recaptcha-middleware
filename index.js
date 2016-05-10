var request = require('request')

module.exports = function (publicKey, secretKey) {
  if (!publicKey) throw new Error('Missing public recaptcha key')
  if (!secretKey) throw new Error('Missing secret recaptcha key')

  function recaptchaVerify(req, res, next) {
      var response

    // Flexible, allow query string or post body
    if (req.body && req.body['g-recaptcha-response']) {
      response = req.body['g-recaptcha-response']
    } else if (req.query && req.query['g-recaptcha-response']) {
      response = req.query['g-recaptcha-response']
    }

    if (!response) return next(new Error('Missing g-recaptcha-response field'))

    var data =
        { secret: secretKey
        , response: response
        }
      , opts =
        { url: 'https://www.google.com/recaptcha/api/siteverify'
        , method: 'post'
        , form: data
        }

    if (req.ip) data.remoteip = req.ip

    request(opts, function (error, res) {
      if (error) return next(error)
      if (!res.body) return next(new Error('Missing body response from recaptcha'))

      var body

      try {
        body = JSON.parse(res.body)
      } catch (e) {
        return next(e)
      }

      if (body.success) return next()

      var errors = body['error-codes']

      if (!errors || errors.length === 0) return next(new Error('Recaptcha not successful but no error codes provided'))

      next(new Error(errors.join(', ')))
    })
  }

  return recaptchaVerify
}
