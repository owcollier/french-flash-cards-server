'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.Promise = global.Promise;

const userSchema = mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  }
});

userSchema.methods.serialize = () => ({
  userName: this.userName || '',
  firstName: this.firstName || '',
  lastName: this.lastName || ''
});

userSchema.methods.validatePassword = (password) => {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.hashPassword = (password) => {
  return bcrypt.hash(password, 10);
};

const User = mongoose.model('User', userSchema);

module.exports = { User };