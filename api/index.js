// Vercel Serverless Function entry point
// Wraps the Express app for serverless deployment

const app = require('../server/index');

// Vercel expects a handler function
module.exports = (req, res) => {
  return app(req, res);
};
