const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const UPLOAD_DIR = require('../config/upload');
const { cloudinaryStorage, isCloudinaryConfigured } = require('../config/cloudinary');

let storage;
let useCloudinary = false;

if (isCloudinaryConfigured()) {
  storage = cloudinaryStorage;
  useCloudinary = true;
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;
module.exports.useCloudinary = useCloudinary;
