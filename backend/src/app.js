"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }require('dotenv/config');
var _express = require('express'); var _express2 = _interopRequireDefault(_express);
var _cors = require('cors'); var _cors2 = _interopRequireDefault(_cors);
var _helmet = require('helmet'); var _helmet2 = _interopRequireDefault(_helmet);
var _morgan = require('morgan'); var _morgan2 = _interopRequireDefault(_morgan);
var _compression = require('compression'); var _compression2 = _interopRequireDefault(_compression);
var _expressratelimit = require('express-rate-limit'); var _expressratelimit2 = _interopRequireDefault(_expressratelimit);
var _path = require('path'); var _path2 = _interopRequireDefault(_path);

var _env = require('./config/env'); var _env2 = _interopRequireDefault(_env);
var _index = require('./routes/index'); var _index2 = _interopRequireDefault(_index);
var _errormiddleware = require('./middleware/error.middleware');

const app = _express2.default.call(void 0, );

// ─── Security ───────────────────────────────────────────────
app.use(_helmet2.default.call(void 0, {
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(_cors2.default.call(void 0, {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    
    const isLocalDev =
      _env2.default.nodeEnv === 'development' &&
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    
    if (isLocalDev || origin === _env2.default.clientUrl) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ───────────────────────────────────────────
const limiter = _expressratelimit2.default.call(void 0, {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ─── Request Parsing ─────────────────────────────────────────
app.use(_express2.default.json({ limit: '10mb' }));
app.use(_express2.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(_compression2.default.call(void 0, ));

// ─── Logging ─────────────────────────────────────────────────
if (_env2.default.nodeEnv === 'development') {
  app.use(_morgan2.default.call(void 0, 'dev'));
} else {
  app.use(_morgan2.default.call(void 0, 'combined'));
}

// ─── Static Files ─────────────────────────────────────────────
app.use('/uploads', _express2.default.static(_path2.default.join(__dirname, '..', 'uploads'), {
  dotfiles: 'deny',
  fallthrough: false,
  index: false,
  immutable: true,
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/v1', _index2.default);

// ─── Error Handling ───────────────────────────────────────────
app.use(_errormiddleware.notFound);
app.use(_errormiddleware.errorHandler);

exports. default = app;
