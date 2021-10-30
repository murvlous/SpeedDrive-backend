const express = require('express')
const authMiddleware = require('../middlewares/auth')
const adminConfig = require('../../config/admin');
const utilLib = require('../../lib/util')

const Agendamento = require('../models/Agendamento')
const MotivoRecusaAula = require('../models/MotivoRecusaAula')
const Aluno = require('../models/Aluno')
const Instrutor = require('../models/Instrutor')
const InstrutorDisponibilidade = require('../models/InstrutorDisponibilidade')
const Notificacao = require('../models/Notificacao')
const Admin = require('../models/Admin')
const Empresa = require('../models/Empresa')

const router = express.Router()
router.use(authMiddleware)

//TODO: Parametrizar no banco de dados, domínio Empresa
const tempoDeAula = 50;

async function instrutoresAptosAAtender(agendamento) {

    let arrayInstrutoresAptos = [];
    let instrutoresAptos;

    try {
        const diaDaSemana = agendamento.horarioInicio.getDay();

        //Por algum motivo quando executa o getHours(), já recupera o horário com GMT +3h - Sao Paulo
        //-> entender se esse comportamento ficará correto se a aplicação estiver rodando em uma máquina fora de SP
        const horaInicioAgendamento = agendamento.horarioInicio.getHours();
        const minutoInicioAgendamento = agendamento.horarioInicio.getMinutes();
        const horaFimAgendamento = agendamento.horarioFim.getHours();
        const minutoFimAgendamento = agendamento.horarioFim.getMinutes();

        //capturar as disponibilidades para o "diaDaSemana" do agendamento
        const disponibilidadesDia = await InstrutorDisponibilidade.find({ diaSemana: diaDaSemana }).populate('instrutor');
        console.log(`Foram encontradas ${disponibilidadesDia.length} disponibilidades para o dia ${diaDaSemana} da semana`);


        //faz loop nas disponibilidades
        for (const disp of disponibilidadesDia) {

            console.log('----------');
            console.log('Analisando disponibilidade: ', disp._id);
            console.log('Instrutor: ', disp.instrutor.nome);
            console.log('Hora início: ', disp.horaInicio);
            console.log('Hora fim: ', disp.horaFim);

            //-Se horário do agendamento está dentro da disponibilidade e instrutor não possui aula "Confirmada" ou "Pend. Confirmação" no mesmo horário
            const temDisponibilidade = verificaAgendamentoEhContidoDisponibilidade(disp, horaInicioAgendamento, minutoInicioAgendamento, horaFimAgendamento, minutoFimAgendamento);
            const temAula = await verificaSeInstrutorTemAulaNohorario(disp.instrutor, agendamento.horarioFim, agendamento.horarioInicio, agendamento);

            console.log('Tem disponibilidade: ', temDisponibilidade);
            console.log('Tem aula: ', temAula);

            if (temDisponibilidade && !temAula) {
                //--adiciona instrutor em arrayInstrutoresAptos
                arrayInstrutoresAptos.push(disp.instrutor)
                console.log('Adicionou instrutor como apto');
            }
        }

        instrutoresAptos = await Instrutor.find({ _id: { $in: arrayInstrutoresAptos } });

    } catch (err) {
        console.log('Erro no método instrutoresAptosAAtender')
        console.log(err)
    }

    return instrutoresAptos;
};

async function verificaSeInstrutorTemAulaNohorario(idInstrutor, horarioFim, horarioInicio, agendamento) {

    var temAula;

    const agendamentoInstrutor =
        await Agendamento.find({
            instrutor: idInstrutor,
            status: ['Confirmada', 'Pend. Confirmação'],
            horarioInicio: {
                '$lt': horarioInicio
            },
            horarioFim: {
                '$gt': horarioInicio
            }
        });

    if (agendamentoInstrutor.length == 0) {
        temAula = false;
    } else {
        temAula = true;
    }


    return temAula;
}

function verificaAgendamentoEhContidoDisponibilidade(disponibilidadeInstrutor, horaInicioAgendamento, minutoInicioAgendamento, horaFimAgendamento, minutoFimAgendamento) {

    arrayInicioDisponibilidade = disponibilidadeInstrutor.horaInicio.split(':');
    horaInicioDisponibilidade = arrayInicioDisponibilidade[0];
    minutoInicioDisponibilidade = arrayInicioDisponibilidade[1];

    arrayFimDisponibilidade = disponibilidadeInstrutor.horaFim.split(':');
    horaFimDisponibilidade = arrayFimDisponibilidade[0];
    minutoFimDisponibilidade = arrayFimDisponibilidade[1];

    if (
        (
            horaInicioAgendamento > horaInicioDisponibilidade ||
            (horaInicioAgendamento == horaInicioDisponibilidade && minutoInicioAgendamento >= minutoInicioDisponibilidade)
        ) &&
        (
            horaFimAgendamento < horaFimDisponibilidade ||
            (horaFimAgendamento == horaFimDisponibilidade && minutoFimAgendamento <= minutoFimDisponibilidade)
        )
    ) {
        return true;
    } else {
        return false;
    }
}

async function roteamentosPendentesPorAluno(idAluno) {
    const aulas =
        await Agendamento.find({
            aluno: idAluno,
            status: 'Pend. Confirmação',
            instrutor: null
        }).lean();

    return aulas;
};

async function verificaInstrutoresAptosATodas(agendamentosPendentes) {

    console.log('----------');
    console.log('Iniciando análise de instrutores aptos à todas as aulas');

    let instrutoresAptosATodas = [];
    const qtdAgendamentos = agendamentosPendentes.length;

    console.log('Total agendamentos à verificar: ', qtdAgendamentos);

    if (qtdAgendamentos > 0) {

        const instrutoresPrimeiroAgendamento = agendamentosPendentes[0].instrutores;

        for (var instrutor of instrutoresPrimeiroAgendamento) {

            console.log('----------');
            console.log('Analisando instrutor: ', instrutor.nome);
            console.log('Id do Instrutor: ', instrutor._id);

            console.log('Vai fazer análise "every"')
            var todosAgendamentosContemOInstrutor = agendamentosPendentes.every((element) => {
                // var indexOf = element.instrutores.indexOf(instrutor);
                console.log('-Análise Every para o agendamento: ', element._id)
                var contido = element.instrutores.some(instrutorInterno => {
                    console.log('--Análise Some para o instrutor interno: ', instrutorInterno._id)
                    var bateuInstrutor = instrutorInterno._id.equals(instrutor._id);
                    if (bateuInstrutor)
                        console.log('---Bateu os instrutores: ', instrutorInterno._id, instrutor._id);
                    else
                        console.log('---Não bateu os instrutores: ', instrutorInterno._id, instrutor._id);

                    return bateuInstrutor
                });
                console.log('valor de contido: ', contido)
                if (contido)
                    console.log(`Instrutor ${instrutor._id} está contido no agendamento ${element._id}`);
                console.log(`Instrutores verificados como disponíveis para o agendamento ${element._id}`);
                console.log(element.instrutores);
                return contido;
            });

            // var count = 0;

            // const promises1 = agendamentosPendentes.map(async aula => {

            //     console.log('analisando aula: ', aula)
            //     console.log('length2', aula.instrutores.length)
            //     console.log(instrutor._id)
            //     const promises2 = aula.instrutores.map(async instrutorAula => {

            //         console.log('analisando instrutor interno: ', instrutorAula)
            //         if (instrutorAula._id.toString().localeCompare(instrutor._id.toString())) {
            //             console.log('entrou aqui')
            //             count++;
            //         }

            //     });

            //     await Promise.all(promises2);

            // });

            // await Promise.all(promises1);

            // console.log('qtd agendamentos: ', count);

            // if (count == qtdAgendamentos)
            //     instrutoresAptosATodas.push(instrutor);


            if (todosAgendamentosContemOInstrutor) {
                console.log('Adicionou instrutor como apto no array');
                instrutoresAptosATodas.push(instrutor);
            } else {
                console.log('Instrutor não é apto');
            }

        }
    }

    return instrutoresAptosATodas;

};

router.get('/roteamentosPendentesPorAlunoAgrupado/:idUsuario', async(req, res) => {

    var agendamentos = new Object();

    try {
        const agendamentosPendentes = await roteamentosPendentesPorAluno(req.params.idUsuario);

        if (agendamentosPendentes) {

            for (const aula of agendamentosPendentes) {

                console.log('--------------------------------------------------');
                console.log('Iniciando análise aula: ', aula._id);
                console.log('Horário início: ', aula.horarioInicio);
                console.log('Horário fim: ', aula.horarioFim);

                instrutores = await instrutoresAptosAAtender(aula);

                if (instrutores) {
                    aula.instrutores = instrutores;
                    aula.countInstrutoresAptos = instrutores.length;
                } else {
                    aula.instrutores = [];
                    aula.countInstrutoresAptos = 0;
                }
            };

            const instrutoresAptosATodas = await verificaInstrutoresAptosATodas(agendamentosPendentes);

            agendamentos.agendamentosPendentes = agendamentosPendentes;
            agendamentos.agendamentosAgrupados = {
                "aulas": "Todas",
                "countInstrutoresAptos": instrutoresAptosATodas.length,
                "instrutores": instrutoresAptosATodas
            };

        }

        return res.status(200).send({ agendamentos });

    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao recuperar agendamentos pendentes' })
    }

});

router.get('/qtdPendentesReagendamento/:idAluno', async(req, res) => {

    try {
        const qtdPendentesReagendamento =
            await Agendamento.countDocuments({ aluno: req.params.idAluno, status: 'Cancelada' });

        return res.status(200).send({ qtdPendentesReagendamento })
    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao recuperar qtd de aulas pendentes' })
    }
});

router.get('/realizadas/:idUsuario', async(req, res) => {

    try {
        const idUsuario = req.params.idUsuario

        aulas =
            await Agendamento.find({
                aluno: idUsuario,
                status: ['Realizada']
            }).populate('instrutor').populate('aluno').sort({ horarioInicio: -1 });

        return res.status(200).send({ aulas })
    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao recuperar aulas realizadas' })
    }
});

router.get('/realizadasInstrutor/:idUsuario', async(req, res) => {

    try {
        const idUsuario = req.params.idUsuario

        aulas =
            await Agendamento.find({
                instrutor: idUsuario,
                status: ['Realizada']
            }).populate('instrutor').populate('aluno').sort({ horarioInicio: -1 });

        return res.status(200).send({ aulas })
    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao recuperar aulas realizadas' })
    }
});

//Metodo esta com problema
router.get('/agrupadoPorStatusPorAluno', async(req, res) => {

    try {

        var agrupadoProximasPorAluno = await Agendamento.aggregate(
            [
                { "$match": { "status": ['Pend. Confirmação', 'Confirmada'] } },
                {
                    $group: {
                        _id: "$aluno",
                        count: { $sum: 1 }
                    }
                },
            ]);

        var agrupadoHistoricoPorAluno = await Agendamento.aggregate(
            [
                { "$match": { "status": {$in: ['Realizada', 'Cancelada', 'Reagendada'] } } },
                {
                    $group: {
                        _id: "$aluno",
                        count: { $sum: 1 }
                    }
                },
            ]);

        // var alunos = await Aluno.find({})

        // var agrupadoPorStatusPorAluno = []

        // alunos.forEach(element => {
        //     temp = {
        //         idAluno: element._id,
        //         qtdProximas: agrupadoProximasPorAluno (x => x._id == element._id)[0].count,
        //         qtdHistorico: agrupadoHistoricoPorAluno.filter(x => x._id == element._id)[0].count
        //     }
        //     agrupadoPorStatusPorAluno.push(temp)
        // });

        return res.status(200).send({ agrupadoProximasPorAluno, agrupadoHistoricoPorAluno })
    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao recuperar lista de agendamentos agrupados por status por aluno' })
    }
});

router.get('/proximas/:idUsuario', async(req, res) => {

    try {
        const idUsuario = req.params.idUsuario

        aulas =
            await Agendamento.find({
                aluno: idUsuario,
                status: ['Pend. Confirmação', 'Confirmada']
            }).populate('instrutor').populate('aluno').sort({ horarioInicio: -1 });

        return res.status(200).send({ aulas })
    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao recuperar próximas aulas' })
    }
});

router.get('/proximasInstrutor/:idUsuario', async(req, res) => {

    try {
        const idUsuario = req.params.idUsuario

        aulas =
            await Agendamento.find({
                instrutor: idUsuario,
                status: ['Confirmada']
            }).populate('instrutor').populate('aluno').sort({ horarioInicio: -1 });

        return res.status(200).send({ aulas })
    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao recuperar próximas aulas' })
    }
});

router.get('/pendentesInstrutor/:idUsuario', async(req, res) => {

    try {
        const idUsuario = req.params.idUsuario

        aulas =
            await Agendamento.find({
                instrutor: idUsuario,
                status: ['Pend. Confirmação']
            }).populate('instrutor').populate('aluno').sort({ horarioInicio: -1 });

        return res.status(200).send({ aulas })
    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao recuperar aulas pendentes' })
    }
});

router.get('/historico/:idUsuario', async(req, res) => {

    try {
        const idUsuario = req.params.idUsuario

        aulas =
            await Agendamento.find({
                aluno: idUsuario,
                status: ['Realizada', 'Cancelada', 'Remarcada']
            }).populate('instrutor').populate('aluno').sort({ horarioInicio: -1 });

        return res.status(200).send({ aulas })
    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao recuperar histórico de aulas' })
    }
});

router.get('/detalhe/:idAgendamento', async(req, res) => {

    try {
        aula =
            await Agendamento.findById(req.params.idAgendamento)
            .populate(['instrutor', 'aluno', 'motivoRecusaAula']);

        return res.status(200).send({ aula })

    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao recuperar aula' })
    }
});

router.get('/aprovacoesPendentesPorInstrutor', async(req, res) => {

    try {
        aulas =
            await Agendamento.find({ instrutor: req.idUsuario, status: 'Pend. Confirmação' });

        return res.status(200).send({ aulas })

    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao recuperar aulas' })
    }
});

router.get('/roteamentosPendentesPorAluno', async(req, res) => {

    try {
        const aulas = await roteamentosPendentesPorAluno(req.body.idAluno);

        return res.status(200).send({ aulas })

    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao recuperar aulas' })
    }
});

router.get('/roteamentosPendentesPorAluno/:idUsuario', async(req, res) => {

    try {
        const aulas = await roteamentosPendentesPorAluno(req.params.idUsuario);

        return res.status(200).send({ aulas })

    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao recuperar aulas' })
    }
});

//TODO: REVER MÉTODO
router.get('/agendaDia', async(req, res) => {

    //TODO: Tratativa enquanto o banco de dados nao é locale Brasil
    const datamin = req.body.data;
    dataminDate = new Date(datamin);
    dataminDate.setHours(dataminDate.getHours() + 3);

    datamaxDate = new Date(datamin);
    datamaxDate.setHours(datamaxDate.getHours() + 27);

    try {
        aulas =
            await Agendamento.find({
                instrutor: req.idUsuario,
                horario: {
                    '$gte': dataminDate,
                    '$lt': datamaxDate
                }
            });

        return res.status(200).send({ aulas })

    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao recuperar aulas' })
    }
});


router.get('/agendamentosCriadosDia', async(req, res) => {

    //TODO: Tratativa enquanto o banco de dados nao é locale Brasil
    const datamin = req.query.data;
    dataminDate = new Date(datamin);
    dataminDate.setHours(dataminDate.getHours() + 3);

    datamaxDate = new Date(datamin);
    datamaxDate.setHours(datamaxDate.getHours() + 27);

    try {
        aulas =
            await Agendamento.find({
                createAt: {
                    '$gte': dataminDate,
                    '$lt': datamaxDate
                }
            }).populate('aluno');

        return res.status(200).send({ aulas })

    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao recuperar agendamentos' })
    }
});

router.post('/', async(req, res) => {

    try {
        
        const IdEmpresaSpeedDrive = '60e517b4cfe23a0013cbd824'

        dadosEmpresa = await Empresa.findById(IdEmpresaSpeedDrive)

        const valorAulaUnitario = dadosEmpresa.valorAulaUnitario;
        const valor6Aulas = dadosEmpresa.valor6Aulas;
        const valor10Aulas = dadosEmpresa.valor10Aulas;

        const CountAgendamentosCancelados =
            await Agendamento.countDocuments({ aluno: req.idUsuario, status: 'Cancelada' });

        let arrayAgendamentos = req.body.aulas;
        let qtdAulasAgendamento = arrayAgendamentos.length;
        let qtdPendentesReagendamentoRestantes = CountAgendamentosCancelados;
        const qtdPendentesReagendamentoTotal = CountAgendamentosCancelados;

        criaAgendamento = async(element) => {

            horarioString = element.data + 'T' + element.hora;
            horarioInicioDate = new Date(horarioString);
            horarioFimDate = new Date(horarioInicioDate);
            horarioFimDate.setMinutes(horarioFimDate.getMinutes() + tempoDeAula);
            console.log(horarioInicioDate)

            var valorTemp;
            console.log({ qtdPendentesReagendamentoRestantes })
            if (qtdPendentesReagendamentoRestantes > 0) {
                valorTemp = '0';
                await Agendamento.findOneAndUpdate({ aluno: req.idUsuario, status: 'Cancelada' }, { status: 'Remarcada' });
                qtdPendentesReagendamentoRestantes--;
            } else {
                console.log({ qtdAulasAgendamento, qtdPendentesReagendamentoTotal })
                if (qtdAulasAgendamento - qtdPendentesReagendamentoTotal < 6) {
                    valorTemp = valorAulaUnitario;
                } else if ((qtdAulasAgendamento - qtdPendentesReagendamentoTotal >= 6) && (qtdAulasAgendamento - qtdPendentesReagendamentoTotal < 10)) {
                    valorTemp = valor6Aulas;
                } else {
                    valorTemp = valor10Aulas;
                }
            }

            console.log({ valorTemp })

            await Agendamento.create({
                aluno: req.idUsuario,
                horarioInicio: horarioInicioDate,
                horarioFim: horarioFimDate,
                status: 'Pend. Confirmação',
                valor: valorTemp
            });
        };

        //Solução encontrada para driblar o problema do "foreach" ser async,
        //De forma com que fazia que o controle de preço entre as aulas fosse perdido
        arrayAgendamentos.reduce((promiseChain, arrayItem) =>
            promiseChain.then(() => criaAgendamento(arrayItem)), Promise.resolve());

        return res.status(200).send('Aula(s) agendada(s) com sucesso');

    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao efetuar agendamento' })
    }
});

router.get('/roteamentosPendentes', async(req, res) => {

    try {
        var agendamentosAgrupados = await Agendamento.aggregate(
            [
                { "$match": { "status": 'Pend. Confirmação', "instrutor": null } },
                {
                    $group: {
                        _id: "$aluno",
                        count: { $sum: 1 }
                    }
                },
            ]);

        const promises = agendamentosAgrupados.map(async(item) => {
            alunoTemp = await Aluno.findById(item._id);

            if (alunoTemp) {
                item.nomeCompleto = alunoTemp.nome + ' ' + alunoTemp.sobrenome;
            }
        });

        await Promise.all(promises);

        //remove do array todos os itens que não tiverem nome
        //-> isso pode acontecer no caso do aluno não existir mais, porém ainda houver registros de agendamentos para ele
        agendamentosAgrupados = await agendamentosAgrupados.filter(item => {
            return item.nomeCompleto;
        })

        //ordena por ordem alfabética
        agendamentosAgrupados = await agendamentosAgrupados.sort((a, b) => {
            return a.nomeCompleto.toLowerCase().localeCompare(b.nomeCompleto.toLowerCase());
        });

        return res.status(200).send({ agendamentosAgrupados });

    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao listar roteamentos pendentes' })
    }
});

router.put('/rotearAula', async(req, res) => {

    try {
        const agendamento = await Agendamento.findByIdAndUpdate(req.body.idAgendamento, {
            instrutor: req.body.idInstrutor,
            status: 'Pend. Confirmação'
        });

        // Enviar notificação pro Instrutor
        const idInstrutor = agendamento.instrutor;
        const horarioInicio = agendamento.horarioInicio;
        const notificacaoTitulo = 'Nova aula'
        const notificacaoMensagem = `Solicitação de aula para ${await utilLib.formataDataParaExibicaoDataFriendly(horarioInicio)}, ás ${await utilLib.formataDataParaExibicaoHorarioFriendly(horarioInicio)}, acesse 'Aprovações Pendentes' para aceitá-la`
        const objNotificacao = {
            instrutor: idInstrutor,
            titulo: notificacaoTitulo,
            mensagem: notificacaoMensagem
        }

        await Notificacao.create(objNotificacao)

        return res.status(200).send({ msg: 'Aula roteada com sucesso' });

    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao rotear aula' })
    }
});

router.put('/aceitarAula/:idAgendamento', async(req, res) => {

    try {
        const agendamento = await Agendamento.findByIdAndUpdate(req.params.idAgendamento, {
            status: 'Confirmada'
        }, { new: true }).populate(['aluno', 'instrutor']);

        // Enviar notificação pro Aluno
        const idAluno = agendamento.aluno._id;
        const nomeInstrutor = agendamento.instrutor.nome;
        const horarioInicio = agendamento.horarioInicio;
        const notificacaoTitulo = 'Aula confirmada'
        const notificacaoMensagem = `Sua aula do dia ${await utilLib.formataDataParaExibicaoDataFriendly(horarioInicio)}, com início ás ${await utilLib.formataDataParaExibicaoHorarioFriendly(horarioInicio)} está confirmada com o instrutor ${nomeInstrutor}`
        const objNotificacao = {
            aluno: idAluno,
            titulo: notificacaoTitulo,
            mensagem: notificacaoMensagem
        }

        await Notificacao.create(objNotificacao)

        return res.status(200).send({ msg: 'Aula aceita com sucesso', agendamento });

    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao aceitar aula' })
    }
});

router.put('/recusarAula/:idAgendamento', async(req, res) => {

    try {

        var motivoRecusaAula = new MotivoRecusaAula();
        motivoRecusaAula.instrutor = req.idUsuario;
        motivoRecusaAula.agendamento = req.params.idAgendamento;
        motivoRecusaAula.motivo = req.body.motivo;
        motivoRecusaAula.save();

        const agendamento = await Agendamento.findByIdAndUpdate(req.params.idAgendamento, { $unset: { instrutor: 1 } });
        agendamento.motivoRecusaAula.push(motivoRecusaAula);
        agendamento.save();

        // Enviar notificação pro Admin
        const admin = await Admin.findOne({ email: adminConfig.email })
        const instrutor = await Instrutor.findOne({ _id: req.idUsuario })

        const idAdmin = admin._id;
        const horarioInicio = agendamento.horarioInicio;
        const notificacaoTitulo = 'Aula recusada'
        const notificacaoMensagem = `O instrutor ${instrutor.nome} recusou a aula do dia ${await utilLib.formataDataParaExibicaoDataFriendly(horarioInicio)}, com início ás ${await utilLib.formataDataParaExibicaoHorarioFriendly(horarioInicio)}`
        const objNotificacao = {
            admin: idAdmin,
            titulo: notificacaoTitulo,
            mensagem: notificacaoMensagem
        }

        await Notificacao.create(objNotificacao)

        return res.status(200).send({ msg: 'Aula recusada com sucesso' });

    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao recusar aula' })
    }
});

router.put('/cancelarAula/:idAgendamento', async(req, res) => {

    try {

        let agendamento;
        if (req.body.tipoUsuario == 'instrutor') {
            agendamento = await Agendamento.findByIdAndUpdate(req.params.idAgendamento, { $unset: { instrutor: 1 } });
            var motivoRecusaAula = new MotivoRecusaAula();
            motivoRecusaAula.instrutor = req.idUsuario;
            motivoRecusaAula.agendamento = req.params.idAgendamento;
            motivoRecusaAula.motivo = req.body.motivo;
            motivoRecusaAula.save();

            agendamento.status = 'Pend. Confirmação';
            agendamento.motivoRecusaAula.push(motivoRecusaAula);

            // Enviar notificação pro Aluno
            const idAluno = agendamento.aluno;
            const horarioInicio = agendamento.horarioInicio;
            const notificacaoTitulo = 'Aula cancelada'
            const notificacaoMensagem = `Sua aula do dia ${await utilLib.formataDataParaExibicaoDataFriendly(horarioInicio)}, com início ás ${await utilLib.formataDataParaExibicaoHorarioFriendly(horarioInicio)} foi cancelada, favor reagendar`
            const objNotificacao = {
                aluno: idAluno,
                titulo: notificacaoTitulo,
                mensagem: notificacaoMensagem
            }

            await Notificacao.create(objNotificacao)

        } else {
            agendamento = await Agendamento.findById(req.params.idAgendamento);
            agendamento.status = 'Cancelada';

            if (agendamento.instrutor != undefined) {
                // Enviar notificação pro Instrutor
                const idInstrutor = agendamento.instrutor;
                const horarioInicio = agendamento.horarioInicio;
                const notificacaoTitulo = 'Aula cancelada'
                const notificacaoMensagem = `A aula do dia ${await utilLib.formataDataParaExibicaoDataFriendly(horarioInicio)}, com início ás ${await utilLib.formataDataParaExibicaoHorarioFriendly(horarioInicio)} foi cancelada`
                const objNotificacao = {
                    instrutor: idInstrutor,
                    titulo: notificacaoTitulo,
                    mensagem: notificacaoMensagem
                }

                await Notificacao.create(objNotificacao)
            }
        }
        agendamento.save();

        return res.status(200).send({ msg: 'Aula cancelada com sucesso' });

    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao cancelar aula' })
    }
});

router.put('/realizarAula/:idAgendamento', async(req, res) => {

    try {
        const agendamento = await Agendamento.findByIdAndUpdate(req.params.idAgendamento, {
            status: 'Realizada'
        }, { new: true }).populate(['aluno', 'instrutor']);

        return res.status(200).send({ msg: 'Aula realizada com sucesso', agendamento });

    } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Erro ao realizar aula' })
    }
});

module.exports = app => app.use('/agendamento', router);