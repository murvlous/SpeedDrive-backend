const express = require('express')
const authMiddleware = require('../middlewares/auth')

const Empresa = require('../models/Empresa')
const Aluno = require('../models/Aluno')
const Instrutor = require('../models/Instrutor')
const Agendamento = require('../models/Agendamento')

const router = express.Router()

router.use(authMiddleware)


router.post('/', async(req, res) => {

    const { razaoSocial } = req.body;

    try {
        if (await Empresa.findOne({ razaoSocial }))
            return res.status(400).send({ error: 'Empresa já cadastrada' })

        const empresa = await Empresa.create(req.body);

        return res.send({ empresa, msg: 'Empresa criada com sucesso' });
    } catch (err) {
        console.log(err)
        return res.status(400).send({ error: err });
    }
});

router.get('/obter/:idEmpresa', async(req, res) => {

    try {

        const empresa = await Empresa.findById(req.params.idEmpresa);
        return res.send({ empresa });

    } catch (err) {
        console.log(err);
        return res.status(400).send({ error: 'Falha ao recuperar lista' })
    }

});

router.put('/alteraValoresAula/:idEmpresa', async(req, res) => {

    try {
        const { valorAulaUnitario, valor10Aulas, valor15Aulas } = req.body

        const empresa = await Empresa.findByIdAndUpdate(req.params.idEmpresa, {
            valorAulaUnitario,
            valor10Aulas,
            valor15Aulas
        }, { new: true });

        return res.send({ empresa, msg: 'Dados da empresa salvos com sucesso' });

    } catch (err) {
        console.log(err);
        return res.status(400).send({ error: 'Falha ao salvar dados empresa' })
    }
});

router.get('/infosDash', async(req, res) => {

    try {
        const qtdAlunosCadastrados = await Aluno.countDocuments()
        const qtdInstrutoresCadastrados = await Instrutor.countDocuments()
        const qtdPendentesRoteamento = await Agendamento.countDocuments({
            status: 'Pend. Confirmação',
            instrutor: null
        })

        const response = {
            qtdAlunosCadastrados,
            qtdInstrutoresCadastrados,
            qtdPendentesRoteamento
        }

        // const response = {
        //     nome: instrutor.nome,
        //     sobrenome: instrutor.sobrenome || '',
        //     urlFotoPerfil: instrutor.urlFotoPerfil || '',
        //     isCadastroCompleto: instrutor.isCadastroCompleto,
        //     hasNotificacao: false,
        //     qtdAulasRealizadas: qtdAulasRealizadas,
        //     qtdProximasAulas: qtdProximasAulas,
        //     qtdPendentesAprovacao: qtdPendentesAprovacao,
        // }

        return res.send({ response });

    } catch (err) {
        console.log(err);
        return res.status(400).send({ error: 'Falha ao recuperar infos dashboard admin' })
    }

});


module.exports = app => app.use('/empresa', router)