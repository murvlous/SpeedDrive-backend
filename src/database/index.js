const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://speeddriveadmin:R9eqVJcXWEgA2A73@cluster-speeddrive-dev.z6fo8.mongodb.net/speeddrive?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});
mongoose.Promise = global.Promise;

module.exports = mongoose;