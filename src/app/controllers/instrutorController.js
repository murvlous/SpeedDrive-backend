const express = require('express')
const authMiddleware = require('../middlewares/auth')
const multer = require('multer')
const multerConfig = require('../../config/multer')

const Instrutor = require('../models/Instrutor')
const InstrutorDisponibilidade = require('../models/InstrutorDisponibilidade')
const Agendamento = require('../models/Agendamento')

const router = express.Router()

router.use(authMiddleware)

router.get('/', async(req, res) => {

    try {

        const instrutores = await Instrutor.find().populate('instrutorDisponibilidade');
        return res.send({ instrutores });

    } catch (err) {
        console.log(err);
        return res.status(400).send({ error: 'Falha ao recuperar lista' })
    }

});

router.get('/:idUsuario', async(req, res) => {

    try {

        const instrutor = await Instrutor.findById(req.params.idUsuario).populate('instrutorDisponibilidade');
        return res.send({ instrutor });

    } catch (err) {
        console.log(err);
        return res.status(400).send({ error: 'Falha ao recuperar instrutor' })
    }

});

router.get('/infosDash/:idInstrutor', async(req, res) => {

    try {
        const instrutor = await Instrutor.findById(req.params.idInstrutor);
        const qtdAulasRealizadas = await Agendamento.countDocuments({
            instrutor: req.params.idInstrutor,
            status: ['Realizada']
        })
        const qtdProximasAulas = await Agendamento.countDocuments({
            instrutor: req.params.idInstrutor,
            status: ['Confirmada']
        })
        const qtdPendentesAprovacao = await Agendamento.countDocuments({
            instrutor: req.params.idInstrutor,
            status: ['Pend. Confirmação']
        })

        const response = {
            nome: instrutor.nome,
            sobrenome: instrutor.sobrenome || '',
            urlFotoPerfil: instrutor.urlFotoPerfil || '',
            isCadastroCompleto: instrutor.isCadastroCompleto,
            hasNotificacao: false,
            qtdAulasRealizadas: qtdAulasRealizadas,
            qtdProximasAulas: qtdProximasAulas,
            qtdPendentesAprovacao: qtdPendentesAprovacao,
        }

        return res.send({ response });

    } catch (err) {
        console.log(err);
        return res.status(400).send({ error: 'Falha ao recuperar infos dashboard Instrutor' })
    }

});

router.put('/alterarDadosPrincipais', async(req, res) => {
    try {

        let instrutor = await Instrutor.findByIdAndUpdate(
            req.idUsuario,
            req.body, { new: true }
        )
        const isCadastroCompleto = await validaCadastroCompleto(instrutor);
        instrutor = await Instrutor.findByIdAndUpdate(
            req.idUsuario, { isCadastroCompleto }, { new: true }
        )

        res.send({ instrutor });

    } catch (err) {
        console.log(err)
        return res.status(400).send({ error: "Erro ao salvar" });
    }
});

router.put('/alterarEndereco', async(req, res) => {
    try {

        let instrutor = await Instrutor.findByIdAndUpdate(
            req.idUsuario,
            req.body, { new: true }
        )
        const isCadastroCompleto = await validaCadastroCompleto(instrutor);
        instrutor = await Instrutor.findByIdAndUpdate(
            req.idUsuario, { isCadastroCompleto }, { new: true }
        )

        res.send({ instrutor });

    } catch (err) {
        console.log(err)
        return res.status(400).send({ error: "Erro ao salvar" });
    }
});

router.put('/alterarVeiculo', async(req, res) => {
    try {

        let instrutor = await Instrutor.findByIdAndUpdate(
            req.idUsuario,
            req.body, { new: true }
        )
        const isCadastroCompleto = await validaCadastroCompleto(instrutor);
        instrutor = await Instrutor.findByIdAndUpdate(
            req.idUsuario, { isCadastroCompleto }, { new: true }
        )

        res.send({ instrutor });

    } catch (err) {
        console.log(err)
        return res.status(400).send({ error: "Erro ao salvar" });
    }
});

router.post('/adicionarDisponibilidade/:idInstrutor', async(req, res) => {
    try {

        const instrutorDisponibilidade = await InstrutorDisponibilidade.create({
            ...req.body,
            instrutor: req.params.idInstrutor
        })

        const instrutor = await Instrutor.findById(req.params.idInstrutor);
        await instrutor.instrutorDisponibilidade.push(instrutorDisponibilidade);
        await instrutor.save();

        res.status(200).send({ instrutor, msg: 'Disponibilidade salva com sucesso' })

    } catch (err) {
        console.log(err)
        return res.status(400).send({ error: "Erro ao salvar disponibilidade" });
    }
});

router.delete('/removerDisponibilidade/:idDisponibilidade', async(req, res) => {
    try {

        await InstrutorDisponibilidade.findByIdAndDelete(
            req.params.idDisponibilidade
        )

        res.status(200).send({ msg: 'Disponibilidade removida com sucesso' })

    } catch (err) {
        console.log(err)
        return res.status(400).send({ error: "Erro ao remover disponibilidade" });
    }
});

router.put('/alterarFotoPerfil', multer(multerConfig).single('imagem'), async(req, res) => {

    try {
        if (req.file) {
            let instrutor = await Instrutor.findByIdAndUpdate(
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
            let instrutor = await Instrutor.findByIdAndUpdate(
                req.idUsuario, {
                    urlFotoCarteiraHabilitacao: req.file.location,
                    pathFotoCarteiraHabilitacao: req.file.key
                }, { new: true }
            )

            const isCadastroCompleto = await validaCadastroCompleto(instrutor);
            console.log('isCadastroCompleto: ', isCadastroCompleto)
            instrutor = await Instrutor.findByIdAndUpdate(
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

router.put('/alterarFotoDuploComando', multer(multerConfig).single('imagem'), async(req, res) => {

    try {
        console.log(req.file)
        if (req.file) {
            let instrutor = await Instrutor.findByIdAndUpdate(
                req.idUsuario, {
                    urlFotoDuploComando: req.file.location,
                    pathFotoDuploComando: req.file.key
                }, { new: true }
            )

            const isCadastroCompleto = await validaCadastroCompleto(instrutor);
            instrutor = await Instrutor.findByIdAndUpdate(
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

router.put('/alterarFotoFrenteVeiculo', multer(multerConfig).single('imagem'), async(req, res) => {

    try {
        console.log(req.file)
        if (req.file) {
            let instrutor = await Instrutor.findByIdAndUpdate(
                req.idUsuario, {
                    urlFotoFrenteVeiculo: req.file.location,
                    pathFotoFrenteVeiculo: req.file.key
                }, { new: true }
            )

            const isCadastroCompleto = await validaCadastroCompleto(instrutor);
            instrutor = await Instrutor.findByIdAndUpdate(
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

router.put('/alterarFotoTraseiraVeiculo', multer(multerConfig).single('imagem'), async(req, res) => {

    try {
        console.log(req.file)
        if (req.file) {
            let instrutor = await Instrutor.findByIdAndUpdate(
                req.idUsuario, {
                    urlFotoTraseiraVeiculo: req.file.location,
                    pathFotoTraseiraVeiculo: req.file.key
                }, { new: true }
            )

            const isCadastroCompleto = await validaCadastroCompleto(instrutor);
            instrutor = await Instrutor.findByIdAndUpdate(
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

router.put('/alterarFotoLatEsquerdaVeiculo', multer(multerConfig).single('imagem'), async(req, res) => {

    try {
        console.log(req.file)
        if (req.file) {
            let instrutor = await Instrutor.findByIdAndUpdate(
                req.idUsuario, {
                    urlFotoLatEsquerdaVeiculo: req.file.location,
                    pathFotoLatEsquerdaVeiculo: req.file.key
                }, { new: true }
            )

            const isCadastroCompleto = await validaCadastroCompleto(instrutor);
            instrutor = await Instrutor.findByIdAndUpdate(
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

router.put('/alterarFotoLatDireitaVeiculo', multer(multerConfig).single('imagem'), async(req, res) => {

    try {
        console.log(req.file)
        if (req.file) {
            let instrutor = await Instrutor.findByIdAndUpdate(
                req.idUsuario, {
                    urlFotoLatDireitaVeiculo: req.file.location,
                    pathFotoLatDireitaVeiculo: req.file.key
                }, { new: true }
            )

            const isCadastroCompleto = await validaCadastroCompleto(instrutor);
            instrutor = await Instrutor.findByIdAndUpdate(
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

router.put('/alterarFotoPlacaVeiculo', multer(multerConfig).single('imagem'), async(req, res) => {

    try {
        console.log(req.file)
        if (req.file) {
            let instrutor = await Instrutor.findByIdAndUpdate(
                req.idUsuario, {
                    urlFotoPlacaVeiculo: req.file.location,
                    pathFotoPlacaVeiculo: req.file.key
                }, { new: true }
            )

            const isCadastroCompleto = await validaCadastroCompleto(instrutor);

            instrutor = await Instrutor.findByIdAndUpdate(
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

validaCadastroCompleto = async(instrutor) => {
    console.log(instrutor)
    if (!!instrutor.nome &&
        !!instrutor.sobrenome &&
        !!instrutor.CPF &&
        !!instrutor.dataNascimento &&
        !!instrutor.sexo &&
        !!instrutor.email &&
        !!instrutor.credencial &&
        !!instrutor.CEP &&
        !!instrutor.endereco &&
        !!instrutor.numero &&
        !!instrutor.bairro &&
        !!instrutor.cidade &&
        !!instrutor.estado &&
        !!instrutor.marcaVeiculo &&
        !!instrutor.modeloVeiculo &&
        !!instrutor.anoFabricacaoVeiculo &&
        !!instrutor.urlFotoCarteiraHabilitacao &&
        !!instrutor.urlFotoDuploComando &&
        !!instrutor.urlFotoFrenteVeiculo &&
        !!instrutor.urlFotoTraseiraVeiculo &&
        !!instrutor.urlFotoLatEsquerdaVeiculo &&
        !!instrutor.urlFotoLatDireitaVeiculo &&
        !!instrutor.urlFotoPlacaVeiculo
    ) {
        return true;
    } else {
        return false;
    }
};

module.exports = app => app.use('/instrutor', router)