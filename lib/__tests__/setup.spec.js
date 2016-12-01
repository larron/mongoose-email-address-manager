'use strict';

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _mockgoose = require('mockgoose');

var _mockgoose2 = _interopRequireDefault(_mockgoose);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_mongoose2.default.Promise = _bluebird2.default;

before(function (done) {
  (0, _mockgoose2.default)(_mongoose2.default).then(function () {
    _mongoose2.default.connect('mongodb://localhost/mongoose-email-address-manager', function (err) {
      return done(err);
    });
  });
});

after(function (done) {
  _mongoose2.default.models = {};
  _mongoose2.default.modelSchemas = {};
  _mockgoose2.default.reset(done);
});

after(function (done) {
  return _mongoose2.default.unmock(done);
});