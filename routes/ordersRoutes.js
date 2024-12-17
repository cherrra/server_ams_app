const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');

// Получение заказов для пользователя
router.get('/', ordersController.getUserOrders);

// Получение всех заказов для администратора
router.get('/orders', ordersController.getAdminOrders);

// Обновление статуса заказа для администратора
router.put('/orders/:id', ordersController.updateOrderStatus);

// Оформление нового заказа
router.post('/orders', ordersController.createOrder);

// Удаление заказа
router.delete('/orders/:id', ordersController.deleteOrder);

module.exports = router;
