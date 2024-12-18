const jwt = require('jsonwebtoken');
const db = require('../config/db');

//получение
exports.getCategories = (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  try {
    jwt.verify(token, 'your_jwt_secret');
    const query = 'SELECT id_category, category_name FROM categories';

    db.query(query, (err, categories) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Ошибка при получении данных' });
      }

      res.status(200).json(categories);
    });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: 'Неверный токен' });
  }
};

//получение админ
exports.getCategoriesAdmin = (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const userId = decoded.id;

    db.query('SELECT is_admin FROM users WHERE id = ?', [userId], (err, result) => {
      if (err || !result.length || !result[0].is_admin) {
        return res.status(403).json({ message: 'Нет прав для просмотра категорий' });
      }

      const query = 'SELECT id_category, category_name FROM categories';
      db.query(query, (err, categories) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Ошибка при получении данных' });
        }

        res.status(200).json(categories);
      });
    });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: 'Неверный токен' });
  }
};

//добавление
exports.addCategory = (req, res) => {
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

      const { category_name } = req.body;

      db.query(
        'INSERT INTO categories (category_name) VALUES (?)',
        [category_name],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Ошибка добавления категории' });
          }

          res.status(201).json({ message: 'Категория успешно добавлена', categoryId: result.insertId });
        }
      );
    });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: 'Неверный токен' });
  }
};

//обновление
exports.updateCategory = (req, res) => {
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

      const categoryId = req.params.id;
      const { category_name } = req.body;

      db.query(
        'UPDATE categories SET category_name = ? WHERE id_category = ?',
        [category_name, categoryId],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Ошибка обновления категории' });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Категория не найдена' });
          }

          res.status(200).json({ message: 'Категория успешно обновлена' });
        }
      );
    });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: 'Неверный токен' });
  }
};

//удаление
exports.deleteCategory = (req, res) => {
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

      const categoryId = req.params.id;

      db.query('DELETE FROM categories WHERE id_category = ?', [categoryId], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Ошибка удаления категории' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Категория не найдена' });
        }

        res.status(200).json({ message: 'Категория успешно удалена' });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: 'Неверный токен' });
  }
};
