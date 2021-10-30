const mongoose = require('../../database');
const bcrypt = require('bcryptjs')

const MotivoRecusaAulaSchema = new mongoose.Schema({

    agendamento: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agendamento'
    },
    instrutor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instrutor'
    },
    motivo: {
        type: String
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
})

const MotivoRecusaAula = mongoose.model('MotivoRecusaAula', MotivoRecusaAulaSchema);

module.exports = MotivoRecusaAula;