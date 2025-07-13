
const bcrypt = require('bcryptjs');
const User = require('../models/User');
module.exports = (app) => {
  app.get('/login', (req, res) => res.render('login'));
  app.get('/signup', (req, res) => res.render('signup'));
  app.post('/signup', async (req, res) => {
    const hashed = await bcrypt.hash(req.body.password, 10);
    await User.create({ username: req.body.username, password: hashed });
    res.redirect('/login');
  });
  app.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
      req.session.username = user.username;
      res.redirect('/group/General');
    } else res.redirect('/login');
  });
  app.post('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
  });
};
