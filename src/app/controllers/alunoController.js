const express = require('express')
const authMiddleware = require('../middlewares/auth')
const multer = require('multer')
const multerConfig = require('../../config/multer')

const Aluno = require('../models/Aluno')
const Agendamento = require('../models/Agendamento')

const router = express.Router()

router.use(authMiddleware)

router.get('/', async(req, res) => {

    try {

        const alunos = await Aluno.find();
        return res.send({ alunos });

    } catch (err) {
        console.log(err);
        return res.status(400).send({ error: 'Falha ao recuperar lista' })
    }

});

router.get('/:idUsuario', async(req, res) => {

    try {

        const aluno = await Aluno.findById(req.params.idUsuario);
        return res.send({ aluno });

    } catch (err) {
        console.log(err);
        return res.status(400).send({ error: 'Falha ao recuperar aluno' })
    }

});

router.get('/infosDash/:idAluno', async(req, res) => {

    try {
        const aluno = await Aluno.findById(req.params.idAluno);
        const qtdAulasRealizadas = await Agendamento.countDocuments({
            aluno: req.params.idAluno,
            status: ['Realizada']
        })
        const qtdProximasAulas = await Agendamento.countDocuments({
            aluno: req.params.idAluno,
            status: ['Pend. Confirmação', 'Confirmada']
        })
        const qtdAulasHistorico = await Agendamento.countDocuments({
            aluno: req.params.idAluno,
            status: ['Realizada', 'Cancelada', 'Reagendada']
        })

        const response = {
            nome: aluno.nome,
            sobrenome: aluno.sobrenome || '',
            urlFotoPerfil: aluno.urlFotoPerfil || '',
            isCadastroCompleto: aluno.isCadastroCompleto,
            hasNotificacao: false,
            qtdAulasRealizadas: qtdAulasRealizadas,
            qtdProximasAulas: qtdProximasAulas,
            qtdAulasHistorico: qtdAulasHistorico,
        }

        return res.send({ response });

    } catch (err) {
        console.log(err);
        return res.status(400).send({ error: 'Falha ao recuperar infos dashboard Aluno' })
    }

});

router.put('/alterarDadosPrincipais', async(req, res) => {
    try {

        let aluno = await Aluno.findByIdAndUpdate(
            req.idUsuario,
            req.body, { new: true }
        )
        const isCadastroCompleto = await validaCadastroCompleto(aluno);
        aluno = await Aluno.findByIdAndUpdate(
            req.idUsuario, { isCadastroCompleto }, { new: true }
        )

        res.send({ aluno });

    } catch (err) {
        console.log(err)
        return res.status(400).send({ error: "Erro ao salvar" });
    }
});

router.put('/alterarEndereco', async(req, res) => {
    try {

        let aluno = await Aluno.findByIdAndUpdate(
            req.idUsuario,
            req.body, { new: true }
        )
        const isCadastroCompleto = await validaCadastroCompleto(aluno);
        aluno = await Aluno.findByIdAndUpdate(
            req.idUsuario, { isCadastroCompleto }, { new: true }
        )

        res.send({ aluno });

    } catch (err) {
        console.log(err)
        return res.status(400).send({ error: "Erro ao salvar" });
    }
});

router.put('/alterarFotoPerfil', multer(multerConfig).single('imagem'), async(req, res) => {

    try {
        if (req.file) {
            let aluno = await Aluno.findByIdAndUpdate(
                req.idUsuario, {
                    urlFotoPerfil: req.file.location,
                    pathFotoPerfil: req.file.key
                }, { new: true }
            )

            res.status(200).send()
        } else {
            res.status(400).send()
        }

    } catch (err) {
        console.log(err)
        return res.status(400).send({ error: "Erro ao salvar" });
    }
})

router.put('/alterarFotoCarteiraHabilitacao', multer(multerConfig).single('imagem'), async(req, res) => {

    try {
        console.log(req.file)
        if (req.file) {
            let aluno = await Aluno.findByIdAndUpdate(
                req.idUsuario, {
                    urlCarteiraHabilitacao: req.file.location,
                    pathCarteiraHabilitacao: req.file.key
                }, { new: true }
            )

            const isCadastroCompleto = await validaCadastroCompleto(aluno);
            aluno = await Aluno.findByIdAndUpdate(
                req.idUsuario, { isCadastroCompleto }, { new: true }
            )

            res.status(200).send()
        } else {
            res.status(400).send()
        }

    } catch (err) {
        console.log(err)
        return res.status(400).send({ error: "Erro ao salvar" });
    }
})

const validaCadastroCompleto = async(aluno) => {

    if (!!aluno.nome &&
        !!aluno.sobrenome &&
        !!aluno.CPF &&
        !!aluno.dataNascimento &&
        !!aluno.sexo &&
        !!aluno.email &&
        !!aluno.CEP &&
        !!aluno.endereco &&
        !!aluno.numero &&
        !!aluno.bairro &&
        !!aluno.cidade &&
        !!aluno.estado &&
        !!aluno.urlCarteiraHabilitacao
    ) {
        return true;
    } else {
        return false;
    }
};

module.exports = app => app.use('/aluno', router)