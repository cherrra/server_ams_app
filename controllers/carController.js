const jwt = require('jsonwebtoken');
const db = require('../config/db');

//добавление
exports.addCar = (req, res) => {
    const { model, brand, year, mileage, vin_code, license_plate, body_type, engine_type } = req.body;
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const userId = decoded.id;

        db.query(
            'INSERT INTO cars (model, brand, year, mileage, vin_code, license_plate, body_type, engine_type, id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [model, brand, year, mileage, vin_code, license_plate, body_type, engine_type, userId],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Ошибка при добавлении машины' });
                }

                res.status(200).json({ message: 'Машина успешно добавлена' });
            }
        );
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Неверный токен' });
    }
};

//обновление
exports.updateCar = (req, res) => {
    const { model, brand, year, mileage, vin_code, license_plate, body_type, engine_type } = req.body;
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const userId = decoded.id;
        const carId = req.params.id;

        db.query(
            'UPDATE cars SET model = ?, brand = ?, year = ?, mileage = ?, vin_code = ?, license_plate = ?, body_type = ?, engine_type = ? WHERE id_car = ? AND id = ?',
            [model, brand, year, mileage, vin_code, license_plate, body_type, engine_type, carId, userId],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Ошибка при обновлении машины' });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Машина не найдена' });
                }

                res.status(200).json({ message: 'Машина успешно обновлена' });
            }
        );
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Неверный токен' });
    }
};

//удаление 
exports.deleteCar = (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const userId = decoded.id;
        const carId = req.params.id;

        db.query(
            'DELETE FROM cars WHERE id_car = ? AND id = ?',
            [carId, userId],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Ошибка при удалении машины' });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Машина не найдена' });
                }

                res.status(200).json({ message: 'Машина успешно удалена' });
            }
        );
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Неверный токен' });
    }
};

//получение 
exports.getCars = (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const userId = decoded.id;

        db.query(
            'SELECT id_car, model, brand, year, mileage, vin_code, license_plate, body_type, engine_type FROM cars WHERE id = ?',
            [userId],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Ошибка при получении списка машин' });
                }

                res.status(200).json(result);
            }
        );
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Неверный токен' });
    }
};
