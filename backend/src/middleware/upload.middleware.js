"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var _multer = require('multer');
var _multer2 = _interopRequireDefault(_multer);
var _path = require('path');
var _path2 = _interopRequireDefault(_path);
var _fs = require('fs');
var _crypto = require('crypto');
var _errormiddleware = require('./error.middleware');

const UPLOAD_DIR = _path2.default.join(__dirname, '..', '..', 'uploads');
const allowedImageTypes = {
  'image/jpeg': new Set(['.jpg', '.jpeg']),
  'image/png': new Set(['.png']),
  'image/webp': new Set(['.webp']),
  'image/gif': new Set(['.gif']),
};

_fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = _multer2.default.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = _path2.default.extname(file.originalname || '').toLowerCase();
    cb(null, `${_crypto.randomUUID()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = _path2.default.extname(file.originalname || '').toLowerCase();
  const allowedExtensions = allowedImageTypes[file.mimetype];

  if (allowedExtensions && allowedExtensions.has(ext)) {
    cb(null, true);
    return;
  }

  cb(_errormiddleware.createError.call(void 0, 'Only valid image files (jpeg, png, webp, gif) are allowed', 400));
};

const uploadImage = _multer2.default.call(void 0, {
  storage,
  fileFilter,
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024,
  },
});
exports.uploadImage = uploadImage;
