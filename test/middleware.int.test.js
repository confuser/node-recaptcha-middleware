var assert = require('assert')
  , nock = require('nock')
  , middleware = require('../')
  , recaptchaDomain = 'https://www.google.com'
  , recaptchaRoute = '/recaptcha/api/siteverify'

describe('Recaptcha Middleware', function () {

  it('should error if missing public key', function () {
    assert.throws(function () {
      middleware()
    }, /Missing public recaptcha key/)
  })

  it('should error if missing secret key', function () {
    assert.throws(function () {
      middleware('a')
    }, /Missing secret recaptcha key/)
  })

  it('should error if missing g-recaptcha-response', function (done) {
    middleware('a', 'a')({ body: {}, query: {} }, null, function (error) {
      assert.equal(error.message, 'Missing g-recaptcha-response field')

      done()
    })
  })

  it('should use g-recaptcha-response body field', function (done) {
    nock(recaptchaDomain)
      .filteringRequestBody(function (body) {
        assert.deepEqual(JSON.parse(body), { secret: 'a', response: 'hello' })

        done()
      })
      .post(recaptchaRoute)
      .reply(200)

    middleware('a', 'a')({ body: { 'g-recaptcha-response': 'hello' } })
  })

  it('should use g-recaptcha-response query field', function (done) {
    nock(recaptchaDomain)
      .filteringRequestBody(function (body) {
        assert.deepEqual(JSON.parse(body), { secret: 'a', response: 'hello' })

        done()
      })
      .post(recaptchaRoute)
      .reply(200)

    middleware('a', 'a')({ query: { 'g-recaptcha-response': 'hello' } })
  })

  it('should attach ip', function (done) {
    nock(recaptchaDomain)
      .filteringRequestBody(function (body) {
        assert.deepEqual(JSON.parse(body), { remoteip: 'a', secret: 'a', response: 'hello' })

        done()
      })
      .post(recaptchaRoute)
      .reply(200)

    middleware('a', 'a')({ ip: 'a', query: { 'g-recaptcha-response': 'hello' } })
  })

  it('should error on no response', function (done) {
    nock(recaptchaDomain)
      .post(recaptchaRoute)
      .reply(200)

    middleware('a', 'a')({ ip: 'a', query: { 'g-recaptcha-response': 'hello' } }, null, function (error) {
      assert.equal(error.message, 'Missing body response from recaptcha')

      done()
    })
  })

  it('should error on malformed JSON response', function (done) {
    nock(recaptchaDomain)
      .post(recaptchaRoute)
      .replyWithError('I broke')

    middleware('a', 'a')({ ip: 'a', body: { 'g-recaptcha-response': 'hello' } }, null, function (error) {
      assert.equal(error.message, 'I broke')

      done()
    })
  })

  it('should error on empty error-codes', function (done) {
    nock(recaptchaDomain)
      .post(recaptchaRoute)
      .reply(400, {})

    middleware('a', 'a')({ ip: 'a', query: { 'g-recaptcha-response': 'hello' } }, null, function (error) {
      assert.equal(error.message, 'Recaptcha not successful but no error codes provided')

      done()
    })
  })

  it('should amalgamate error-codes', function (done) {
    nock(recaptchaDomain)
      .post(recaptchaRoute)
      .reply(400, { 'error-codes': [ 'test', 'hello' ] })

    middleware('a', 'a')({ ip: 'a', query: { 'g-recaptcha-response': 'hello' } }, null, function (error) {
      assert.equal(error.message, 'test, hello')

      done()
    })
  })

  it('should succeed', function (done) {
    nock(recaptchaDomain)
      .post(recaptchaRoute)
      .reply(400, { success: true })

    middleware('a', 'a')({ ip: 'a', query: { 'g-recaptcha-response': 'hello' } }, null, done)
  })

})
