import { callApi } from "./callApi";
const CoinGecko = require("coingecko-api");
const CoinGeckoClient = new CoinGecko();

// https://www.binance.com/api/v3/ticker/price?symbol=BTCUSDT;

const getUrlBinance = (symbol) => {
  if (symbol == "USDT") {
    return `https://www.binance.com/api/v3/ticker/price?symbol=BUSDUSDT`;
  }
  return `https://www.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`;
};

const getUrlCoinBase = (symbol) => {
  return `https://api.exchange.coinbase.com/products/${symbol}-USD/ticker`;
};

const getUrlKraken = (symbol) => {
  return `https://api.kraken.com/0/public/Ticker?pair=${symbol}USDT`;
};

export const getPriceUsdBySymbol = async (symbol) => {
  let price = 0;
  const _symbol = convertSymbol(symbol);
  try {
    const task = [
      getPriceFromBinance(_symbol),
      getPriceFromCoinBase(_symbol),
      getPriceFromKraken(_symbol),
    ];

    let datas;
    datas = await Promise.all(task);
    console.log({ datas });

    datas = datas.filter((i) => {
      if (i) return i;
    });

    let sum = 0;
    datas.map((i) => (sum += i));
    price = sum / datas.length;
  } catch (error) {
    console.log(error.message);
  }
  return Number(price.toFixed(3));
};

const getPriceFromBinance = async (_symbol) => {
  let price = 0;
  try {
    const url = getUrlBinance(_symbol);
    const rs = await callApi(url, "get");

    if (rs && rs.data && rs.data.price) {
      price = +rs.data.price;
    }
  } catch (error) {
    console.log("ERROR getPriceFromBinance", error.message);
  }

  return price;
};

const getPriceFromCoinBase = async (_symbol) => {
  let price = 0;
  try {
    const url = getUrlCoinBase(_symbol);
    const rs = await callApi(url, "get");

    if (rs && rs.data && rs.data.price) {
      price = +rs.data.price;
    }
  } catch (error) {
    console.log("ERROR getPriceFromCoinBase", error.message);
  }
  return price;
};

const getPriceFromKraken = async (_symbol) => {
  let price = 0;
  try {
    const url = getUrlKraken(_symbol);
    const rs = await callApi(url, "get");

    if (rs.data && rs.data.result) {
      const pricesData = rs.data.result[Object.keys(rs.data.result)[0]];
      price = pricesData?.a && pricesData?.a[0] ? +pricesData["a"][0] : 0;
    }
  } catch (error) {
    console.log("ERROR getPriceFromKraken", error.message);
  }
  return price;
};

const getPriceCoinMarketCap = async (symbol) => {
  console.log(`getPriceCoinMarketCap`);
  let price = 0;
  try {
    const apiKey = process.env.CMC_API_KEY;
    if (!apiKey) {
      return price;
    }
    const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${symbol}`;
    const rs = await callApi(url, `get`, apiKey);
    if (
      rs &&
      rs.data &&
      rs.data.data &&
      rs.data.data[symbol][0] &&
      rs.data.data[symbol][0].quote.USD.price
    ) {
      price = rs.data.data[symbol][0].quote.USD.price;
    }
  } catch (error) {
    console.log("Error getPriceCoinMarketCap", error.message);
  }
  return price;
};

export const convertSymbol = (symbol) => {
  let _symbol = symbol;
  const regex = new RegExp(/([W])+/);
  if (regex.test(symbol)) {
    _symbol = symbol.substring(1).toUpperCase();
  }
  return _symbol;
};
