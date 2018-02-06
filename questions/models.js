const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

mongoose.Promise = global.Promise

const questionSchema = mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    }
})

questionSchema.methods.serialize = () => ({
    question: this.question || '',
    answer: this.answer || '',
})

const Questions = mongoose.model('Questions', questionSchema)

module.exports = { Questions }