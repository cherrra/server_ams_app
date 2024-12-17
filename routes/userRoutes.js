const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/user', userController.getUser);
// Обновление данных пользователя
router.put('/user', userController.updateUser);

// Удаление собственного аккаунта
router.delete('/auth/delete', userController.deleteOwnAccount);

// Получение списка пользователей (админка)
router.get('/users', userController.getAllUsers);

// Удаление пользователя администратором
router.delete('/users/:id', userController.deleteUserByAdmin);

module.exports = router;
