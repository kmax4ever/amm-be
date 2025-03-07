import axios from "axios";
import { web3Default } from "src/core/syncCore.service";
import crypto from "./crypto";
import { logger } from "./log";
const CoinGecko = require("coingecko-api");

const CoinGeckoClient = new CoinGecko();

export const callApi = async (url: string, method, cmc_api_key?, data?) => {
  try {
    let headers;
    if (cmc_api_key) {
      headers = { "X-CMC_PRO_API_KEY": cmc_api_key };
    }

    const rs = await axios({
      method: method,
      url: url,
      timeout: 5000,
      headers,
      data,
    });

    return rs;
  } catch (error) {
    //console.log(error);
    return null;
  }
};

// export const getCoinSupply = async () => {
//   const result = await callApi('https://staking.draken.tech/api/state/get');

//   let coint_supply = 0;
//   if (result.data.code === 1) {
//     const { data } = result.data;
//     //   const number = 9223372036;
//     coint_supply = Math.round(crypto.fromWei(data.coinSupply)) - 9223372036;
//   }
//   return coint_supply;
// };

export const getCoinGeckoPrice = async (coinId: string, currency: string) => {
  try {
    const result = await CoinGeckoClient.simple.price({
      ids: coinId,
      vs_currencies: currency,
    });
    let price = null;
    if (result.data[`${coinId}`][`${currency}`]) {
      price = result.data[`${coinId}`][`${currency}`];
    }
    return price;
  } catch (error) {
    return null;
  }
};

export const getLastestBlock = async () => {
  return await web3Default.eth.getBlockNumber();
};
