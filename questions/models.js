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

// questionSchema.methods.validatePassword = (password) => {
//     return bcrypt.compare(password, this.password)
// }

// userSchema.methods.hashPassword = (password) => {
//     return bcrypt.hash(password, 10)
// }

const Questions = mongoose.model('Questions', questionSchema)

module.exports = { Questions }