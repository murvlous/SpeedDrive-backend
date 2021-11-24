const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth');
const crypto = require('crypto');
const mailer = require('../../modules/mailer');
const Aluno = require('../models/Aluno')
const Instrutor = require('../models/Instrutor')
const Admin = require('../models/Admin')
const AWS = require('aws-sdk');

const router = express.Router();

AWS.config.update({ credentials: { accessKeyId: 'AKIA2NSURAS2RG3E3W4G', secretAccessKey: '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' }, region: 'sa-east-1' });
const arn_topico_sns_novos_cadastros = 'arn:aws:sns:sa-east-1:716363072693:topic-notificacao-novos-cadastros'

function generateToken(params = {}) {
    return jwt.sign(params, authConfig.secret, {} /* { expiresIn: "60d" } */ )
}

router.post('/registrarAluno', async(req, res) => {

    const { email } = req.body;

    try {
        if (await Instrutor.findOne({ email }) ||
            await Aluno.findOne({ email }) ||
            await Admin.findOne({ email })
        )
            return res.status(400).send({ error: 'E-mail já cadastrado' })

        console.log(req.body);
        const aluno = await Aluno.create(req.body);
        aluno.senha = undefined

        var notificacao_SNS = {
            Message: `Novo aluno cadastrado no App Speed Drive.
E-mail: ${email}
WhatsApp: ${req.body.whatsapp}
Primeiro Nome: ${req.body.nome}`,
            TopicArn: arn_topico_sns_novos_cadastros
        };

        // Create promise and SNS service object
        var publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(notificacao_SNS).promise();

        // Handle promise's fulfilled/rejected states
        publishTextPromise.then(
            function(data) {
                console.log(`Message ${publishTextPromise.Message} sent to the topic ${publishTextPromise.TopicArn}`);
                console.log("MessageID is " + data.MessageId);
            }).catch(
            function(err) {
                console.error(err, err.stack);
            });

        return res.send({
            tipoUsuario: 'aluno',
            aluno,
            token: generateToken({ id: aluno.id })
        });
    } catch (err) {
        return res.status(400).send({ error: err });
    }
});

router.post('/registrarInstrutor', async(req, res) => {

    const { email } = req.body;

    try {
        if (await Instrutor.findOne({ email }) ||
            await Aluno.findOne({ email }) ||
            await Admin.findOne({ email })
        )
            return res.status(400).send({ error: 'E-mail já cadastrado' })

        const instrutor = await Instrutor.create(req.body);
        instrutor.senha = undefined

        var notificacao_SNS = {
            Message: `Novo instrutor cadastrado no App Speed Drive.
E-mail: ${email}
WhatsApp: ${req.body.whatsapp}
Primeiro Nome: ${req.body.nome}`,
            TopicArn: arn_topico_sns_novos_cadastros
        };

        // Create promise and SNS service object
        var publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(notificacao_SNS).promise();

        // Handle promise's fulfilled/rejected states
        publishTextPromise.then(
            function(data) {
                console.log(`Message ${publishTextPromise.Message} sent to the topic ${publishTextPromise.TopicArn}`);
                console.log("MessageID is " + data.MessageId);
            }).catch(
            function(err) {
                console.error(err, err.stack);
            });

        return res.send({
            tipoUsuario: 'instrutor',
            instrutor,
            token: generateToken({ id: instrutor.id })
        });
    } catch (err) {
        console.log(err)
        return res.status(400).send({ error: err });
    }
});

router.post('/registrarAdmin', async(req, res) => {

    const { email } = req.body;

    try {
        if (await Instrutor.findOne({ email }) ||
            await Aluno.findOne({ email }) ||
            await Admin.findOne({ email })
        )
            return res.status(400).send({ error: 'E-mail já cadastrado' })

        const admin = await Admin.create(req.body);
        admin.senha = undefined

        return res.send({
            tipoUsuario: 'admin',
            admin,
            token: generateToken({ id: admin.id })
        });
    } catch (err) {
        console.log(err)
        return res.status(400).send({ error: err });
    }
});

router.post('/autenticar', async(req, res) => {

    const { email, senha } = req.body
    console.log(email, senha)

    try {
        let usuario = await Aluno.findOne({ email }).select('+senha')

        if (usuario) {
            tipoUsuario = 'aluno';
        } else {
            usuario = await Instrutor.findOne({ email }).select('+senha')
            if (usuario) {
                tipoUsuario = 'instrutor';
            } else {
                usuario = await Admin.findOne({ email }).select('+senha')
                if (usuario) {
                    tipoUsuario = 'admin';
                } else {
                    return res.status(400).send({ error: 'Usuário não encontrado' })
                }
            }
        }

        if (!await bcrypt.compare(senha, usuario.senha))
            return res.status(400).send({ error: 'Senha inválida' })

        usuario.senha = undefined

        res.send({
            tipoUsuario,
            usuario,
            token: generateToken({ id: usuario.id })
        })
    } catch (err) {
        res.status(400).send({ error: 'Erro ao autenticar. Tente novamente daqui a pouco.' });
    };


})

router.post('/forgot_password', async(req, res) => {

    const { email } = req.body

    try {
        const user = await User.findOne({ email }).select('+password');

        if (!user)
            return res.status(400).send({ error: 'User not found!' })

        const token = crypto.randomBytes(20).toString('hex');

        const now = new Date();
        now.setHours(now.getHours() + 1);

        user.passwordResetToken = token;
        user.passwordResetExpires = now;

        await user.save();

        mailer.sendMail({
            to: email,
            from: 'admin@noderest.com.br',
            template: 'auth/forgot_password',
            context: { token }
        }, (err) => {
            if (err) {
                console.log(err)
                return res.status(400).send({ error: 'Cannot send forgot password email' });
            }
        });

        return res.status(200).send('sucesso');

    } catch (err) {
        console.log(err)
        res.status(400).send({ error: 'Error on forgot password, try again' });
    }
});

router.post('/reset_password', async(req, res) => {

    const { email, token, password } = req.body;

    try {

        const user = await User.findOne({ email })
            .select('+passwordResetToken passwordResetExpires')

        if (!user) {
            return res.status(400).send({ error: 'User not found' });
        }

        if (token !== user.passwordResetToken) {
            return res.status(400).send({ error: 'Invalid Token' });
        }

        const now = new Date();

        if (now > user.passwordResetExpires) {
            return res.status(400).send({ error: 'Expired Token' });
        }

        user.password = password;

        await user.save();

        res.send();

    } catch (err) {
        res.status(400).send({ error: 'Error on reset password' });
    };

});

router.post('/validaToken', async(req, res) => {

    const { token } = req.body

    jwt.verify(token, authConfig.secret, (err, decoded) => {
        if (err)
            return res.status(401).send({ error: 'Token inválido' })
        else
            return res.status(200).send()
    })

});

module.exports = app => app.use('/auth', router);