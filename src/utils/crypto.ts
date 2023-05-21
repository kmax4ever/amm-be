import * as hmacSha512 from 'crypto-js/hmac-sha512';
import * as aes from 'crypto-js/aes';
import * as utf8 from 'crypto-js/enc-utf8';
import * as crypto from 'crypto'
import * as utils from 'web3-utils'
const secret = process.env.APP_SECRET || 'app';
/**
 * The Production APP_SECRET if leaked with the salt will compromise all accounts
 */
export default {
    sha512(str: string) {
        return hmacSha512(str, secret).toString();
    },
    sha256(str: string, secret?: string) {
        const localSecret = secret || process.env.SSO_SECRET || 'SSO_SECRET';
        const hmac = crypto.createHmac('sha256', localSecret);
        hmac.update(str);
        return hmac.digest('hex');
    },
    encrypt(str: string) {
        return aes.encrypt(aes.encrypt(str, secret).toString(), secret + '_x').toString();
    },
    decrypt(str: string) {
        return aes.decrypt(aes.decrypt(str, secret + '_x').toString(utf8), secret).toString(utf8);
    },
    async randomHexStr(numBytes) {
        const buffer = await crypto.randomBytes(numBytes)
        return buffer.toString('hex')
    },
    fromWei(value: any) {
        return utils.fromWei(value.toString(), 'ether')
    },
    toWei(value: any) {
        return utils.toWei(value.toString(), 'ether')
    }
};
