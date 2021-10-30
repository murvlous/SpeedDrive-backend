const nodemailer = require('nodemailer');
const { host, port, user, pass } = require('../config/mail.json')
const hbs = require('nodemailer-express-handlebars')
const path = require('path');

const transport = nodemailer.createTransport({
    host,
    port,
    auth: { user, pass }
});

transport.use('compile', hbs({
    viewEngine: {
        extName: '.hbs',
        partialsDir: 'src/resources/mail',
        layoutsDir: 'src/resources/mail',
        defaultLayout: 'auth/forgot_password.html',
    },
    viewPath: path.resolve('./src/resources/mail/'),
    extName: '.html'
}));

module.exports = transport;