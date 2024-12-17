const jwt = require('jsonwebtoken');
const db = require('../config/db'); 

//получение 
exports.getUserOrders = (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: 'Токен не предоставлен' });
    }
  
    try {
      const decoded = jwt.verify(token, 'your_jwt_secret');
      const userId = decoded.id;
  
      db.query(
        `SELECT 
            o.id_order, 
            c.model AS car_model, 
            o.id AS user_id, 
            o.order_date, 
            o.order_time, 
            o.total_price, 
            o.status, 
            o.comment,
            GROUP_CONCAT(s.service_name SEPARATOR ', ') AS services
         FROM orders o
         JOIN cars c ON o.id_car = c.id_car
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
  
          res.status(200).json(result);
        }
      );
    } catch (err) {
      console.error('Ошибка проверки токена:', err);
      res.status(403).json({ message: 'Неверный токен' });
    }
};

//получение админ
exports.getAdminOrders = (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: 'Токен не предоставлен' });
    }
  
    try {
      const decoded = jwt.verify(token, 'your_jwt_secret');
      const userId = decoded.id;
  
      db.query('SELECT is_admin FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) {
          console.error('Ошибка получения прав пользователя:', err);
          return res.status(500).json({ message: 'Ошибка проверки прав' });
        }
  
        if (result.length === 0 || !result[0].is_admin) {
          return res.status(403).json({ message: 'Недостаточно прав доступа' });
        }
  
        db.query(
          `SELECT 
            o.id_order, 
            u.username AS user_name, 
            u.email AS user_email, 
            c.model AS car_model, 
            o.order_date, 
            o.order_time, 
            o.total_price, 
            o.status, 
            o.comment, 
            GROUP_CONCAT(s.service_name SEPARATOR ', ') AS services
          FROM orders o
          JOIN users u ON o.id = u.id
          JOIN cars c ON o.id_car = c.id_car
          LEFT JOIN order_services os ON o.id_order = os.id_order
          LEFT JOIN services s ON os.id_service = s.id_service
          GROUP BY o.id_order`,
          (err, results) => {
            if (err) {
              console.error('Ошибка получения заказов:', err);
              return res.status(500).json({ message: 'Ошибка получения заказов' });
            }
  
            res.status(200).json(results);
          }
        );
      });
    } catch (err) {
      console.error('Ошибка проверки токена:', err);
      res.status(403).json({ message: 'Неверный токен' });
    }
};

//обновление статуса 
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
      const decoded = jwt.verify(token, 'your_jwt_secret');
      const userId = decoded.id;
  
      db.query('SELECT is_admin FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) {
          console.error('Ошибка проверки прав пользователя:', err);
          return res.status(500).json({ message: 'Ошибка проверки прав' });
        }
  
        if (result.length === 0 || !result[0].is_admin) {
          return res.status(403).json({ message: 'Недостаточно прав доступа' });
        }
  
        db.query(
          'UPDATE orders SET status = ? WHERE id_order = ?',
          [status, orderId],
          (err, updateResult) => {
            if (err) {
              console.error('Ошибка обновления статуса заказа:', err);
              return res.status(500).json({ message: 'Ошибка обновления заказа' });
            }
  
            if (updateResult.affectedRows === 0) {
              return res.status(404).json({ message: 'Заказ не найден' });
            }
  
            res.status(200).json({ message: 'Статус заказа успешно обновлен' });
          }
        );
      });
    } catch (err) {
      console.error('Ошибка проверки токена:', err);
      res.status(403).json({ message: 'Неверный токен' });
    }
};

//создание 
exports.createOrder = (req, res) => {
  console.log('Полученные данные:', req.body);

  const token = req.headers.authorization;
  if (!token) {
      return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  try {
      const decoded = jwt.verify(token, 'your_jwt_secret');
      const userId = decoded.id;

      const { id_car, order_date, order_time, comment, total_price, services } = req.body;

      if (!services || services.length === 0) {
          return res.status(400).json({ message: 'Услуги не предоставлены' });
      }

      const parsedServices = services.map(serviceStr => {
          try {
              return JSON.parse(serviceStr);
          } catch (e) {
              console.error('Ошибка парсинга услуги:', serviceStr);
              return null;
          }
      }).filter(service => service !== null); // Удаляем невалидные данные

      if (parsedServices.length === 0) {
          return res.status(400).json({ message: 'Некорректные данные услуг' });
      }

      // Вставляем заказ в таблицу orders
      db.query(
          `INSERT INTO orders (id, id_car, order_date, order_time, comment, total_price, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, id_car, order_date, order_time, comment, total_price, 'created'],
          (err, result) => {
              if (err) {
                  console.error('Ошибка при создании заказа:', err);
                  return res.status(500).json({ message: 'Ошибка при создании заказа' });
              }

              const orderId = result.insertId;

              const serviceValues = parsedServices.map(service => [
                  orderId, // id_order
                  service.id_service, // id_service
                  service.price // price
              ]);

          
              db.query(
                  `INSERT INTO order_services (id_order, id_service, price) VALUES ?`,
                  [serviceValues],
                  (err) => {
                      if (err) {
                          console.error('Ошибка при добавлении услуг:', err);
                          return res.status(500).json({ message: 'Ошибка при добавлении услуг' });
                      }
                      res.status(201).json({ message: 'Заказ успешно создан', orderId });
                  }
              );
          }
      );
  } catch (err) {
      console.error('Ошибка проверки токена:', err);
      res.status(403).json({ message: 'Неверный токен' });
  }
};


//удаление 
exports.deleteOrder = (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
      return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  try {
      const decoded = jwt.verify(token, 'your_jwt_secret');
      const userId = decoded.id;
      const orderId = req.params.id;

      db.query(
          `DELETE FROM orders WHERE id_order = ? AND id = ?`,
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