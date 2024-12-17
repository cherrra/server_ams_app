const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Регистрация пользователя
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

// Авторизация пользователя
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

      const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, 'your_jwt_secret', { expiresIn: '1h' });

      res.status(200).json({ token, username: user.username, email: user.email });
    });
  });
};
