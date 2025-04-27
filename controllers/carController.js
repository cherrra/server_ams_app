const jwt = require('jsonwebtoken');
const db = require('../config/db');
const jwtConfig = require('../config/jwt.config'); 

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}

exports.getCars = (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: 'Токен не предоставлен' });

  try {
    const decoded = jwt.verify(token, jwtConfig.access.secret);
    const userId = decoded.id;

    const query = `
      SELECT 
        c.id_car,
        m.model_name,
        b.brand_name,
        c.year,
        c.mileage,
        c.vin_code,
        c.license_plate,
        c.link_img
      FROM cars c
      JOIN model m ON c.id_model = m.id_model
      JOIN brand b ON m.id_brand = b.id_brand
      WHERE c.id = ?
    `;

    db.query(query, [userId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Ошибка при получении списка машин' });
      }

      res.status(200).json(result);
    });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: 'Неверный или просроченный токен' });
  }
};

exports.addCar = (req, res) => {
  const token = extractToken(req);
  const { model_name, brand_name, year, mileage, vin_code, license_plate } = req.body;

  if (!token) return res.status(401).json({ message: 'Токен не предоставлен' });

  if (!model_name || !brand_name || !year || !license_plate) {
    return res.status(400).json({ message: 'Необходимо указать модель, марку, год и номерной знак' });
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.access.secret);
    const userId = decoded.id;

    db.query('SELECT id_brand FROM brand WHERE brand_name = ?', [brand_name], (err, brandResults) => {
      if (err) return res.status(500).json({ message: 'Ошибка при поиске бренда' });

      let brandId;
      if (brandResults.length > 0) {
        brandId = brandResults[0].id_brand;
        processModel(brandId);
      } else {
        db.query('INSERT INTO brand (brand_name) VALUES (?)', [brand_name], (err, insertBrandResult) => {
          if (err) return res.status(500).json({ message: 'Ошибка при добавлении бренда' });
          brandId = insertBrandResult.insertId;
          processModel(brandId);
        });
      }

      function processModel(brandId) {
        db.query(
          'SELECT id_model FROM model WHERE model_name = ? AND id_brand = ?',
          [model_name, brandId],
          (err, modelResults) => {
            if (err) return res.status(500).json({ message: 'Ошибка при поиске модели' });

            let modelId;
            if (modelResults.length > 0) {
              modelId = modelResults[0].id_model;
              addCar(modelId);
            } else {
              db.query(
                'INSERT INTO model (model_name, id_brand) VALUES (?, ?)',
                [model_name, brandId],
                (err, insertModelResult) => {
                  if (err) return res.status(500).json({ message: 'Ошибка при добавлении модели' });
                  modelId = insertModelResult.insertId;
                  addCar(modelId);
                }
              );
            }
          }
        );
      }

      function addCar(modelId) {
        db.query(
          'INSERT INTO cars (id_model, year, mileage, vin_code, license_plate, id) VALUES (?, ?, ?, ?, ?, ?)',
          [modelId, year, mileage || null, vin_code || null, license_plate, userId],
          (err, result) => {
            if (err) return res.status(500).json({ message: 'Ошибка при добавлении машины' });

            res.status(201).json({
              message: 'Машина успешно добавлена',
              carId: result.insertId
            });
          }
        );
      }
    });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: 'Неверный или просроченный токен' });
  }
};

exports.updateCar = (req, res) => {
  const token = extractToken(req);
  const { model_name, brand_name, year, mileage, vin_code, license_plate } = req.body;
  const carId = req.params.id;

  if (!token) return res.status(401).json({ message: 'Токен не предоставлен' });

  if (!model_name || !brand_name || !year || !license_plate) {
    return res.status(400).json({ message: 'Необходимо указать модель, марку, год и номерной знак' });
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.access.secret);
    const userId = decoded.id;

    db.query('SELECT id_brand FROM brand WHERE brand_name = ?', [brand_name], (err, brandResults) => {
      if (err) return res.status(500).json({ message: 'Ошибка при поиске бренда' });

      let brandId;
      if (brandResults.length > 0) {
        brandId = brandResults[0].id_brand;
        processModel(brandId);
      } else {
        db.query('INSERT INTO brand (brand_name) VALUES (?)', [brand_name], (err, insertBrandResult) => {
          if (err) return res.status(500).json({ message: 'Ошибка при добавлении бренда' });
          brandId = insertBrandResult.insertId;
          processModel(brandId);
        });
      }

      function processModel(brandId) {
        db.query(
          'SELECT id_model FROM model WHERE model_name = ? AND id_brand = ?',
          [model_name, brandId],
          (err, modelResults) => {
            if (err) return res.status(500).json({ message: 'Ошибка при поиске модели' });

            let modelId;
            if (modelResults.length > 0) {
              modelId = modelResults[0].id_model;
              updateCar(modelId);
            } else {
              db.query(
                'INSERT INTO model (model_name, id_brand) VALUES (?, ?)',
                [model_name, brandId],
                (err, insertModelResult) => {
                  if (err) return res.status(500).json({ message: 'Ошибка при добавлении модели' });
                  modelId = insertModelResult.insertId;
                  updateCar(modelId);
                }
              );
            }
          }
        );
      }

      function updateCar(modelId) {
        db.query(
          'UPDATE cars SET id_model = ?, year = ?, mileage = ?, vin_code = ?, license_plate = ? WHERE id_car = ? AND id = ?',
          [modelId, year, mileage || null, vin_code || null, license_plate, carId, userId],
          (err, result) => {
            if (err) return res.status(500).json({ message: 'Ошибка при обновлении машины' });

            if (result.affectedRows === 0) {
              return res.status(404).json({ message: 'Машина не найдена или у вас нет прав для ее изменения' });
            }

            res.status(200).json({ message: 'Машина успешно обновлена' });
          }
        );
      }
    });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: 'Неверный или просроченный токен' });
  }
};

exports.deleteCar = (req, res) => {
  const token = extractToken(req);
  const carId = req.params.id;

  if (!token) return res.status(401).json({ message: 'Токен не предоставлен' });

  try {
    const decoded = jwt.verify(token, jwtConfig.access.secret);
    const userId = decoded.id;

    db.query(
      'DELETE FROM cars WHERE id_car = ? AND id = ?',
      [carId, userId],
      (err, result) => {
        if (err) return res.status(500).json({ message: 'Ошибка при удалении машины' });

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Машина не найдена или у вас нет прав для ее удаления' });
        }

        res.status(200).json({ message: 'Машина успешно удалена' });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: 'Неверный или просроченный токен' });
  }
};