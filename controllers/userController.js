const jwt = require('jsonwebtoken');
const db = require('../config/db');
const jwtConfig = require('../config/jwt.config');

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}

exports.getUser = (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: 'Токен не предоставлен' });

  try {
    const decoded = jwt.verify(token, jwtConfig.access.secret);
    const userId = decoded.id;

    db.query(
      'SELECT id, username, email, DATE_FORMAT(birth_date, "%d.%m.%Y") AS birth_date, phone_number, link_img FROM users WHERE id = ?',
      [userId],
      (err, result) => {
        if (err) {
          console.error('Ошибка при получении пользователя:', err);
          return res.status(500).json({ message: 'Ошибка сервера' });
        }

        if (result.length === 0) {
          return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.status(200).json(result[0]);
      }
    );
  } catch (err) {
    console.error('Ошибка проверки токена:', err);
    res.status(403).json({ message: 'Неверный или просроченный токен' });
  }
};

exports.getAllUsers = (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: 'Токен не предоставлен' });

  try {
    const decoded = jwt.verify(token, jwtConfig.access.secret);
    const userId = decoded.id;

    db.query('SELECT is_admin FROM users WHERE id = ?', [userId], (err, result) => {
      if (err) {
        console.error('Ошибка проверки прав пользователя:', err);
        return res.status(500).json({ message: 'Ошибка проверки прав' });
      }

      if (result.length === 0 || !result[0].is_admin) {
        return res.status(403).json({ message: 'Нет прав для просмотра пользователей' });
      }

      const query = `
        SELECT 
          u.id, 
          u.username, 
          u.email, 
          u.link_img,
          JSON_ARRAYAGG(
            CASE 
              WHEN c.id_car IS NOT NULL THEN 
                JSON_OBJECT(
                  'id_car', c.id_car,
                  'model', JSON_OBJECT(
                    'id_model', m.id_model,
                    'model_name', m.model_name,
                    'brand', JSON_OBJECT(
                      'id_brand', b.id_brand,
                      'brand_name', b.brand_name
                    )
                  ),
                  'year', c.year,
                  'license_plate', c.license_plate
                )
              ELSE NULL
            END
          ) AS cars
        FROM users u
        LEFT JOIN cars c ON u.id = c.id
        LEFT JOIN model m ON c.id_model = m.id_model
        LEFT JOIN brand b ON m.id_brand = b.id_brand
        WHERE u.email NOT LIKE '%@admin-mail%' 
        GROUP BY u.id
      `;

      db.query(query, (err, users) => {
        if (err) {
          console.error('Ошибка при получении пользователей:', err);
          return res.status(500).json({ message: 'Ошибка при получении данных' });
        }

        const formattedUsers = users.map(user => {
          try {
            if (Array.isArray(user.cars)) {
              user.cars = user.cars.filter(car => car !== null);
            } else {
              user.cars = [];
            }
            return user;
          } catch (e) {
            console.error('Ошибка при обработке машин:', e);
            user.cars = [];
            return user;
          }
        });

        res.status(200).json(formattedUsers);
      });
    });
  } catch (err) {
    console.error('Ошибка проверки токена:', err);
    res.status(403).json({ message: 'Неверный или просроченный токен' });
  }
};

exports.deleteUserByAdmin = (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: 'Токен не предоставлен' });

  try {
    const decoded = jwt.verify(token, jwtConfig.access.secret);
    const adminId = decoded.id;

    db.query('SELECT is_admin FROM users WHERE id = ?', [adminId], (err, result) => {
      if (err) {
        console.error('Ошибка проверки прав администратора:', err);
        return res.status(500).json({ message: 'Ошибка проверки прав' });
      }

      if (result.length === 0 || !result[0].is_admin) {
        return res.status(403).json({ message: 'Недостаточно прав' });
      }

      const userId = req.params.id;

      db.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) {
          console.error('Ошибка удаления пользователя:', err);
          return res.status(500).json({ message: 'Ошибка удаления' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.status(200).json({ message: 'Пользователь успешно удален' });
      });
    });
  } catch (err) {
    console.error('Ошибка проверки токена:', err);
    res.status(403).json({ message: 'Неверный или просроченный токен' });
  }
};