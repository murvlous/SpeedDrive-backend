const express = require('express');
const bodyparser = require('body-parser');
var cors = require('cors');
require('dotenv').config()

const app = express();

app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false }));
require('./app/controllers/index')(app);

app.listen(3000, () => {
    console.log('Express has been started');
});