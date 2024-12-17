const express = require('express');
const multer = require('multer');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitizedFileName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
    cb(null, `${timestamp}_${sanitizedFileName}`);
  },
});

const upload = multer({ storage });

router.post('/upload', upload.single('image'), uploadController.uploadImage);

module.exports = router;
