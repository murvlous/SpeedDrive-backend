const mongoose = require('../../database');
const bcrypt = require('bcryptjs')

const EmpresaSchema = new mongoose.Schema({

    razaoSocial: {
        type: String,
        required: true
    },
    nomeFantasia: {
        type: String,
        required: true
    },
    CNPJ: {
        type: String,
        required: true
    },
    telefone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    endereco: {
        type: String,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    valorAulaUnitario: {
        type: Number,
        required: true
    },
    valor10Aulas: {
        type: Number,
        required: true
    },
    valor15Aulas: {
        type: Number,
        required: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
})

const Empresa = mongoose.model('Empresa', EmpresaSchema);

module.exports = Empresa;