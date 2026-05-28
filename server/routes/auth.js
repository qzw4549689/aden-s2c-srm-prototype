const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.findOne('users', { email });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const org = db.findById('organizations', user.org_id);
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, orgId: user.org_id },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      orgId: user.org_id,
      orgName: org ? org.short_name : null,
    }
  });
});

router.get('/me', require('../middleware/auth').authenticateToken, (req, res) => {
  const user = db.findById('users', req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const org = db.findById('organizations', user.org_id);
  res.json({
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
    orgId: user.org_id,
    orgName: org ? org.short_name : null,
  });
});

module.exports = router;
