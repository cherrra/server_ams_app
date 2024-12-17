const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);
router.delete('/:id', userController.deleteUserByAdmin);

module.exports = router;
