const { verifyToken } = require('./auth');
const { User } = require('../models');

const createContext = async ({ req }) => {
  const token = req.headers.authorization || '';

  if (token) {
    try {
      const cleanToken = token.replace('Bearer ', '');
      const decoded = verifyToken(cleanToken);
      const user = await User.findById(decoded.id);
      return { user };
    } catch (error) {
      return { user: null };
    }
  }

  return { user: null };
};

module.exports = createContext;