var assert = require('assert')
  , nock = require('nock')
  , middleware = require('../')
  , recaptchaDomain = 'https://www.google.com'
  , recaptchaRoute = '/recaptcha/api/siteverify'

describe('Recaptcha Middleware', function () {

  it('should error if missing secret key', function () {
    assert.throws(function () {
      middleware({})
    }, /Missing secret recaptcha key/)
  })

  it('should error if missing g-recaptcha-response', function (done) {
    middleware({ secretKey: 'a' })({ body: {}, query: {} }, null, function (error) {
      assert.equal(error.message, 'Missing g-recaptcha-response field')

      done()
    })
  })

  it('should allow a custom error if missing g-recaptcha-response', function (done) {
    var opts =
      { secretKey: 'a'
      , errors:
        { validation: function () { return new Error('Testing') }
        }
      }

    middleware(opts)({ body: {}, query: {} }, null, function (error) {
      assert.equal(error.message, 'Testing')

      done()
    })
  })

  it('should use g-recaptcha-response body field', function (done) {
    nock(recaptchaDomain)
      .filteringRequestBody(function (body) {
        assert.deepEqual(body, 'secret=a&response=hello')

        done()
      })
      .post(recaptchaRoute)
      .reply(200)

    middleware({ secretKey: 'a' })({ body: { 'g-recaptcha-response': 'hello' } })
  })

  it('should use g-recaptcha-response query field', function (done) {
    nock(recaptchaDomain)
      .filteringRequestBody(function (body) {
        assert.deepEqual(body, 'secret=a&response=hello')

        done()
      })
      .post(recaptchaRoute)
      .reply(200)

    middleware({ secretKey: 'a' })({ query: { 'g-recaptcha-response': 'hello' } })
  })

  it('should attach ip', function (done) {
    nock(recaptchaDomain)
      .filteringRequestBody(function (body) {
        assert.deepEqual(body, 'secret=a&response=hello&remoteip=a')

        done()
      })
      .post(recaptchaRoute)
      .reply(200)

    middleware({ secretKey: 'a' })({ ip: 'a', query: { 'g-recaptcha-response': 'hello' } })
  })

  it('should error on no response', function (done) {
    nock(recaptchaDomain)
      .post(recaptchaRoute)
      .reply(200)

    middleware({ secretKey: 'a' })({ ip: 'a', query: { 'g-recaptcha-response': 'hello' } }, null, function (error) {
      assert.equal(error.message, 'Missing body response from recaptcha')

      done()
    })
  })

  it('should allow a custom error on no response', function (done) {
    nock(recaptchaDomain)
      .post(recaptchaRoute)
      .reply(200)

    var opts =
      { secretKey: 'a'
      , errors:
        { missingBody: function () { return new Error('Testing') }
        }
      }

    middleware(opts)({ ip: 'a', query: { 'g-recaptcha-response': 'hello' } }, null, function (error) {
      assert.equal(error.message, 'Testing')

      done()
    })
  })

  it('should error on malformed JSON response', function (done) {
    nock(recaptchaDomain)
      .post(recaptchaRoute)
      .replyWithError('I broke')

    middleware({ secretKey: 'a' })({ ip: 'a', body: { 'g-recaptcha-response': 'hello' } }, null, function (error) {
      assert.equal(error.message, 'I broke')

      done()
    })
  })

  it('should error on invalid JSON response', function (done) {
    nock(recaptchaDomain)
      .post(recaptchaRoute)
      .reply(200, '{asdasd')

    middleware({ secretKey: 'a' })({ ip: 'a', query: { 'g-recaptcha-response': 'hello' } }, null, function (error) {
      assert.equal(error.message, 'Unexpected token a')

      done()
    })
  })

  it('should error on empty error-codes', function (done) {
    nock(recaptchaDomain)
      .post(recaptchaRoute)
      .reply(400, {})

    middleware({ secretKey: 'a' })({ ip: 'a', query: { 'g-recaptcha-response': 'hello' } }, null, function (error) {
      assert.equal(error.message, 'Recaptcha not successful but no error codes provided')

      done()
    })
  })

  it('should allow a custom error on empty error-codes', function (done) {
    nock(recaptchaDomain)
      .post(recaptchaRoute)
      .reply(400, {})

    var opts =
      { secretKey: 'a'
      , errors:
        { missingError: function () { return new Error('Testing') }
        }
      }

    middleware(opts)({ ip: 'a', query: { 'g-recaptcha-response': 'hello' } }, null, function (error) {
      assert.equal(error.message, 'Testing')

      done()
    })
  })

  it('should amalgamate error-codes', function (done) {
    nock(recaptchaDomain)
      .post(recaptchaRoute)
      .reply(400, { 'error-codes': [ 'test', 'hello' ] })

    middleware({ secretKey: 'a' })({ ip: 'a', query: { 'g-recaptcha-response': 'hello' } }, null, function (error) {
      assert.equal(error.message, 'test, hello')

      done()
    })
  })

  it('should allow custom error-code handling', function (done) {
    nock(recaptchaDomain)
      .post(recaptchaRoute)
      .reply(400, { 'error-codes': [ 'test', 'hello' ] })

    var opts =
      { secretKey: 'a'
      , errors:
        { recaptchaErrorHandler: function (errors) {
            return new Error(errors.join('|'))
          }
        }
      }

    middleware(opts)({ ip: 'a', query: { 'g-recaptcha-response': 'hello' } }, null, function (error) {
      assert.equal(error.message, 'test|hello')

      done()
    })
  })

  it('should succeed', function (done) {
    nock(recaptchaDomain)
      .post(recaptchaRoute)
      .reply(400, { success: true })

    middleware({ secretKey: 'a' })({ ip: 'a', query: { 'g-recaptcha-response': 'hello' } }, null, done)
  })

})
