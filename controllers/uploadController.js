const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.uploadImage = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // Извлекаем токен из Bearer

  if (!token) return res.status(401).json({ message: 'Токен не предоставлен' });

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const userId = decoded.id;

    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }

    const imagePath = `uploads/${req.file.filename}`;
    const fullImageUrl = `http://localhost:5000/${imagePath}`;

    db.query('UPDATE users SET link_img = ? WHERE id = ?', [imagePath, userId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Ошибка обновления базы данных' });
      }
      res.status(200).json({ 
        message: 'Изображение успешно загружено', 
        link: fullImageUrl 
      });
    });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: 'Неверный токен' });
  }
};