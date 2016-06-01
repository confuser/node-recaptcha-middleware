# recaptcha-middleware

[![Build Status](https://travis-ci.org/confuser/node-recaptcha-middleware.png?branch=master)](https://travis-ci.org/confuser/node-recaptcha-middleware)
[![Coverage Status](https://coveralls.io/repos/confuser/node-recaptcha-middleware/badge.png?branch=master)](https://coveralls.io/r/confuser/node-recaptcha-middleware?branch=master)

## Installation
```
npm install recaptcha-middleware --save
```

## Usage
```js

var app = require('express')()
  , middleware = require('recaptcha-middleware')({ secretKey: 'secretKey' })

app.get('/hello', middleware, function (req, res, next) {
  next()
})

app.post('/hello', middleware, function (req, res, next) {
  next()
})

```

Requires either a body field `g-recaptcha-response` or query string parameter of the same name to support multiple HTTP verbs

## Override error messages
```js
var opts =
  { secretKey: 'secretKey'
  , errors:
    { validation: function () { return new Error('Missing g-recaptcha-response field') }
    , missingBody: function () { return new Error('Missing body response from recaptcha') }
    , missingError: function () { return new Error('Recaptcha not successful but no error codes provided') }
    , recaptchaErrorHandler: function (errors) {
        return new Error(errors.join(', '))
      }
    }
  }
  , middleware = require('recaptcha-middleware')(opts)
```
