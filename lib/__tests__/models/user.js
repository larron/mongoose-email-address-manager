'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _lodash = require('lodash');

var _index = require('../../index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var schema = new _mongoose.Schema();

schema.plugin(_index2.default, {
  _id: false,
  unique: false,
  required: true,
  style: function style(key) {
    return (0, _lodash.camelCase)(key);
  }
});

exports.default = _mongoose2.default.model('user', schema);