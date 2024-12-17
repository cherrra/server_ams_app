const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/user', userController.getUser);
router.put('/user', userController.updateUser);
router.delete('/auth/delete', userController.deleteOwnAccount);
router.get('/users', userController.getAllUsers);
router.delete('/users/:id', userController.deleteUserByAdmin);

module.exports = router;
