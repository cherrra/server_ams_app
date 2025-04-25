const jwt = require('jsonwebtoken');
const db = require('../config/db');
const jwtConfig = require('../config/jwt.config');

// Функция для извлечения токена из заголовка
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}

exports.uploadImage = async (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: 'Токен не предоставлен' });

  try {
    const decoded = jwt.verify(token, jwtConfig.access.secret);
    const userId = decoded.id;

    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }

    const imagePath = `uploads/${req.file.filename}`;
    const fullImageUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/${imagePath}`;

    // Используем promise-интерфейс для работы с async/await
    await db.promise().query(
      'UPDATE users SET link_img = ? WHERE id = ?', 
      [imagePath, userId]
    );

    res.status(200).json({
      message: 'Изображение профиля успешно загружено',
      link: fullImageUrl
    });
  } catch (err) {
    console.error('Ошибка при загрузке изображения профиля:', err);
    
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ message: 'Неверный токен' });
    }
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ message: 'Токен просрочен' });
    }
    
    res.status(500).json({ message: 'Ошибка сервера при загрузке изображения' });
  }
};

exports.uploadImageCar = async (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: 'Токен не предоставлен' });

  try {
    const decoded = jwt.verify(token, jwtConfig.access.secret);
    const userId = decoded.id;
    const carId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }

    const imagePath = `uploads/${req.file.filename}`;
    const fullImageUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/${imagePath}`;

    // Проверяем принадлежность автомобиля пользователю
    const [carRows] = await db.promise().query(
      'SELECT id FROM cars WHERE id_car = ?', 
      [carId]
    );

    if (carRows.length === 0) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }

    if (parseInt(carRows[0].id) !== parseInt(userId)) {
      return res.status(403).json({ message: 'Нет доступа к этому автомобилю' });
    }

    // Обновляем изображение автомобиля
    await db.promise().query(
      'UPDATE cars SET link_img = ? WHERE id_car = ?', 
      [imagePath, carId]
    );

    res.status(200).json({
      message: 'Изображение автомобиля успешно загружено',
      link: fullImageUrl
    });

  } catch (err) {
    console.error('Ошибка при загрузке изображения автомобиля:', err);
    
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ message: 'Неверный токен' });
    }
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ message: 'Токен просрочен' });
    }
    
    res.status(500).json({ message: 'Ошибка сервера при загрузке изображения' });
  }
};