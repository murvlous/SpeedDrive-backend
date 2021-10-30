const mongoose = require('../../database');

const NotificacaoSchema = new mongoose.Schema({

    aluno: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Aluno'
    },
    instrutor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instrutor'
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    titulo: {
        type: String
    },
    mensagem: {
        type: String
    },
    flgLida: {
        type: Boolean,
        default: false
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
})

const Notificacao = mongoose.model('Notificacao', NotificacaoSchema);

module.exports = Notificacao;