const mongoose = require('../../database');
const bcrypt = require('bcryptjs')

const InstrutorSchema = new mongoose.Schema({
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
        default: Date.now,
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
    credencial: {
        type: String,
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
    marcaVeiculo: {
        type: String,
    },
    modeloVeiculo: {
        type: String,
    },
    anoFabricacaoVeiculo: {
        type: Number,
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
    urlFotoCarteiraHabilitacao: {
        type: String,
    },
    pathFotoCarteiraHabilitacaol: {
        type: String,
    },
    urlFotoDuploComando: {
        type: String,
    },
    pathFotoDuploComando: {
        type: String,
    },
    urlFotoFrenteVeiculo: {
        type: String,
    },
    pathFotoFrenteVeiculo: {
        type: String,
    },
    urlFotoTraseiraVeiculo: {
        type: String,
    },
    pathFotoTraseiraVeiculo: {
        type: String,
    },
    urlFotoLatEsquerdaVeiculo: {
        type: String,
    },
    pathFotoLatEsquerdaVeiculo: {
        type: String,
    },
    urlFotoLatDireitaVeiculo: {
        type: String,
    },
    pathFotoLatDireitaVeiculo: {
        type: String,
    },
    urlFotoPlacaVeiculo: {
        type: String,
    },
    pathFotoPlacaVeiculo: {
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
    instrutorDisponibilidade: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InstrutorDisponibilidade',
    }],
    createAt: {
        type: Date,
        default: Date.now,
    },
})

InstrutorSchema.pre('save', async function(next) {
    if (this.senha != undefined) {
        const hash = await bcrypt.hash(this.senha, 10)
        this.senha = hash;
    }

    next()
})

const Instrutor = mongoose.model('Instrutor', InstrutorSchema);

module.exports = Instrutor;