import * as BOT_TELEGRAM from 'node-telegram-bot-api'

const BOT = new BOT_TELEGRAM('1460425426:AAEJ3UnHaATNKMw_kAWWI2zM-nVCETpawv0', { poll: true }); // interval: 500,

export const relayMessage = async (message) => {
    await BOT.sendMessage(-487695345, message);
}



