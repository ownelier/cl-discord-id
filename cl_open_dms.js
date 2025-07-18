const fetch = require('node-fetch');
const colors = require('colors');
const { clearChannel } = require('./functions');

const wait = ms => new Promise(res => setTimeout(res, ms));

async function getOpenDMs(token) {
    const res = await fetch('https://discord.com/api/v9/users/@me/channels', {
        headers: { Authorization: token }
    });

    if (!res.ok) {
        console.log('Erro ao buscar DMs abertas.'.red);
        process.exit(1);
    }

    const channels = await res.json();
    return channels.filter(c => c.type === 1); 
}

async function clOpenDMs(token, userId, done) {
    const openDMs = await getOpenDMs(token);

    if (openDMs.length === 0) {
        console.log('Nenhuma DM aberta encontrada.'.yellow);
        return done();
    }

    console.log(`Iniciando CL em ${openDMs.length} DMs abertas...\n`.green);

    let count = 0;

    const next = async () => {
        if (count >= openDMs.length) {
            console.log('\nTodas as DMs abertas foram limpas.\n'.green);
            return done();
        }

        const dm = openDMs[count];
        console.log(`\n[${count + 1}/${openDMs.length}] Limpando DM com ${dm.id}...`.cyan);

        await clearChannel(token, userId, dm.id, () => {
            count++;
            next();
        });
    };

    next();
}

module.exports = {
    clOpenDMs
};
