const mongoose = require('../../database');
const bcrypt = require('bcryptjs')

const AdminSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
    },
    sobrenome: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
    },
    senha: {
        type: String,
        required: true,
        select: false,
    },
    TokenRedefinicaoSenha: {
        type: String,
        select: false
    },
    ExpiracaoRedefinicaoSenha: {
        type: Date,
        select: false
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
})

AdminSchema.pre('save', async function(next) {
    const hash = await bcrypt.hash(this.senha, 10)
    this.senha = hash;

    next()
})

const Admin = mongoose.model('Admin', AdminSchema);

module.exports = Admin;