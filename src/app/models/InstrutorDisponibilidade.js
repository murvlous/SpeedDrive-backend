const mongoose = require('../../database');
const bcrypt = require('bcryptjs')

const InstrutorDisponibilidadeSchema = new mongoose.Schema({
    diaSemana: {
        type: Number,
        required: true,
    },
    horaInicio: {
        type: String,
        required: true,
    },
    horaFim: {
        type: String,
        required: true,
    },
    instrutor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instrutor'
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
})

const InstrutorDisponibilidade = mongoose.model('InstrutorDisponibilidade', InstrutorDisponibilidadeSchema);

module.exports = InstrutorDisponibilidade;