const express = require('express')
const authMiddleware = require('../middlewares/auth')

const Notificacao = require('../models/Notificacao')

const router = express.Router()

router.use(authMiddleware)

router.get('/aluno/:idAluno', async(req, res) => {

    let notificacoes;

    try {
        notificacoes = await Notificacao.find({
            aluno: req.params.idAluno,
        }).sort({ createAt: -1 })

        return res.send({ notificacoes });

    } catch (err) {
        console.log(err);
        return res.status(400).send({ error: 'Falha ao recuperar notificacoes do Aluno' })

    } finally {
        //Marca msg não lidas como lidas
        let notificacoesNaoLidas = await notificacoes.filter(x => x.flgLida == false)
        await notificacoesNaoLidas.forEach(x => {
            x.flgLida = true;
            x.save();
        })
    }
})

router.get('/instrutor/:idInstrutor', async(req, res) => {

    let notificacoes;

    try {
        notificacoes = await Notificacao.find({
            instrutor: req.params.idInstrutor,
        })

        return res.send({ notificacoes });

    } catch (err) {
        console.log(err);
        return res.status(400).send({ error: 'Falha ao recuperar notificacoes do Instrutor' })

    } finally {
        //Marca msg não lidas como lidas
        let notificacoesNaoLidas = await notificacoes.filter(x => x.flgLida == false)
        await notificacoesNaoLidas.forEach(x => {
            x.flgLida = true;
            x.save();
        })
    }
})

router.get('/admin/:idAdmin', async(req, res) => {

    let notificacoes;

    try {
        notificacoes = await Notificacao.find({
            admin: req.params.idAdmin,
        })

        return res.send({ notificacoes });

    } catch (err) {
        console.log(err);
        return res.status(400).send({ error: 'Falha ao recuperar notificacoes do Admin' })

    } finally {
        //Marca msg não lidas como lidas
        let notificacoesNaoLidas = await notificacoes.filter(x => x.flgLida == false)
        await notificacoesNaoLidas.forEach(x => {
            x.flgLida = true;
            x.save();
        })
    }
})

router.post('/aluno', async(req, res) => {

    try {

        const notificacao = await Notificacao.create(req.body);

        return res.send({ notificacao });

    } catch (err) {
        return res.status(400).send({ error: 'Falha ao salvar notificacao para Aluno' });
    }
});

router.post('/instrutor', async(req, res) => {

    try {

        const notificacao = await Notificacao.create(req.body);

        return res.send({ notificacao });

    } catch (err) {
        return res.status(400).send({ error: 'Falha ao salvar notificacao para Instrutor' });
    }
});

router.post('/admin', async(req, res) => {

    try {

        const notificacao = await Notificacao.create(req.body);

        return res.send({ notificacao });

    } catch (err) {
        return res.status(400).send({ error: 'Falha ao salvar notificacao para Admin' });
    }
});


router.put('/marcarComoLida/:idNotificacao', async(req, res) => {

    try {
        const notificacao = await Notificacao.findByIdAndUpdate(req.params.idNotificacao, {
            flgLida: true
        }, { new: true });

        return res.status(200).send({ notificacao });

    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao marcar notificacao como lida' })
    }
});

module.exports = app => app.use('/notificacao', router)