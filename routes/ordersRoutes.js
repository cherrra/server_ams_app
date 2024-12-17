const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');


router.get('/', ordersController.getUserOrders);
router.get('/admin', ordersController.getAdminOrders);
router.put('/admin/:id', ordersController.updateOrderStatus);
router.post('/', ordersController.createOrder);
router.delete('/:id', ordersController.deleteOrder);

module.exports = router;
