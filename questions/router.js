const express = require('express')
const bodyParser = require('body-parser')
const { Questions } = require('./models')
const router = express.Router()
const jsonParser = bodyParser.json()
const passport = require('passport');

const jwtAuth = passport.authenticate('jwt', { session: false });

router.post('/', jsonParser, (req, res) => {
    const requiredFields = ['question', 'answer']
    const missingField = requiredFields.find(field => !(field in req.body))

    if (missingField) {
        return res.status(422).json({
            code: 422,
            reason: 'Validation Error',
            message: 'Missing Field',
            location: missingField
        })
    }

    const stringFields = ['question', 'answer']
    const nonStringField = stringFields.find(field => {
        field in req.body && typeof req.body[field] !== 'string'
    })

    if (nonStringField) {
        return res.status(422).json({
            code: 422,
            reason: 'Validation Error',
            message: 'Incorrect field type: expected string',
            location: nonStringField
        })
    }

    const explicitlyTrimmedFields = ['question', 'answer']
    const nonTrimmedField = explicitlyTrimmedFields.find(field => {
        req.body[field].trim() !== req.body[field]
    })

    if (nonTrimmedField) {
        return res.status(422).json({
            code: 422,
            reason: 'Validation Error',
            message: 'Cannot start or end with whitespace',
            location: nonTrimmedField
        })
    }

    let { question, answer} = req.body
    question = question.trim()
    answer = answer.trim()

    return Questions.find({ question })
        .count()
        .then(count => {
            if (count > 0) {
                return Promise.reject({
                    code: 422,
                    reason: 'ValidationError',
                    message: 'Question already exists',
                    location: 'Question'
                })
            }
            return Questions
        })
        .then(question => {
            return res.status(201).json(question)
        })
        .catch(err => {
            if (err.reason === 'ValidationError') {
                return res.status(err.code).json(err)
            }
            res.status(500).json({
                code: 500,
                message: 'Internal Server Error'
            })
        })
})

router.get('/', jwtAuth, (req, res) => {
    // console.log('here')
    return Questions.find()
        .then(questions => {
            // console.log(questions)
            res.json(questions)
        })
        .catch(err => {
            res.status(500).json({
                message: 'Internal Server Error'
            })
        })
})

router.get('/next', passport.authenticate('jwt', { session: false }), (req, res) => {
    User.findOne({
        username: req.user.username
    }).then(user =>
        res.json(
            user.questions[user.head]
        ));
    }
);

module.exports = { router }