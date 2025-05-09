const db = require('../models/userModel');

exports.createUser = async (username, email) => {
  const query = 'INSERT INTO users (username, email) VALUES (?, ?)';
  return new Promise((resolve, reject) => {
    db.query(query, [username, email], (err, results) => {
      if (err) reject(err);
      resolve({ username, email, id: results.insertId });
    });
  });
};
