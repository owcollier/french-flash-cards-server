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
  },
  //create another object or an array of questions(objects)
  //pull the questions from the get endpoint and put them here 
  questions: [
    {
      _id: mongoose.Schema.Types.ObjectId,
      question: String,
      answer: String,
      memoryStrength: Number,
      next: Number
    }
  ],
  head: {
    type: Number,
    default: 0
  }
});

userSchema.methods.serialize = function() {
  return {
    username: this.userName || '',
    firstName: this.firstName || '',
    lastName: this.lastName || ''
  };
};

userSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

const User = mongoose.model('User', userSchema);

module.exports = { User };