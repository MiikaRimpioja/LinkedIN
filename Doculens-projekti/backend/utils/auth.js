function authMiddleware(req, res, next) {
  const username = req.headers['username'];
  const password = req.headers['password'];

  if (!username || !password) {
    return res.status(401).send('Missing credentials');
  }

  if (username === 'softa' && password === 'Password') {
    return next();
  }

  return res.status(403).send('Invalid credentials');
}

module.exports = authMiddleware;
