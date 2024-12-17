const express = require('express');
const carController = require('../controllers/carController');

const router = express.Router();

// Добавление машины
router.post('/', carController.addCar);

// Обновление машины
router.put('/:id', carController.updateCar);

// Удаление машины
router.delete('/:id', carController.deleteCar);

// Получение машин
router.get('/', carController.getCars);

module.exports = router;
