import * as hmacSha512 from "crypto-js/hmac-sha512";
import * as aes from "crypto-js/aes";
import * as utf8 from "crypto-js/enc-utf8";
import * as crypto from "crypto";
import * as utils from "web3-utils";
import * as ERC20_ABI from "src/modules/amm/contracts/erc20.json";
import * as LISTING_FACTORY_JSON from "src/modules/amm/contracts/ListingFactory.json";
import * as TOKEN_LOCKER_JSON from "src/modules/amm/contracts/TokenLocker.json"
import { ADDRESS_SETTINGS } from "src/modules/amm/config/dexConfig";

const secret = process.env.APP_SECRET || "app";
import config from "config/config";
var ethers = require("ethers");
const provider = new ethers.providers.JsonRpcProvider(
  process.env.RPC_END_POINT
);

/**
 * The Production APP_SECRET if leaked with the salt will compromise all accounts
 */
const Web3 = require("web3");
export const web3Default = new Web3(config.rpcEndpoint);

const BN = Web3.utils.BN;
const toBN = Web3.utils.toBN;
const EthUtil = require("ethereumjs-util");

const Transaction = require("ethereumjs-tx");
export default {
  sha512(str: string) {
    return hmacSha512(str, secret).toString();
  },
  sha256(str: string, secret?: string) {
    const localSecret = secret || process.env.SSO_SECRET || "SSO_SECRET";
    const hmac = crypto.createHmac("sha256", localSecret);
    hmac.update(str);
    return hmac.digest("hex");
  },
  encrypt(str: string) {
    return aes
      .encrypt(aes.encrypt(str, secret).toString(), secret + "_x")
      .toString();
  },
  decrypt(str: string) {
    return aes
      .decrypt(aes.decrypt(str, secret + "_x").toString(utf8), secret)
      .toString(utf8);
  },
  async randomHexStr(numBytes) {
    const buffer = await crypto.randomBytes(numBytes);
    return buffer.toString("hex");
  },
  fromWei(value: any) {
    return utils.fromWei(value.toString(), "ether");
  },
  toWei(value: any) {
    return utils.toWei(value.toString(), "ether");
  },
  convertNumber(value, decimal) {
    return ethers.utils.formatUnits(value.toString(), decimal || "ether");
  },
  checkSumAddress(address) {
    return Web3.utils.toChecksumAddress(address);
  },
  toWeiDecimal(value: any, decimal) {
    return utils.toWei(value.toString(), decimal);
  },
  erc20Contract(address: string) {
    const erc20Contract = new ethers.Contract(address, ERC20_ABI, provider);
    return erc20Contract;
  },
  listingFactory() {
    return new ethers.Contract(
      ADDRESS_SETTINGS.LISTING_FACTORY,
      LISTING_FACTORY_JSON.abi,
      provider
    );
  },
  tokenLocker() {
    return new ethers.Contract(
      ADDRESS_SETTINGS.TOKEN_LOCKER,
      TOKEN_LOCKER_JSON.abi,
      provider
    );
  },
};

export const sendTransaction = async (privateKey, to, amount, dataObj) => {
  const wallet = new ethers.Wallet(privateKey).connect(provider);
  let gasPrice = await web3Default.eth.getGasPrice();
  gasPrice = toBN(gasPrice);
  gasPrice = toBN(gasPrice)
    .mul(toBN("11"))
    .div(toBN("10"));

  const _amountHex = Web3.utils.toWei(amount ? amount.toString() : `0`);

  const txObj = {
    chainId: Number(process.env.CHAIN_ID) || 1337, // local 1337
    from: wallet.address,
    value: Web3.utils.toHex(_amountHex || 0),
    gasPrice: Web3.utils.toHex(gasPrice),
    gasLimit: Web3.utils.toHex("2000000"),
    to,
  };

  if (dataObj) {
    txObj["data"] = dataObj.encodeABI();
  }

  try {
    const txn = await wallet.sendTransaction(txObj);
    await txn.wait();
    console.info(`... Sent! ${txn.hash}`);
    return txn.hash;
  } catch (error) {
    console.log(error.message);
  }
};

export const botSendTransaction = async (to, amount, dataObj) => {
  const privateKey = process.env.PRIVATE_KEY_BOT;
  if (!privateKey) {
    console.log(`INVALID privateKey BOT`);

    return;
  }
  const wallet = new ethers.Wallet(privateKey).connect(provider);
  let gasPrice = await web3Default.eth.getGasPrice();
  gasPrice = toBN(gasPrice);
  gasPrice = toBN(gasPrice)
    .mul(toBN("11"))
    .div(toBN("10"));

  const _amountHex = Web3.utils.toWei(amount ? amount.toString() : `0`);

  const txObj = {
    chainId: Number(process.env.CHAIN_ID) || 1337, // local 1337
    from: wallet.address,
    value: Web3.utils.toHex(_amountHex || 0),
    gasPrice: Web3.utils.toHex(gasPrice),
    gasLimit: Web3.utils.toHex("2000000"),
    to,
  };

  if (dataObj) {
    txObj["data"] = dataObj.encodeABI();
  }

  try {
    const txn = await wallet.sendTransaction(txObj);
    await txn.wait();
    console.info(`... Sent! ${txn.hash}`);
    return txn.hash;
  } catch (error) {
    console.log(error.message);
  }
};

async function getBalance(address) {
  let balance = await web3Default.eth.getBalance(address);
  balance = Web3.utils.fromWei(balance);
  return balance;
}

const getNonce = async (address) => {
  return await web3Default.eth.getTransactionCount(address);
};

const getBlockNumber = async () => {
  return await web3Default.eth.getBlockNumber();
};

export const privateKeyToAccount = (privateKey) => {
  //const account = await web3Default.eth.accounts.privateKeyToAccount(privateKey)

  const privateKeyBuffer = EthUtil.toBuffer("0x" + privateKey);
  const publickeyBuffer = EthUtil.privateToPublic(privateKeyBuffer);
  const addressBuffer = EthUtil.pubToAddress(publickeyBuffer);

  const publicKey = "0x" + publickeyBuffer.toString("hex");
  const address = "0x" + addressBuffer.toString("hex");
  //const nonce = await getNonce(address);
  // const blockNumer = await getBlockNumber();
  // const balance = await getBalance(address);
  //   console.log({
  //     privateKey,
  //     publicKey,
  //     address,
  //     nonce,
  //     balance,
  //     blockNumer,
  //   });
  return { privateKey, publicKey, address };
};
//     _account,
//     _collateralToken,
//     _indexToken,
//     _isLong

export const getPositionKey = (
  _account,
  _collateralToken,
  _indexToken,
  _isLong
) => {
  return ethers.utils.solidityKeccak256(
    ["address", "address", "address", "bool"],
    [_account, _collateralToken, _indexToken, _isLong]
  );
};

export const getObjContract = (contract, funcName, params) => {
  return contract.methods[`${funcName}`](...params);
};

export const getBlockTime = async () => {
  const blockNumber = await web3Default.eth.getBlockNumber();
  const block = await web3Default.eth.getBlock(blockNumber);
  return block.timestamp;
};

export const getTimestampByBlockNumber = async (blockNumber) => {
  const block = await web3Default.eth.getBlock(blockNumber);
  return block.timestamp;
};

export const getAddressFromMPK = (master_public_key, index) => {
  const childIndex = index;
  const neuterMasterNode = ethers.utils.HDNode.fromExtendedKey(
    master_public_key
  );
  const neuterChildNode = neuterMasterNode.derivePath(childIndex.toString());
  return neuterChildNode.address;
};

export const getInfoCallFunc = (pkey) => {
  const timestamp = new Date().getTime() / 1000;
  const from = privateKeyToAccount(pkey).address;
  return { timestamp, from };
};

export const callFunc = async (contract, funcName, params) => {
  return await contract.methods[funcName](...params).call();
};
