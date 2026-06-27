"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var _dotenv = require('dotenv');
var _dotenv2 = _interopRequireDefault(_dotenv);
_dotenv2.default.config();

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required.`);
  }
  return value;
};

const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwt: {
    secret: requiredEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  database: {
    url: requiredEnv('DATABASE_URL'),
  },
};
exports.config = config;

exports.default = exports.config;
