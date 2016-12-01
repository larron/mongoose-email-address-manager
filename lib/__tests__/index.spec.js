'use strict';

var _bluebird = require('bluebird');

var _user = require('./models/user');

var _user2 = _interopRequireDefault(_user);

var _uniqueUser = require('./models/unique-user');

var _uniqueUser2 = _interopRequireDefault(_uniqueUser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Mongoose Email Address Manager', function () {
  var user = void 0;

  var primaryEmail = 'me@larronarmstead.com';
  var secondaryEmail = 'larron@larronarmstead.com';
  var newEmail = 'new@email.com';
  var badEmail = 'bad@email.com';
  var verificationCode = 'emvc-code';
  var badVerificationCode = 'emvc-code-bad';
  var expiredVerificationCode = 'emvc-code-expired';
  var verifiedVerificationCode = 'emvc-code-verified';
  var emailWithVerificationCode = 'la@larronarmstead.com';
  var emailWithExpiredVerificationCode = 'ev@larronarmstead.com';
  var emailWithVerification = 'lala@larronarmstead.com';

  var doc = {
    emailAddresses: [{ emailAddress: primaryEmail }, { emailAddress: secondaryEmail }, {
      emailAddress: emailWithVerificationCode,
      verification: { code: verificationCode }
    }, {
      emailAddress: emailWithExpiredVerificationCode,
      verification: {
        code: expiredVerificationCode,
        codeExpiration: new Date(2006, 6, 6)
      }
    }, {
      emailAddress: emailWithVerification,
      verification: {
        code: verifiedVerificationCode,
        date: new Date()
      }
    }]
  };

  before((0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return _user2.default.create(doc);

          case 2:
            user = _context.sent;

          case 3:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  })));

  context('using the virtuals', function () {
    it('should return the primary email', function () {
      return expect(user.email).to.eql(primaryEmail);
    });
  });

  context('_id option', function () {
    it('should remove _id fields when set to false', function () {
      return expect(user.getEmail(primaryEmail)).not.to.have.property('_id');
    });
  });

  context('unique option', function () {
    before((0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee2() {
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return _uniqueUser2.default.create(doc);

            case 2:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, undefined);
    })));

    it('should block duplicate emails', function () {
      expect(_uniqueUser2.default.create(doc)).to.be.rejectedWith('dup key');
    });
  });

  context('required option', function () {
    it('should require an email address', function () {
      return expect(_user2.default.create({})).to.be.rejectedWith('validation failed');
    });
  });

  context('style option', function () {
    it('should have camelCase styled keys', function () {
      return expect(user).to.have.property('emailAddresses');
    });
  });

  context('using the statics', function () {
    it('should find one by email', (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee3() {
      var result;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return _user2.default.findOneByEmail(primaryEmail);

            case 2:
              result = _context3.sent;


              expect(result).to.have.property('emailAddresses');

            case 4:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, undefined);
    })));

    it('should find by email', (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee4() {
      var result;
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return _user2.default.findByEmail(primaryEmail);

            case 2:
              result = _context4.sent;


              expect(result[0]).to.have.property('emailAddresses');

            case 4:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, undefined);
    })));

    it('should find by an email verification code', (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee5() {
      var result;
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return _user2.default.findByEmailVerificationCode(verificationCode);

            case 2:
              result = _context5.sent;


              expect(result).to.have.property('emailAddresses');

            case 4:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, undefined);
    })));

    it('should confirm that an email exists', (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee6() {
      var result;
      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              _context6.next = 2;
              return _user2.default.emailExists(primaryEmail);

            case 2:
              result = _context6.sent;


              expect(result).to.be.true();

            case 4:
            case 'end':
              return _context6.stop();
          }
        }
      }, _callee6, undefined);
    })));
  });

  context('using the instance methods', function () {
    it('should get the primary email address', function () {
      var email = user.getPrimaryEmail();

      expect(email.emailAddress).to.eql(primaryEmail);
    });

    it('should get the email by string', function () {
      var email = user.getEmail(primaryEmail);

      expect(email.emailAddress).to.eql(primaryEmail);
    });

    it('should get the email by obejct', function () {
      var email = user.getEmail({ emailAddress: primaryEmail });

      expect(email.emailAddress).to.eql(primaryEmail);
    });

    it('should determine if email exists', function () {
      return expect(user.emailExists(primaryEmail)).to.be.true();
    });

    it('should determine if email does not exist', function () {
      return expect(user.emailExists('bad@email.com')).to.be.false();
    });

    it('should confirm if is primary email by string', function () {
      return expect(user.isPrimaryEmail(primaryEmail)).to.be.true();
    });

    it('should confirm if is primary email by object', function () {
      return expect(user.isPrimaryEmail({
        emailAddress: primaryEmail
      })).to.be.true();
    });

    context('modifying methods', function () {
      beforeEach((0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee7() {
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.next = 2;
                return _user2.default.create(doc);

              case 2:
                user = _context7.sent;

              case 3:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, undefined);
      })));

      it('should add an email by string', function () {
        var count = user.emailAddresses.length;
        user.addEmail(newEmail);

        expect(user.emailAddresses).to.have.lengthOf(count + 1);
      });

      it('should add an email by object', function () {
        var count = user.emailAddresses.length;
        user.addEmail({ emailAddress: newEmail });

        expect(user.emailAddresses).to.have.lengthOf(count + 1);
      });

      it('should add an email by string and save', (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee8() {
        var count;
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                count = user.emailAddresses.length;
                _context8.next = 3;
                return user.addEmailAndSave(newEmail);

              case 3:

                expect(user.emailAddresses).to.have.lengthOf(count + 1);

              case 4:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, undefined);
      })));

      it('should add an email by object', (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee9() {
        var count;
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                count = user.emailAddresses.length;
                _context9.next = 3;
                return user.addEmailAndSave({ emailAddress: newEmail });

              case 3:

                expect(user.emailAddresses).to.have.lengthOf(count + 1);

              case 4:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, undefined);
      })));

      it('should set the email as primary by string', function () {
        var email = user.setPrimaryEmail(secondaryEmail);

        expect(email.emailAddress).to.eql(secondaryEmail);
        expect(user.email).to.eql(secondaryEmail);
      });

      it('should set the email as primary by object', function () {
        var email = user.setPrimaryEmail({ emailAddress: secondaryEmail });

        expect(email.emailAddress).to.eql(secondaryEmail);
        expect(user.email).to.eql(secondaryEmail);
      });

      it('should fail when setting a bad primary email', function () {
        return expect(function () {
          return user.setPrimaryEmail(badEmail);
        }).to.throw('does not exist');
      });

      it('should set the email as primary by string and save', (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee10() {
        var email;
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                _context10.next = 2;
                return user.setPrimaryEmailAndSave(secondaryEmail);

              case 2:
                email = _context10.sent;


                expect(email.emailAddress).to.eql(secondaryEmail);
                expect(user.email).to.eql(secondaryEmail);

              case 5:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, undefined);
      })));

      it('should set the email as primary by object and save', (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee11() {
        var email;
        return regeneratorRuntime.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                _context11.next = 2;
                return user.setPrimaryEmailAndSave({ emailAddress: primaryEmail });

              case 2:
                email = _context11.sent;


                expect(email).to.exist();
                expect(email.emailAddress).to.eql(primaryEmail);

              case 5:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11, undefined);
      })));

      it('should fail when setting a bad primary email and saving', function () {
        return expect(user.setPrimaryEmailAndSave(badEmail)).to.be.rejectedWith('does not exist');
      });

      it('should start email verification process', function () {
        var email = user.startEmailVerificationProcess(primaryEmail);

        expect(email).to.have.property('verification');
      });

      it('should fail email verification process with bad email', function () {
        return expect(function () {
          return user.startEmailVerificationProcess(badEmail);
        }).to.throw('does not exist');
      });

      it('should fail email verification process with already verified email', function () {
        return expect(function () {
          return user.startEmailVerificationProcess(emailWithVerification);
        }).to.throw('already verified');
      });

      it('should start email verification process and save', (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee12() {
        var email;
        return regeneratorRuntime.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                _context12.next = 2;
                return user.startEmailVerificationProcessAndSave(primaryEmail);

              case 2:
                email = _context12.sent;


                expect(email).to.have.property('verification');

              case 4:
              case 'end':
                return _context12.stop();
            }
          }
        }, _callee12, undefined);
      })));

      it('should fail email verification process with bad email while saving', function () {
        return expect(user.startEmailVerificationProcessAndSave(badEmail)).to.be.rejectedWith('does not exist');
      });

      it('should fail email verification process with already verified email while saving', function () {
        return expect(user.startEmailVerificationProcessAndSave(emailWithVerification)).to.be.rejectedWith('already verified');
      });

      it('should get email by verification code', function () {
        var email = user.getEmailByVerificationCode(verificationCode);

        expect(email.emailAddress).to.eql(emailWithVerificationCode);
      });

      it('should verify an email', function () {
        var email = user.setVerifiedEmail(verificationCode);

        expect(email.emailAddress).to.eql(emailWithVerificationCode);
      });

      it('should not verify an email with no existence or code', function () {
        return expect(function () {
          return user.setVerifiedEmail(badVerificationCode);
        }).to.throw('does not exist');
      });

      it('should not verify an already verified email', function () {
        return expect(function () {
          return user.setVerifiedEmail(verifiedVerificationCode);
        }).to.throw('already verified');
      });

      it('should not verify an email with an expired code', function () {
        return expect(function () {
          return user.setVerifiedEmail(expiredVerificationCode);
        }).to.throw('code has expired');
      });

      it('should verify an email and save', (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee13() {
        var email;
        return regeneratorRuntime.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                _context13.next = 2;
                return user.setVerifiedEmailAndSave(verificationCode);

              case 2:
                email = _context13.sent;


                expect(email.emailAddress).to.eql(emailWithVerificationCode);

              case 4:
              case 'end':
                return _context13.stop();
            }
          }
        }, _callee13, undefined);
      })));

      it('should not verify an email with no existence or code while saving', function () {
        return expect(user.setVerifiedEmailAndSave(badVerificationCode)).to.be.rejectedWith('does not exist');
      });

      it('should not verify an already verified email while saving', function () {
        return expect(user.setVerifiedEmailAndSave(verifiedVerificationCode)).to.be.rejectedWith('already verified');
      });

      it('should not verify an email with an expired code while saving', function () {
        return expect(user.setVerifiedEmailAndSave(expiredVerificationCode)).to.be.rejectedWith('code has expired');
      });

      it('should confirm that an email is verified', function () {
        return expect(user.isVerifiedEmail(emailWithVerification)).to.be.true();
      });

      it('should confirm that an email is not verified', function () {
        return expect(user.isVerifiedEmail(primaryEmail)).to.be.false();
      });
    });

    context('destructive methods', function () {
      beforeEach((0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee14() {
        return regeneratorRuntime.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                _context14.next = 2;
                return _user2.default.create(doc);

              case 2:
                user = _context14.sent;

              case 3:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14, undefined);
      })));

      it('should remove an email by string', function () {
        var count = user.emailAddresses.length;
        user.removeEmail(primaryEmail);

        expect(user.emailAddresses).to.have.lengthOf(count - 1);
      });

      it('should remove an email by object', function () {
        var count = user.emailAddresses.length;
        user.removeEmail({ emailAddress: primaryEmail });

        expect(user.emailAddresses).to.have.lengthOf(count - 1);
      });

      it('should remove a primary email and select a new primary', (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee15() {
        return regeneratorRuntime.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                _context15.next = 2;
                return user.removeEmailAndSave(primaryEmail);

              case 2:

                expect(user.email).not.to.eql(primaryEmail);

              case 3:
              case 'end':
                return _context15.stop();
            }
          }
        }, _callee15, undefined);
      })));

      it('should remove an email by string and save', (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee16() {
        var count;
        return regeneratorRuntime.wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                count = user.emailAddresses.length;
                _context16.next = 3;
                return user.removeEmailAndSave(primaryEmail);

              case 3:

                expect(user.emailAddresses).to.have.lengthOf(count - 1);

              case 4:
              case 'end':
                return _context16.stop();
            }
          }
        }, _callee16, undefined);
      })));

      it('should remove an email by object and save', (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee17() {
        var count;
        return regeneratorRuntime.wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                count = user.emailAddresses.length;
                _context17.next = 3;
                return user.removeEmailAndSave({ emailAddress: primaryEmail });

              case 3:

                expect(user.emailAddresses).to.have.lengthOf(count - 1);

              case 4:
              case 'end':
                return _context17.stop();
            }
          }
        }, _callee17, undefined);
      })));
    });
  });
});