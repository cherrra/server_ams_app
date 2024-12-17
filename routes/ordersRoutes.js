const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');


router.get('/', ordersController.getUserOrders);
router.get('/orders', ordersController.getAdminOrders);
router.put('/orders/:id', ordersController.updateOrderStatus);
router.post('/orders', ordersController.createOrder);
router.delete('/orders/:id', ordersController.deleteOrder);

module.exports = router;
