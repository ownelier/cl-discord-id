const fetch = require('node-fetch');
const colors = require('colors');

const wait = ms => new Promise(res => setTimeout(res, ms));

async function fetchAllMessages(authToken, authorId, channelId) {
    const headers = {
        Authorization: authToken.startsWith('Bearer ') ? authToken : authToken
    };

    const allMessages = [];

    const fetchMessages = async (before) => {
        const params = before ? `?limit=100&before=${before}` : `?limit=100`;

        try {
            const res = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages${params}`, {
                method: 'GET',
                headers
            });

            if (res.status === 403) {
                console.log(`\nAcesso negado ao canal (${channelId}). Verifique se é uma DM válida.\n`.red);
                process.exit(1);
            }

            if (!res.ok) {
                console.log(`Erro na API (${res.status}): Tentando novamente...`.red);
                await wait(1000);
                return fetchMessages(before);
            }

            const result = await res.json();

            if (!Array.isArray(result)) {
                console.log('Erro inesperado na API:', result);
                return [];
            }

            const ownMessages = result.filter(
                msg => msg.author?.id === authorId && [0, 19].includes(msg.type)
            );

            allMessages.push(...ownMessages);

            if (result.length < 100) return allMessages;

            const lastId = result[result.length - 1].id;
            await wait(150);
            return fetchMessages(lastId);

        } catch (error) {
            console.log('Erro na requisição, tentando novamente...'.red);
            await wait(1000);
            return fetchMessages(before);
        }
    };

    return fetchMessages();
}

async function deleteMsg(msgId, headers, channelId) {
    let attempts = 0;

    const tryDelete = async () => {
        attempts++;
        try {
            const res = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages/${msgId}`, {
                method: 'DELETE',
                headers
            });

            const body = await res.json().catch(() => ({}));

            if (body?.code === 50034) {
                console.log(`Mensagem ${msgId} muito antiga. Ignorada.`.yellow);
                return;
            }

            if (body?.retry_after) {
                const retryMs = body.retry_after * 1000 + 200;
                console.log(`Rate limit. Aguardando ${retryMs / 1000} segundos...`);
                await wait(retryMs);
                return await tryDelete();
            }

            if (!res.ok) {
                if (attempts < 5) {
                    console.log(`Erro ao deletar ${msgId}. Retentando...`.red);
                    await wait(500);
                    return await tryDelete();
                } else {
                    console.log(`Falha permanente ao deletar ${msgId}.`.red);
                    return;
                }
            }

            console.log(`Deletado ${msgId}`.gray);

        } catch (err) {
            if (attempts < 5) {
                console.log(`Erro ao deletar ${msgId}. Tentando novamente...`.red);
                await wait(500);
                return await tryDelete();
            } else {
                console.log(`Erro fatal ao deletar ${msgId}. Ignorado.`.red);
            }
        }
    };

    await tryDelete();
}

async function closeDM(authToken, channelId) {
    const headers = {
        Authorization: authToken
    };

    try {
        const res = await fetch(`https://discord.com/api/v9/channels/${channelId}`, {
            method: 'DELETE',
            headers
        });

        if (res.ok) {
            console.log(`DM ${channelId} foi fechada com sucesso.`.cyan);
        } else {
            console.log(`Falha ao fechar a DM. Status: ${res.status}`.yellow);
        }
    } catch (err) {
        console.log(`Erro ao fechar a DM: ${err.message}`.red);
    }
}

async function clearChannel(authToken, authorId, channelId, callback) {
    const headers = {
        Authorization: authToken.startsWith('Bearer ') ? authToken : authToken
    };

    console.log('Buscando todas as mensagens...'.cyan);
    const allMessages = await fetchAllMessages(authToken, authorId, channelId);
    const totalToDelete = allMessages.length;

    if (totalToDelete === 0) {
        console.log('Nenhuma mensagem sua encontrada para deletar.'.yellow);
        await closeDM(authToken, channelId);
        return callback();
    }

    console.log(`Encontradas ${totalToDelete} mensagens para deletar.\n`.green);

    let deletedCount = 0;
    let index = 0;
    const batchSize = 5;
    const delayBetweenBatches = 1500;

    while (index < allMessages.length) {
        const batch = allMessages.slice(index, index + batchSize);
        await Promise.allSettled(batch.map(msg => deleteMsg(msg.id, headers, channelId)));

        deletedCount += batch.length;
        console.log(`Total deletado: ${deletedCount} / ${totalToDelete}`.gray);

        index += batchSize;
        await wait(delayBetweenBatches);
    }

    console.log(`\nCanal ${channelId} limpo com sucesso. Total deletado: ${deletedCount}\n`.green);
    await closeDM(authToken, channelId);
    callback();
}

module.exports = {
    clearChannel
};
