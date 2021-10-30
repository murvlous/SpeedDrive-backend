exports.formataDataParaExibicaoDataFriendly = async(data) => {

    const dia = data.getDate();
    const mes = data.getMonth() + 1;
    const ano = data.getFullYear();

    dataFriendly = `${dia}/${mes}/${ano}`

    return dataFriendly;
};

exports.formataDataParaExibicaoHorarioFriendly = async(data) => {

    const hora = data.getHours().toString().padStart(2, '0');
    const minuto = data.getMinutes().toString().padStart(2, '0');

    horarioFriendly = `${hora}:${minuto}`

    return horarioFriendly;
};

exports.retornaUltimoNome = async(nome) => {
    if (nome == undefined)
        return ''
    else {
        const arrayNomes = nome.split(' ')
        return arrayNomes[arrayNomes.length - 1]
    }
};

exports.retornaIdade = async(dataNascimento) => {
    if (dataNascimento == undefined)
        return ''
    else {
        var d = new Date,
            ano_atual = d.getFullYear(),
            mes_atual = d.getMonth() + 1,
            dia_atual = d.getDate(),

            ano_aniversario = +dataNascimento.substr(0, 4),
            mes_aniversario = +dataNascimento.substr(5, 2),
            dia_aniversario = +dataNascimento.substr(8, 2),

            quantos_anos = ano_atual - ano_aniversario;

        if (mes_atual < mes_aniversario || mes_atual == mes_aniversario && dia_atual < dia_aniversario) {
            quantos_anos--;
        }

        return quantos_anos < 0 ? 0 : quantos_anos;
    }
};