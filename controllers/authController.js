const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

//регистрация
exports.register = (req, res) => {
  const { username, email, password } = req.body;

  let errors = [];

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(ru|com)$/;
  if (!email || !emailRegex.test(email)) {
    errors.push("Email должен содержать '@' и заканчиваться на .ru или .com.");
  }

  if (!password || password.length < 8) {
    errors.push("Пароль должен содержать минимум 8 символов.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ message: 'Ошибка хэширования' });
    }

    db.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
      [username, email, hashedPassword], 
      (err, result) => {
        if (err) {
          console.error('Ошибка добавления:', err);
          return res.status(500).json({ message: 'Ошибка сохранения', error: err });
        }
        res.status(200).json({ message: 'Регистрация прошла успешно' });
      }
    );
  });
};

//авторизация 
exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
    if (err || result.length === 0) {
      return res.status(400).json({ message: 'Данные не верные' });
    }

    const user = result[0];
    
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (!isMatch) {
        return res.status(400).json({ message: 'Данные не верные' });
      }
      
      // Надо исправить!!!
      
      const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, 'your_jwt_secret', { expiresIn: '1h' });

      res.status(200).json({ token, username: user.username, email: user.email });
    });
  });
};

//получение
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

//редактирование
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

//удаление
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
