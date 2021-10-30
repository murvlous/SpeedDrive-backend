const mongoose = require('../../database');
const bcrypt = require('bcryptjs')

const AlunoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
    },
    sobrenome: {
        type: String,
    },
    CPF: {
        type: String,
    },
    dataNascimento: {
        type: Date,
    },
    whatsapp: {
        type: String,
    },
    sexo: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
    },
    observacoes: {
        type: String
    },
    isEmailVerificado: {
        type: Boolean,
        required: true,
        default: false
    },
    isCadastroCompleto: {
        type: Boolean,
        required: true,
        default: false
    },
    CEP: {
        type: String,
    },
    endereco: {
        type: String,
    },
    numero: {
        type: String,
    },
    complemento: {
        type: String,
    },
    bairro: {
        type: String,
    },
    cidade: {
        type: String,
    },
    estado: {
        type: String,
    },
    urlFotoPerfil: {
        type: String,
    },
    pathFotoPerfil: {
        type: String,
    },
    urlCarteiraHabilitacao: {
        type: String,
    },
    pathCarteiraHabilitacao: {
        type: String,
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

AlunoSchema.pre('save', async function(next) {
    const hash = await bcrypt.hash(this.senha, 10)
    this.senha = hash;

    next()
})

const Aluno = mongoose.model('Aluno', AlunoSchema);

module.exports = Aluno;