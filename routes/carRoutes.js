const express = require('express');
const carController = require('../controllers/carController');

const router = express.Router();

router.post('/', carController.addCar);
router.put('/:id', carController.updateCar);
router.delete('/:id', carController.deleteCar);
router.get('/', carController.getCars);

module.exports = router;
