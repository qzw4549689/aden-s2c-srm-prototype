const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { entity_type, entity_id } = req.query;
  let history = db.findAll('history');
  if (entity_type) {
    history = history.filter(h => h.entity_type === entity_type);
  }
  if (entity_id) {
    history = history.filter(h => h.entity_id === parseInt(entity_id));
  }
  res.json(history.slice(0, 100));
});

module.exports = router;
