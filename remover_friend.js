const fetch = require('node-fetch');
const { access_token } = require('./config.json');
const readline = require('readline-sync');
const { menu } = require('./index');

const wait = ms => new Promise(r => setTimeout(r, ms));

async function getFriends(token) {
    const res = await fetch('https://discord.com/api/v9/users/@me/relationships', {
        headers: { Authorization: token }
    });

    return await res.json();
}

async function removeAllFriends(token) {
    const friends = await getFriends(token);
    const onlyFriends = friends.filter(f => f.type === 1);

    console.log(`Removendo ${onlyFriends.length} amigos...\n`);

    for (const friend of onlyFriends) {
        await fetch(`https://discord.com/api/v9/users/@me/relationships/${friend.id}`, {
            method: 'DELETE',
            headers: { Authorization: token }
        });

        console.log(`Amigo ${friend.user.username} removido.`);
        await wait(300);
    }

    console.log('\nTodos os amigos foram removidos.\n');
    readline.question('Pressione ENTER para voltar ao menu...');
    menu();
}

module.exports = { removeAllFriends };
