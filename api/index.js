// Vercel Serverless Function entry point
// Ensures database is initialized before handling requests

const db = require('../server/db');
const { seed } = require('../server/seed');

let initialized = false;

async function ensureInit() {
  if (initialized) return;
  await db.init();
  const alreadySeeded = db.findAll('organizations').length > 0;
  if (!alreadySeeded) {
    await seed();
  }
  initialized = true;
}

// Vercel handler
module.exports = async (req, res) => {
  try {
    await ensureInit();
    const app = require('../server/index');
    return app(req, res);
  } catch (err) {
    console.error('Handler error:', err.message);
    res.status(500).json({ error: 'Server initialization failed: ' + err.message });
  }
};
