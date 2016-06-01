var request = require('request')
var defaultOptions =
  { errors:
    { validation: function () { return new Error('Missing g-recaptcha-response field') }
    , missingBody: function () { return new Error('Missing body response from recaptcha') }
    , missingError: function () { return new Error('Recaptcha not successful but no error codes provided') }
    , recaptchaErrorHandler: function (errors) {
        return new Error(errors.join(', '))
      }
    }
  }

module.exports = function (options) {
  if (!options.secretKey) throw new Error('Missing secret recaptcha key')

  if (options.errors) {
    Object.keys(defaultOptions.errors).forEach(function (errorName) {
      options.errors[errorName] = options.errors[errorName] || defaultOptions.errors[errorName]
    })
  } else {
    options.errors = defaultOptions.errors
  }

  function recaptchaVerify(req, res, next) {
      var response

    // Flexible, allow query string or post body
    if (req.body && req.body['g-recaptcha-response']) {
      response = req.body['g-recaptcha-response']
    } else if (req.query && req.query['g-recaptcha-response']) {
      response = req.query['g-recaptcha-response']
    }

    if (!response) return next(options.errors.validation())

    var data =
        { secret: options.secretKey
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
      if (!res.body) return next(options.errors.missingBody())

      var body

      try {
        body = JSON.parse(res.body)
      } catch (e) {
        return next(e)
      }

      if (body.success) return next()

      var errors = body['error-codes']

      if (!errors || errors.length === 0) return next(options.errors.missingError())

      next(options.errors.recaptchaErrorHandler(errors))
    })
  }

  return recaptchaVerify
}
