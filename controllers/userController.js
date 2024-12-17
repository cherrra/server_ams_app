const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Получение данных пользователя
exports.getUser = (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const userId = decoded.id;

        db.query(
            'SELECT id, username, email, DATE_FORMAT(birth_date, "%d.%m.%Y") AS birth_date, gender, phone_number, link_img FROM users WHERE id = ?',
            [userId],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Ошибка сервера' });
                }

                if (result.length === 0) {
                    return res.status(404).json({ message: 'Пользователь не найден' });
                }

                res.status(200).json(result[0]);
            }
        );
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Неверный токен' });
    }
};

// Обновление данных пользователя
exports.updateUser = (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const userId = decoded.id;

        const { username, email, birth_date, gender, phone_number } = req.body;

        db.query(
            'UPDATE users SET username = ?, email = ?, birth_date = ?, gender = ?, phone_number = ? WHERE id = ?',
            [username, email, birth_date, gender, phone_number, userId],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Ошибка сервера' });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Пользователь не найден' });
                }

                res.status(200).json({ message: 'Данные успешно обновлены' });
            }
        );
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Неверный токен' });
    }
};

// Удаление собственного аккаунта
exports.deleteOwnAccount = (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const userId = decoded.id;

        db.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Ошибка при удалении аккаунта' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Пользователь не найден' });
            }

            res.status(200).json({ message: 'Аккаунт успешно удалён' });
        });
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Неверный токен' });
    }
};

// Получение всех пользователей (админка)
exports.getAllUsers = (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const userId = decoded.id;

        db.query(
            'SELECT is_admin FROM users WHERE id = ?',
            [userId],
            (err, result) => {
                if (err || !result.length || !result[0].is_admin) {
                    return res.status(403).json({ message: 'Нет прав для просмотра пользователей' });
                }

                const query = `
                    SELECT 
                        u.id, 
                        u.username, 
                        u.email, 
                        GROUP_CONCAT(c.model ORDER BY c.model SEPARATOR ', ') AS cars 
                    FROM 
                        users u
                    LEFT JOIN 
                        cars c 
                    ON 
                        u.id = c.id
                    WHERE 
                        u.email NOT LIKE '%@admin-mail%' 
                    GROUP BY 
                        u.id
                `;

                db.query(query, (err, users) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: 'Ошибка при получении данных' });
                    }

                    res.status(200).json(users);
                });
            }
        );
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Неверный токен' });
    }
};

// Удаление пользователя администратором
exports.deleteUserByAdmin = (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const adminId = decoded.id;

        db.query('SELECT is_admin FROM users WHERE id = ?', [adminId], (err, result) => {
            if (err || !result.length || !result[0].is_admin) {
                return res.status(403).json({ message: 'Недостаточно прав' });
            }

            const userId = req.params.id;
            db.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Ошибка удаления' });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Пользователь не найден' });
                }

                res.status(200).json({ message: 'Пользователь успешно удален' });
            });
        });
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Неверный токен' });
    }
};

