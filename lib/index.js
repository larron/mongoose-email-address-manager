'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bluebird = require('bluebird');

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

require('babel-polyfill');

var _mongoose = require('mongoose');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

exports.default = function (schema, options) {
  var _s, _ref;

  var config = _extends({
    _id: true,
    index: true,
    unique: true,
    sparse: true,
    required: false,
    verificationCodePrefix: 'emvc-',
    verificationCodeExpiration: 0,
    emailValidationRegex: /^.+@.+$/,
    style: function style(key) {
      return key;
    }
  }, options);

  var _id = config._id,
      index = config.index,
      unique = config.unique,
      sparse = config.sparse,
      required = config.required,
      verificationCodePrefix = config.verificationCodePrefix,
      verificationCodeExpiration = config.verificationCodeExpiration,
      emailValidationRegex = config.emailValidationRegex,
      s = config.style;


  schema.add(_defineProperty({}, s('email_addresses'), [new _mongoose.Schema((_ref = {}, _defineProperty(_ref, s('email_address'), {
    type: String,
    unique: unique,
    sparse: sparse,
    required: true
  }), _defineProperty(_ref, s('primary'), Date), _defineProperty(_ref, s('verification'), (_s = {}, _defineProperty(_s, s('date'), Date), _defineProperty(_s, s('code'), String), _defineProperty(_s, s('code_expiration'), Date), _s)), _ref), { _id: _id })]));

  var emailAddressKey = s('email_addresses') + '.' + s('email_address');
  var verificationCodeKey = s('email_addresses') + '.' + s('verification') + '.' + s('code');
  var isObject = function isObject(o) {
    return Object.prototype.toString.call(o) === '[object Object]';
  };
  var generateEmailVerificationCode = function generateEmailVerificationCode() {
    return verificationCodePrefix + function (a, b) {
      for (b = a = ''; a++ < 36; b += a * 51 & 52 ? (a ^ 15 ? 8 ^ Math.random() * (a ^ 20 ? 16 : 4) : 4).toString(16) : '-') {}return b;
    }();
  }; // eslint-disable-line
  var generateEmailVerificationCodeExpiration = function generateEmailVerificationCodeExpiration(hours) {
    var d = new Date();
    d.setTime(d.getTime() + hours * 60 * 60 * 1000);

    return d;
  };
  var generateEmailVerification = function generateEmailVerification(email, hours) {
    email[s('verification')] = _defineProperty({}, s('code'), generateEmailVerificationCode());

    if (hours > 0) email[s('verification')][s('code_expiration')] = generateEmailVerificationCodeExpiration(hours);

    return email;
  };

  if (index) {
    schema.index(_defineProperty({}, emailAddressKey, 1));
    schema.index(_defineProperty({}, verificationCodeKey, 1));
  }

  schema.virtual('email').get(function () {
    var email = this.getPrimaryEmail();

    return email ? email[s('email_address')] : null;
  });

  schema.pre('save', function (next) {
    if (!this.email && this[s('email_addresses')].length > 0) {
      this[s('email_addresses')][0][s('primary')] = new Date();
    }

    next();
  });

  schema.statics.findOneByEmail = function (email) {
    var query = _defineProperty({}, emailAddressKey, email);

    for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      rest[_key - 1] = arguments[_key];
    }

    return this.findOne.apply(this, [query].concat(rest));
  };

  schema.statics.findByEmail = function (email) {
    var query = _defineProperty({}, emailAddressKey, email);

    for (var _len2 = arguments.length, rest = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      rest[_key2 - 1] = arguments[_key2];
    }

    return this.find.apply(this, [query].concat(rest));
  };

  schema.statics.findByEmailVerificationCode = function (code) {
    var query = _defineProperty({}, verificationCodeKey, code);

    for (var _len3 = arguments.length, rest = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      rest[_key3 - 1] = arguments[_key3];
    }

    return this.findOne.apply(this, [query].concat(rest));
  };

  schema.statics.emailExists = function () {
    var _ref2 = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee(email) {
      var doc;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.findOneByEmail(email);

            case 2:
              doc = _context.sent;
              return _context.abrupt('return', !!doc);

            case 4:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function (_x) {
      return _ref2.apply(this, arguments);
    };
  }();

  schema.methods.addEmail = function (emailToAdd) {
    this[s('email_addresses')].push(isObject(emailToAdd) ? emailToAdd : _defineProperty({}, s('email_address'), emailToAdd));

    return this.getEmail(emailToAdd);
  };

  schema.methods.addEmailAndSave = function () {
    var _ref4 = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee2(emailToAdd) {
      var email;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              email = this.addEmail(emailToAdd);
              _context2.next = 3;
              return this.save();

            case 3:
              return _context2.abrupt('return', email);

            case 4:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    return function (_x2) {
      return _ref4.apply(this, arguments);
    };
  }();

  schema.methods.getEmail = function (emailToFind) {
    return this[s('email_addresses')].find(function (email) {
      return email[s('email_address')] === (isObject(emailToFind) ? emailToFind[s('email_address')] : emailToFind);
    });
  };

  schema.methods.emailExists = function (email) {
    return !!this.getEmail(email);
  };

  schema.methods.getPrimaryEmail = function () {
    return this[s('email_addresses')].find(function (email) {
      return email[s('primary')];
    });
  };

  schema.methods.isPrimaryEmail = function (emailToFind) {
    var email = this.getEmail(emailToFind);

    return email ? s('primary') in email : false;
  };

  schema.methods.setPrimaryEmail = function (email) {
    var currentPrimaryEmail = this.getPrimaryEmail();
    var newPrimaryEmail = this.getEmail(email);

    if (!newPrimaryEmail) throw new Error('Email does not exist');

    if (currentPrimaryEmail !== newPrimaryEmail) {
      if (currentPrimaryEmail) currentPrimaryEmail[s('primary')] = undefined;

      newPrimaryEmail[s('primary')] = new Date();
    }

    return newPrimaryEmail;
  };

  schema.methods.setPrimaryEmailAndSave = function () {
    var _ref5 = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee3(email) {
      var primaryEmail;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              primaryEmail = this.setPrimaryEmail(email);
              _context3.next = 3;
              return this.save();

            case 3:
              return _context3.abrupt('return', primaryEmail);

            case 4:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    return function (_x3) {
      return _ref5.apply(this, arguments);
    };
  }();

  schema.methods.removeEmail = function (emailToRemove) {
    var email = this.getEmail(emailToRemove);

    if (email) {
      this[s('email_addresses')] = this[s('email_addresses')].filter(function (em) {
        return em !== email;
      });

      if (this[s('email_addresses')].length && !this.email) {
        this.setPrimaryEmail(this[s('email_addresses')][0]);
      }
    }

    return this[s('email_addresses')];
  };

  schema.methods.removeEmailAndSave = function () {
    var _ref6 = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee4(emailToRemove) {
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              this.removeEmail(emailToRemove);
              _context4.next = 3;
              return this.save();

            case 3:
              return _context4.abrupt('return', this[s('email_addresses')]);

            case 4:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    return function (_x4) {
      return _ref6.apply(this, arguments);
    };
  }();

  schema.methods.startEmailVerificationProcess = function (emailToVerify) {
    var hours = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : verificationCodeExpiration;

    var email = this.getEmail(emailToVerify);

    if (email) {
      if (this.isVerifiedEmail(email)) {
        throw new Error('Email is already verified');
      } else {
        generateEmailVerification(email, hours);

        return email;
      }
    } else {
      throw new Error('Email does not exist');
    }
  };

  schema.methods.startEmailVerificationProcessAndSave = function () {
    var _ref7 = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee5() {
      var email,
          _args5 = arguments;
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              email = this.startEmailVerificationProcess.apply(this, _args5);
              _context5.next = 3;
              return this.save();

            case 3:
              return _context5.abrupt('return', email);

            case 4:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, this);
    }));

    return function (_x6) {
      return _ref7.apply(this, arguments);
    };
  }();

  schema.methods.getEmailByVerificationCode = function (code) {
    return this[s('email_addresses')].find(function (email) {
      return email[s('verification')] && email[s('verification')][s('code')] === code;
    });
  };

  schema.methods.setVerifiedEmail = function (code) {
    var email = this.getEmailByVerificationCode(code);

    if (email) {
      if (email[s('verification')]) {
        if (this.isVerifiedEmail(email)) {
          throw new Error('Email is already verified');
        } else if (email[s('verification')][s('code_expiration')] && email[s('verification')][s('code_expiration')].getTime() <= new Date().getTime()) {
          throw new Error('Email validation code has expired');
        } else {
          email[s('verification')][s('date')] = new Date();
        }
      }
    } else {
      throw new Error('Email does not exist with that code');
    }

    return email;
  };

  schema.methods.setVerifiedEmailAndSave = function () {
    var _ref8 = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee6(code) {
      var email;
      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              email = this.setVerifiedEmail(code);
              _context6.next = 3;
              return this.save();

            case 3:
              return _context6.abrupt('return', email);

            case 4:
            case 'end':
              return _context6.stop();
          }
        }
      }, _callee6, this);
    }));

    return function (_x7) {
      return _ref8.apply(this, arguments);
    };
  }();

  schema.methods.isVerifiedEmail = function (emailToVerify) {
    var email = this.getEmail(emailToVerify);

    return !!(email && email[s('verification')] && email[s('verification')][s('date')]);
  };

  schema.path(s('email_addresses')).validate(function (emails) {
    return emails.filter(function (email) {
      return email[s('primary')];
    }).length <= 1;
  }, 'More than one primary email address');

  schema.path(s('email_addresses')).schema.path(s('email_address')).validate(function (email) {
    return emailValidationRegex.test(email);
  }, 'Invalid email address');

  if (required) {
    schema.path(s('email_addresses')).validate(function (emails) {
      return emails.length;
    }, 'Email address required');
  }
};