const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/user', authController.getUser);
router.put('/user', authController.updateUser);
router.delete('/delete', authController.deleteOwnAccount);

module.exports = router;
