const jwt = require('jsonwebtoken');
const db = require('../config/db');
const jwtConfig = require('../config/jwt.config');

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  return parts.length === 2 ? parts[1] : null;
}

exports.getServices = (req, res) => {
    const token = extractToken(req);
    const categoryId = req.query.id_category;

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    if (!categoryId) {
        return res.status(400).json({ message: 'Не указан id категории' });
    }

    try {
        jwt.verify(token, jwtConfig.access.secret);
        const query = 'SELECT id_service, service_name, description, price, id_category FROM services WHERE id_category = ?';

        db.query(query, [categoryId], (err, services) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Ошибка при получении данных' });
            }

            res.status(200).json(services);
        });
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Неверный токен' });
    }
};

exports.addService = (req, res) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, jwtConfig.access.secret);
        const adminId = decoded.id;

        db.query('SELECT is_admin FROM users WHERE id = ?', [adminId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Ошибка проверки прав' });
            }

            if (!result.length || !result[0].is_admin) {
                return res.status(403).json({ message: 'Недостаточно прав' });
            }

            const { service_name, price, description, id_category } = req.body;

            db.query(
                'INSERT INTO services (service_name, price, description, id_category) VALUES (?, ?, ?, ?)',
                [service_name, price, description, id_category],
                (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: 'Ошибка добавления услуги' });
                    }

                    res.status(201).json({ 
                        message: 'Услуга успешно добавлена', 
                        serviceId: result.insertId 
                    });
                }
            );
        });
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Неверный или просроченный токен' });
    }
};

exports.updateService = (req, res) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, jwtConfig.access.secret);
        const adminId = decoded.id;

        db.query('SELECT is_admin FROM users WHERE id = ?', [adminId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Ошибка проверки прав' });
            }

            if (!result.length || !result[0].is_admin) {
                return res.status(403).json({ message: 'Недостаточно прав' });
            }

            const serviceId = req.params.id;
            const { service_name, price, description } = req.body;

            db.query(
                'UPDATE services SET service_name = ?, price = ?, description = ? WHERE id_service = ?',
                [service_name, price, description, serviceId],
                (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: 'Ошибка обновления услуги' });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: 'Услуга не найдена' });
                    }

                    res.status(200).json({ message: 'Услуга успешно обновлена' });
                }
            );
        });
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Неверный или просроченный токен' });
    }
};

exports.deleteService = (req, res) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, jwtConfig.access.secret);
        const adminId = decoded.id;

        db.query('SELECT is_admin FROM users WHERE id = ?', [adminId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Ошибка проверки прав' });
            }

            if (!result.length || !result[0].is_admin) {
                return res.status(403).json({ message: 'Недостаточно прав' });
            }

            const serviceId = req.params.id;

            db.query('DELETE FROM services WHERE id_service = ?', [serviceId], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Ошибка удаления услуги' });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Услуга не найдена' });
                }

                res.status(200).json({ message: 'Услуга успешно удалена' });
            });
        });
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Неверный или просроченный токен' });
    }
};