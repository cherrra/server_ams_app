const jwt = require('jsonwebtoken');
const db = require('../config/db');

//добавление
// exports.addCar = (req, res) => {
//     const { model, brand, year, mileage, vin_code, license_plate } = req.body;
//     const token = req.headers.authorization;

//     if (!token) {
//         return res.status(401).json({ message: 'Токен не предоставлен' });
//     }

//     try {
//         const decoded = jwt.verify(token, 'your_jwt_secret');
//         const userId = decoded.id;

//         db.query(
//             'INSERT INTO cars (model, brand, year, mileage, vin_code, license_plate, id) VALUES (?, ?, ?, ?, ?, ?, ?)',
//             [model, brand, year, mileage, vin_code, license_plate, userId],
//             (err) => {
//                 if (err) {
//                     console.error(err);
//                     return res.status(500).json({ message: 'Ошибка при добавлении машины' });
//                 }

//                 res.status(200).json({ message: 'Машина успешно добавлена' });
//             }
//         );
//     } catch (err) {
//         console.error(err);
//         res.status(403).json({ message: 'Неверный токен' });
//     }
// };
// exports.addCar = (req, res) => {
//     const { id_model, year, mileage, vin_code, license_plate } = req.body;
//     const token = req.headers.authorization;

//     if (!token) {
//         return res.status(401).json({ message: 'Токен не предоставлен' });
//     }

//     try {
//         const decoded = jwt.verify(token, 'your_jwt_secret');
//         const userId = decoded.id;

//         db.query(
//             'INSERT INTO cars (id_model, year, mileage, vin_code, license_plate, id) VALUES (?, ?, ?, ?, ?, ?)',
//             [id_model, year, mileage, vin_code, license_plate, userId],
//             (err) => {
//                 if (err) {
//                     console.error(err);
//                     return res.status(500).json({ message: 'Ошибка при добавлении машины' });
//                 }

//                 res.status(200).json({ message: 'Машина успешно добавлена' });
//             }
//         );
//     } catch (err) {
//         console.error(err);
//         res.status(403).json({ message: 'Неверный токен' });
//     }
// };


//обновление
// exports.updateCar = (req, res) => {
//     const { model, brand, year, mileage, vin_code, license_plate } = req.body;
//     const token = req.headers.authorization;

//     if (!token) {
//         return res.status(401).json({ message: 'Токен не предоставлен' });
//     }

//     try {
//         const decoded = jwt.verify(token, 'your_jwt_secret');
//         const userId = decoded.id;
//         const carId = req.params.id;

//         db.query(
//             'UPDATE cars SET model = ?, brand = ?, year = ?, mileage = ?, vin_code = ?, license_plate = ? WHERE id_car = ? AND id = ?',
//             [model, brand, year, mileage, vin_code, license_plate, carId, userId],
//             (err, result) => {
//                 if (err) {
//                     console.error(err);
//                     return res.status(500).json({ message: 'Ошибка при обновлении машины' });
//                 }

//                 if (result.affectedRows === 0) {
//                     return res.status(404).json({ message: 'Машина не найдена' });
//                 }

//                 res.status(200).json({ message: 'Машина успешно обновлена' });
//             }
//         );
//     } catch (err) {
//         console.error(err);
//         res.status(403).json({ message: 'Неверный токен' });
//     }
// };
// exports.updateCar = (req, res) => {
//     const { id_model, year, mileage, vin_code, license_plate } = req.body;
//     const token = req.headers.authorization;

//     if (!token) {
//         return res.status(401).json({ message: 'Токен не предоставлен' });
//     }

//     try {
//         const decoded = jwt.verify(token, 'your_jwt_secret');
//         const userId = decoded.id;
//         const carId = req.params.id;

//         db.query(
//             'UPDATE cars SET id_model = ?, year = ?, mileage = ?, vin_code = ?, license_plate = ? WHERE id_car = ? AND id = ?',
//             [id_model, year, mileage, vin_code, license_plate, carId, userId],
//             (err, result) => {
//                 if (err) {
//                     console.error(err);
//                     return res.status(500).json({ message: 'Ошибка при обновлении машины' });
//                 }

//                 if (result.affectedRows === 0) {
//                     return res.status(404).json({ message: 'Машина не найдена' });
//                 }

//                 res.status(200).json({ message: 'Машина успешно обновлена' });
//             }
//         );
//     } catch (err) {
//         console.error(err);
//         res.status(403).json({ message: 'Неверный токен' });
//     }
// };

// добавление автомобиля
exports.addCar = (req, res) => {
    const { model_name, brand_name, year, mileage, vin_code, license_plate } = req.body;
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const userId = decoded.id;

        // 1. Сначала проверяем/добавляем бренд
        db.query(
            'SELECT id_brand FROM brand WHERE brand_name = ?', 
            [brand_name],
            (err, brandResults) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Ошибка при поиске бренда' });
                }

                let brandId;
                if (brandResults.length > 0) {
                    brandId = brandResults[0].id_brand;
                    processModel(brandId);
                } else {
                    // Добавляем новый бренд
                    db.query(
                        'INSERT INTO brand (brand_name) VALUES (?)',
                        [brand_name],
                        (err, insertBrandResult) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({ message: 'Ошибка при добавлении бренда' });
                            }
                            brandId = insertBrandResult.insertId;
                            processModel(brandId);
                        }
                    );
                }

                function processModel(brandId) {
                    // 2. Проверяем/добавляем модель
                    db.query(
                        'SELECT id_model FROM model WHERE model_name = ? AND id_brand = ?',
                        [model_name, brandId],
                        (err, modelResults) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({ message: 'Ошибка при поиске модели' });
                            }

                            let modelId;
                            if (modelResults.length > 0) {
                                modelId = modelResults[0].id_model;
                                addCar(modelId);
                            } else {
                                // Добавляем новую модель
                                db.query(
                                    'INSERT INTO model (model_name, id_brand) VALUES (?, ?)',
                                    [model_name, brandId],
                                    (err, insertModelResult) => {
                                        if (err) {
                                            console.error(err);
                                            return res.status(500).json({ message: 'Ошибка при добавлении модели' });
                                        }
                                        modelId = insertModelResult.insertId;
                                        addCar(modelId);
                                    }
                                );
                            }
                        }
                    );
                }

                function addCar(modelId) {
                    // 3. Добавляем автомобиль
                    db.query(
                        'INSERT INTO cars (id_model, year, mileage, vin_code, license_plate, id) VALUES (?, ?, ?, ?, ?, ?)',
                        [modelId, year, mileage, vin_code, license_plate, userId],
                        (err) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({ message: 'Ошибка при добавлении машины' });
                            }
                            res.status(200).json({ message: 'Машина успешно добавлена' });
                        }
                    );
                }
            }
        );
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Неверный токен' });
    }
};

// обновление автомобиля
exports.updateCar = (req, res) => {
    const { model_name, brand_name, year, mileage, vin_code, license_plate } = req.body;
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const userId = decoded.id;
        const carId = req.params.id;

        // 1. Сначала проверяем/добавляем бренд
        db.query(
            'SELECT id_brand FROM brand WHERE brand_name = ?', 
            [brand_name],
            (err, brandResults) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Ошибка при поиске бренда' });
                }

                let brandId;
                if (brandResults.length > 0) {
                    brandId = brandResults[0].id_brand;
                    processModel(brandId);
                } else {
                    // Добавляем новый бренд
                    db.query(
                        'INSERT INTO brand (brand_name) VALUES (?)',
                        [brand_name],
                        (err, insertBrandResult) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({ message: 'Ошибка при добавлении бренда' });
                            }
                            brandId = insertBrandResult.insertId;
                            processModel(brandId);
                        }
                    );
                }

                function processModel(brandId) {
                    // 2. Проверяем/добавляем модель
                    db.query(
                        'SELECT id_model FROM model WHERE model_name = ? AND id_brand = ?',
                        [model_name, brandId],
                        (err, modelResults) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({ message: 'Ошибка при поиске модели' });
                            }

                            let modelId;
                            if (modelResults.length > 0) {
                                modelId = modelResults[0].id_model;
                                updateCar(modelId);
                            } else {
                                // Добавляем новую модель
                                db.query(
                                    'INSERT INTO model (model_name, id_brand) VALUES (?, ?)',
                                    [model_name, brandId],
                                    (err, insertModelResult) => {
                                        if (err) {
                                            console.error(err);
                                            return res.status(500).json({ message: 'Ошибка при добавлении модели' });
                                        }
                                        modelId = insertModelResult.insertId;
                                        updateCar(modelId);
                                    }
                                );
                            }
                        }
                    );
                }

                function updateCar(modelId) {
                    // 3. Обновляем автомобиль
                    db.query(
                        'UPDATE cars SET id_model = ?, year = ?, mileage = ?, vin_code = ?, license_plate = ? WHERE id_car = ? AND id = ?',
                        [modelId, year, mileage, vin_code, license_plate, carId, userId],
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
                }
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
// exports.getCars = (req, res) => {
//     const token = req.headers.authorization;

//     if (!token) {
//         return res.status(401).json({ message: 'Токен не предоставлен' });
//     }

//     try {
//         const decoded = jwt.verify(token, 'your_jwt_secret');
//         const userId = decoded.id;

//         db.query(
//             'SELECT id_car, model, brand, year, mileage, vin_code, license_plate FROM cars WHERE id = ?',
//             [userId],
//             (err, result) => {
//                 if (err) {
//                     console.error(err);
//                     return res.status(500).json({ message: 'Ошибка при получении списка машин' });
//                 }

//                 res.status(200).json(result);
//             }
//         );
//     } catch (err) {
//         console.error(err);
//         res.status(403).json({ message: 'Неверный токен' });
//     }
// };
exports.getCars = (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const userId = decoded.id;

        const query = `
            SELECT 
                c.id_car,
                m.model_name,
                b.brand_name,
                c.year,
                c.mileage,
                c.vin_code,
                c.license_plate,
                c.link_img
            FROM cars c
            JOIN model m ON c.id_model = m.id_model
            JOIN brand b ON m.id_brand = b.id_brand
            WHERE c.id = ?
        `;

        db.query(query, [userId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Ошибка при получении списка машин' });
            }

            res.status(200).json(result);
        });
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Неверный токен' });
    }
};
