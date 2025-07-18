const fetch = require('node-fetch');
const { clearChannel } = require('./functions');
const readline = require('readline-sync');
const { menu } = require('./index');

const wait = ms => new Promise(r => setTimeout(r, ms));

async function getUser(token) {
    const res = await fetch('https://discord.com/api/v9/users/@me', {
        headers: { Authorization: token }
    });

    const user = await res.json();
    return user.id;
}

async function getFriends(token) {
    const res = await fetch('https://discord.com/api/v9/users/@me/relationships', {
        headers: { Authorization: token }
    });

    const data = await res.json();
    return data.filter(f => f.type === 1); 
}

async function openDM(token, userId) {
    const res = await fetch('https://discord.com/api/v9/users/@me/channels', {
        method: 'POST',
        headers: {
            Authorization: token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipient_id: userId })
    });

    return await res.json();
}

async function clAll(token) {
    const selfId = await getUser(token);
    const friends = await getFriends(token);
    const total = friends.length;

    console.log(`Iniciando limpeza com ${total} amigos...\n`);

    let i = 0;
    for (const friend of friends) {
        i++;
        console.log(`(${i}/${total}) Abrindo DM com ${friend.user.username}...`);

        let dm;
        try {
            dm = await openDM(token, friend.id);
        } catch (err) {
            console.log(`Erro ao abrir DM com ${friend.id}. Pulando.`);
            continue;
        }

        await new Promise(resolve => {
            clearChannel(token, selfId, dm.id, resolve);
        });

        await wait(1000);
    }

    console.log('\nLimpeza concluída com todos os amigos.\n');
    readline.question('Pressione ENTER para voltar ao menu...');
    menu();
}

module.exports = { clAll };
