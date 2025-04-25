const jwt = require('jsonwebtoken');
const db = require('../config/db'); 

const jwtConfig = {
    access: {
      secret: 'your_access_jwt_secret',
      expiresIn: '15m'
    },
    refresh: {
      secret: 'your_refresh_jwt_secret',
      expiresIn: '7d'
    }
  };

exports.getUserOrders = (req, res) => {
    const token = req.headers.authorization;
  
    if (!token) {
      return res.status(401).json({ message: 'Токен не предоставлен' });
    }
  
    try {
      const decoded = jwt.verify(token, jwtConfig.access.secret);
      const userId = decoded.id;
  
      db.query(`
        SELECT 
          o.id_order,
          o.order_date,
          o.order_time,
          o.total_price,
          o.status,
          o.comment,
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
            'mileage', c.mileage,
            'vin_code', c.vin_code,
            'license_plate', c.license_plate
          ) AS car,
          GROUP_CONCAT(s.service_name SEPARATOR ', ') AS services
        FROM orders o
        JOIN cars c ON o.id_car = c.id_car
        JOIN model m ON c.id_model = m.id_model
        JOIN brand b ON m.id_brand = b.id_brand
        LEFT JOIN order_services os ON o.id_order = os.id_order
        LEFT JOIN services s ON os.id_service = s.id_service
        WHERE o.id = ?
        GROUP BY o.id_order`,
        [userId],
        (err, result) => {
          if (err) {
            console.error('Ошибка при получении заказов:', err);
            return res.status(500).json({ message: 'Ошибка при получении заказов' });
          }
  
          const formattedResult = result.map(order => {
            try {
              return {
                ...order,
                car: JSON.parse(order.car)
              };
            } catch (e) {
              console.error('Ошибка парсинга данных автомобиля:', e);
              return order;
            }
          });
  
          res.status(200).json(formattedResult);
        }
      );
    } catch (err) {
      console.error('Ошибка проверки токена:', err);
      res.status(403).json({ message: 'Неверный токен' });
    }
  };

  exports.getAdminOrders = (req, res) => {
    const token = req.headers.authorization;
  
    if (!token) {
      return res.status(401).json({ message: 'Токен не предоставлен' });
    }
  
    try {
      const decoded = jwt.verify(token, jwtConfig.access.secret);
      const userId = decoded.id;
  
      db.query('SELECT is_admin FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) {
          console.error('Ошибка получения прав пользователя:', err);
          return res.status(500).json({ message: 'Ошибка проверки прав' });
        }
  
        if (result.length === 0 || !result[0].is_admin) {
          return res.status(403).json({ message: 'Недостаточно прав доступа' });
        }
  
        db.query(`
          SELECT 
            o.id_order,
            u.username AS user_name,
            u.email AS user_email,
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
              'mileage', c.mileage,
              'vin_code', c.vin_code,
              'license_plate', c.license_plate
            ) AS car,
            o.order_date,
            o.order_time,
            o.total_price,
            o.status,
            o.comment,
            GROUP_CONCAT(s.service_name SEPARATOR ', ') AS services
          FROM orders o
          JOIN users u ON o.id = u.id
          JOIN cars c ON o.id_car = c.id_car
          JOIN model m ON c.id_model = m.id_model
          JOIN brand b ON m.id_brand = b.id_brand
          LEFT JOIN order_services os ON o.id_order = os.id_order
          LEFT JOIN services s ON os.id_service = s.id_service
          GROUP BY o.id_order`,
          (err, results) => {
            if (err) {
              console.error('Ошибка получения заказов:', err);
              return res.status(500).json({ message: 'Ошибка получения заказов' });
            }
  
            const formattedResults = results.map(order => {
              try {
                return {
                  ...order,
                  car: JSON.parse(order.car)
                };
              } catch (e) {
                console.error('Ошибка парсинга данных автомобиля:', e);
                return order;
              }
            });
  
            res.status(200).json(formattedResults);
          }
        );
      });
    } catch (err) {
      console.error('Ошибка проверки токена:', err);
      res.status(403).json({ message: 'Неверный токен' });
    }
  };

  
  exports.updateOrderStatus = (req, res) => {
    const token = req.headers.authorization;
    const { status } = req.body;
    const orderId = req.params.id;
  
    if (!token) {
      return res.status(401).json({ message: 'Токен не предоставлен' });
    }
  
    if (!status) {
      return res.status(400).json({ message: 'Статус не указан' });
    }
  
    try {
      const decoded = jwt.verify(token, jwtConfig.access.secret);
      const userId = decoded.id;
  
      db.query('SELECT is_admin FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) {
          console.error('Ошибка проверки прав пользователя:', err);
          return res.status(500).json({ message: 'Ошибка проверки прав' });
        }
  
        if (result.length === 0 || !result[0].is_admin) {
          return res.status(403).json({ message: 'Недостаточно прав доступа' });
        }
  
        db.query('UPDATE orders SET status = ? WHERE id_order = ?', [status, orderId], (err, updateResult) => {
          if (err) {
            console.error('Ошибка обновления статуса заказа:', err);
            return res.status(500).json({ message: 'Ошибка обновления заказа' });
          }
  
          if (updateResult.affectedRows === 0) {
            return res.status(404).json({ message: 'Заказ не найден' });
          }
  
          res.status(200).json({ message: 'Статус заказа успешно обновлен' });
        });
      });
    } catch (err) {
      console.error('Ошибка проверки токена:', err);
      res.status(403).json({ message: 'Неверный токен' });
    }
  };

  
  exports.createOrder = (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: 'Токен не предоставлен' });
    }
  
    try {
      const decoded = jwt.verify(token, jwtConfig.access.secret);
      const userId = decoded.id;
  
      const { id_car, order_date, order_time, comment, total_price, services } = req.body;
  
      if (!services || services.length === 0) {
        return res.status(400).json({ message: 'Услуги не предоставлены' });
      }
  
      db.query(`
        INSERT INTO orders (id, id_car, order_date, order_time, comment, total_price, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, id_car, order_date, order_time, comment, total_price, 'created'],
        (err, result) => {
          if (err) {
            console.error('Ошибка при создании заказа:', err);
            return res.status(500).json({ message: 'Ошибка при создании заказа' });
          }
  
          const orderId = result.insertId;
          const serviceValues = services.map(s => [orderId, s.id_service, s.price]);
  
          db.query(`INSERT INTO order_services (id_order, id_service, price) VALUES ?`, [serviceValues], (err) => {
            if (err) {
              console.error('Ошибка при добавлении услуг:', err);
              return res.status(500).json({ message: 'Ошибка при добавлении услуг' });
            }
  
            db.query(`
              SELECT 
                o.*,
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
                  'mileage', c.mileage,
                  'vin_code', c.vin_code,
                  'license_plate', c.license_plate
                ) AS car,
                GROUP_CONCAT(s.service_name SEPARATOR ', ') AS services
              FROM orders o
              JOIN cars c ON o.id_car = c.id_car
              JOIN model m ON c.id_model = m.id_model
              JOIN brand b ON m.id_brand = b.id_brand
              LEFT JOIN order_services os ON o.id_order = os.id_order
              LEFT JOIN services s ON os.id_service = s.id_service
              WHERE o.id_order = ?
              GROUP BY o.id_order`,
              [orderId],
              (err, results) => {
                if (err || results.length === 0) {
                  console.error('Ошибка получения данных заказа:', err);
                  return res.status(201).json({ message: 'Заказ успешно создан', orderId });
                }
  
                const order = results[0];
                try {
                  order.car = JSON.parse(order.car);
                } catch (e) {
                  console.error('Ошибка парсинга данных автомобиля:', e);
                }
  
                res.status(201).json(order);
              }
            );
          });
        }
      );
    } catch (err) {
      console.error('Ошибка проверки токена:', err);
      res.status(403).json({ message: 'Неверный токен' });
    }
  };

  
  exports.deleteOrder = (req, res) => {
    const token = req.headers.authorization;
  
    if (!token) {
      return res.status(401).json({ message: 'Токен не предоставлен' });
    }
  
    try {
      const decoded = jwt.verify(token, jwtConfig.access.secret);
      const userId = decoded.id;
      const orderId = req.params.id;
  
      db.query(
        'DELETE FROM orders WHERE id_order = ? AND id = ?',
        [orderId, userId],
        (err, result) => {
          if (err) {
            console.error('Ошибка при удалении заказа:', err);
            return res.status(500).json({ message: 'Ошибка при удалении заказа' });
          }
  
          if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Заказ успешно удалён' });
          } else {
            res.status(404).json({ message: 'Заказ не найден' });
          }
        }
      );
    } catch (err) {
      console.error('Ошибка проверки токена:', err);
      res.status(403).json({ message: 'Неверный токен' });
    }
  };
  