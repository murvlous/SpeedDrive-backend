const mongoose = require('../../database');
const bcrypt = require('bcryptjs')

// const moment = require('moment-timezone');
// const dateSaoPaulo = moment.tz(Date.now(), "America/Sao_Paulo");

const AgendamentoSchema = new mongoose.Schema({

    aluno: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Aluno',
        required: true,
    },
    instrutor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instrutor'
    },
    horarioInicio: {
        type: Date,
        required: true,
        // default: dateSaoPaulo
    },
    horarioFim: {
        type: Date,
        required: true,
        // default: dateSaoPaulo
    },
    valor: {
        type: String
    },
    status: {
        type: String,
        required: true
    },
    motivoRecusaAula: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MotivoRecusaAula',
    }],
    createAt: {
        type: Date,
        default: Date.now,
    },
})

const Agendamento = mongoose.model('Agendamento', AgendamentoSchema);

module.exports = Agendamento;