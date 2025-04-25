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

exports.uploadImage = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Токен не предоставлен' });

  try {
    const decoded = jwt.verify(token, jwtConfig.access.secret); // Используем access.secret
    const userId = decoded.id;

    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }

    const imagePath = `uploads/${req.file.filename}`;
    const fullImageUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/${imagePath}`;

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
    res.status(403).json({ message: 'Неверный или просроченный токен' });
  }
};

exports.uploadImageCar = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const carId = req.params.id;

  if (!token) return res.status(401).json({ message: 'Токен не предоставлен' });

  try {
    const decoded = jwt.verify(token, jwtConfig.access.secret); // Используем access.secret
    const userId = decoded.id;

    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }

    const imagePath = `uploads/${req.file.filename}`;
    const fullImageUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/${imagePath}`;

    const [rows] = await db.promise().query('SELECT id_car, id FROM cars WHERE id_car = ?', [carId]);
    const car = rows[0];

    if (!car) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }

    if (parseInt(car.id) !== parseInt(userId)) {
      return res.status(403).json({ message: 'Нет доступа к этому автомобилю' });
    }

    await db.promise().query('UPDATE cars SET link_img = ? WHERE id_car = ?', [imagePath, carId]);

    res.status(200).json({
      message: 'Изображение успешно загружено',
      link: fullImageUrl
    });

  } catch (err) {
    console.error(err);
    res.status(403).json({ message: 'Неверный или просроченный токен' });
  }
};
