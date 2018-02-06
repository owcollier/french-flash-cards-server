'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const { User } = require('./models');
const router = express.Router();
const jsonParser = bodyParser.json();
const { Questions } = require('../questions')

router.post('/', jsonParser, (req, res) => {
  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'Validation Error',
      message: 'Missing Field',
      location: missingField
    });
  }

  const stringFields = ['username', 'password', 'firstName', 'lastName'];
  const nonStringField = stringFields.find(field => {
    field in req.body && typeof req.body[field] !== 'string';
  });

  if (nonStringField) {
    return res.status(422).json({
      code: 422,
      reason: 'Validation Error',
      message: 'Incorrect field type: expected string',
      location: nonStringField
    });
  }

  const explicitlyTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicitlyTrimmedFields.find(field => {
    req.body[field].trim() !== req.body[field];
  });

  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: 'Validation Error',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    });
  }

  const sizedFields = {
    username: {
      min: 1
    },
    password: {
      min: 10,
      max: 72
    }
  };

  const tooSmallField = Object.keys(sizedFields).find(field => {
    'min' in sizedFields[field] &&
            req.body[field].trim().length < sizedFields[field].min;
  });
  const tooLargeField = Object.keys(sizedFields).find(field => {
    'max' in sizedFields[field] &&
            req.body[field].trim().length > sizedFields[field].max;
  });

  if (tooLargeField || tooSmallField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField]
          .min} characters long`
        : `Must be at most ${sizedFields[tooLargeField]
          .max} characters long`,
      location: tooSmallField || tooLargeField
    });
  }

  let { username, password, firstName = '', lastName = '' } = req.body;
  firstName = firstName.trim();
  lastName = lastName.trim();

  return User.find({ username })
    .count()
    .then(count => {
      if (count > 0) {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }
      return User.hashPassword(password);
    })
    .then(hash => {
      return new User({
        userName: username,
        password: hash,
        firstName,
        lastName
      });
    })
    .then(user => Questions.find()
    .then(questions => (
        {user, questions}
    )))
    .then(({user, questions}) => {
      // console.log(user, questions)
      user.questions = questions.map((question, index) => ({
        _id: question._id, 
        question: question.question,
        answer: question.answer,
        memoryStregnth: 1,
        next: index === questions.length - 1 ? null : index + 1
      }))
      return user.save()
    })
    .then(user => {
      return res.status(201).json(user.serialize());
    })
    .catch(err => {
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({
        code: 500,
        message: 'Internal Server Error'
      });
    });
});

router.get('/', (req, res) => {
  return User.find()
    .then(users => {
      return res.json(users.map(user => {
        return user.serialize();
      }));
    })
    .catch(err => {
      res.status(500).json({
        message: 'Internal Server Error'
      });
    });
});

module.exports = { router };