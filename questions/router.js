'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const { Questions } = require('./models');
const { User } = require('../users/models');
const router = express.Router();
const jsonParser = bodyParser.json();
const passport = require('passport');

const jwtAuth = passport.authenticate('jwt', { session: false });

router.post('/', jsonParser, (req, res) => {
  const requiredFields = ['question', 'answer'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'Validation Error',
      message: 'Missing Field',
      location: missingField
    });
  }

  const stringFields = ['question', 'answer'];
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

  const explicitlyTrimmedFields = ['question', 'answer'];
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

  let { question, answer} = req.body;
  question = question.trim();
  answer = answer.trim();

  return Questions.find({ question })
    .count()
    .then(count => {
      if (count > 0) {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Question already exists',
          location: 'Question'
        });
      }
      return Questions;
    })
    .then(question => {
      return res.status(201).json(question);
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

router.post('/submit', jwtAuth, (req, res) => {

  User.findOne({
    userName: req.user.username
  }).then(user => {
    console.log(user);
    const answeredQuestion = user.questions[user.head];
    if (req.body.isCorrect) {
      user.score += 1;
      answeredQuestion.memoryStrength *= 2;
    } else {
      answeredQuestion.memoryStrength = 1;
    }
    const prevHead = user.head;
    user.head = answeredQuestion.next;
    let tempNode = user.questions[prevHead];
    for (let i = 0; i < answeredQuestion.memoryStrength; i++) {
      if (tempNode.next === null) {
        break;
      }
      tempNode = user.questions[tempNode.next];
    }
    answeredQuestion.next = tempNode.next;
    tempNode.next = prevHead;
    console.log(user);
    return user.save();
  }).then(user => {
    return res.status(201).json(user);
  }).catch(err => {
    if(err.reason === 'ValidationError'){
      return res.status(err.code.json(err));
    }
    return res.status(500).json({
      message: 'Internal Server Error'
    });
  });
});

router.get('/next', jwtAuth, (req, res) => {
  User.findOne({
    userName: req.user.username
  }).then(user =>
    res.json({
      question: user.questions[user.head].question,
      answer: user.questions[user.head].answer,
      head: user.head + 1,
      score: user.score
    })
    ).catch(err => {
      if(err.reason === 'ValidationError'){
        return res.status(err.code.json(err));
      }
      return res.status(500).json({
        message: 'Internal Server Error'
      });
    });
});

module.exports = { router };