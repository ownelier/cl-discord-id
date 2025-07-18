const readline = require('readline-sync');
const colors = require('colors');
const fetch = require('node-fetch');
const { clearChannel } = require('./functions');
const { clOpenDMs } = require('./cl_open_dms');
const { access_token } = require('./config.json');

async function getUserData(token) {
    try {
        const res = await fetch("https://discord.com/api/v9/users/@me", {
            headers: { Authorization: token }
        });

        if (!res.ok) {
            console.log("Erro ao buscar usuário. Verifique se o token é válido.".red);
            process.exit(1);
        }

        return await res.json();
    } catch {
        console.log("Erro na requisição de usuário.".red);
        process.exit(1);
    }
}

async function menu() {
    console.clear();
    console.log(`
        
       ▄▄▄▄    ██▓     ▒█████   ▒█████  ▓█████▄ 
      ▓█████▄ ▓██▒    ▒██▒  ██▒▒██▒  ██▒▒██▀ ██▌ by teu >.<
      ▒██▒ ▄██▒██░    ▒██░  ██▒▒██░  ██▒░██   █▌
      ▒██░█▀  ▒██░    ▒██   ██░▒██   ██░░▓█▄   ▌
      ░▓█  ▀█▓░██████▒░ ████▓▒░░ ████▓▒░░▒████▓ 
      ░▒▓███▀▒░ ▒░▓  ░░ ▒░▒░▒░ ░ ▒░▒░▒░  ▒▒▓  ▒ 
      ▒░▒   ░ ░ ░ ▒  ░  ░ ▒ ▒░   ░ ▒ ▒░  ░ ▒  ▒ 
       ░    ░   ░ ░   ░ ░ ░ ▒  ░ ░ ░ ▒   ░ ░  ░ 
       ░          ░  ░    ░ ░      ░ ░     ░    
            ░                            ░       
`.red);

    const user = await getUserData(access_token);
    console.log(` - logado como @${user.username}#${user.discriminator}\n`.red);

    console.log(' - Comandos disponíveis:\n'.green);
    console.log(' - 1 - Limpar um canal específico');
    console.log(' - 2 - Limpar todas as DMs (CL ALL)');
    console.log(' - 3 - Remover todos os amigos');
    console.log(' - 4 - Limpar todas as DMs abertas\n');

    const opcao = readline.question(' - Escolha um comando (1, 2, 3 ou 4): '.green);

    if (opcao === '1') {
        const askChannel = () => {
            const channelId = readline.question(' - insira o ID do canal (DM) para limpar: '.red);

            if (!channelId || isNaN(channelId)) {
                console.log('ID inválido. Tente novamente.\n'.yellow);
                return askChannel();
            }

            console.log(`iniciando limpeza no canal ${channelId}...\n`.red);

            clearChannel(access_token, user.id, channelId, () => {
                console.log(`limpeza concluída no canal ${channelId}.\n`.green);

                const novamente = readline.question('deseja limpar outro canal? (S/N): '.red);
                if (novamente.toLowerCase() === 's' || novamente.toLowerCase() === 'sim') {
                    askChannel();
                } else {
                    menu();
                }
            });
        };

        askChannel();
    } else if (opcao === '2') {
        require('./cl_all').clAll(access_token);
    } else if (opcao === '3') {
        require('./remover_friend').removeAllFriends(access_token);
    } else if (opcao === '4') {
        clOpenDMs(access_token, user.id, () => {
            readline.question('\nPressione ENTER para voltar ao menu...'.gray);
            menu();
        });
    } else {
        console.log('Opção inválida.'.yellow);
        menu();
    }
}

module.exports = { menu };
menu();
