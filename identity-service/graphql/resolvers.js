const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const resolvers = {
  Query: {
    me: (parent, args, context) => {
      if (!context.user) throw new Error('Not authenticated');
      return User.findById(context.user.id);
    },
    users: async () => await User.find(),
    user: async (_, { id }) => await User.findById(id),
  },
  Mutation: {
    signup: async (_, { email, password }) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) throw new Error('User already exists');

      const user = await User.create({ email, password });

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.ACCESS_SECRET,
        { expiresIn: '1d' }
      );

      return { token, user };
    },
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error('Invalid email or password');
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.ACCESS_SECRET,
        { expiresIn: '1d' }
      );

      return { token, user };
    },
    updateUser: async (_, { email, password }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const updates = {};
      if (email) updates.email = email;
      if (password) updates.password = password; 

      // { new: true } returns the document AFTER the update!!!
      const updatedUser = await User.findByIdAndUpdate(user.id, updates, { new: true });
      return updatedUser;
    },
    deleteUser: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const result = await User.findByIdAndDelete(user.id);
      return !!result; 
    }
  }
};

module.exports = resolvers;