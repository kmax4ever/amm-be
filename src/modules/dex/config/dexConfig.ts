
import * as dexContract from '../contracts/Dex.json';
import * as wrappedTokenContract from '../contracts/WrappedToken.json';

export const ADDRESS_SETTINGS = {
  DEX_ADDRESS: '0x5C2b4c78d814CEB2dF7e209ABd50da05752454Ec',
  LZ: '0x23B86e8f921aDa427D46053F9c1752a2dCF61729',
  KCOIN: '0x58F928A3F5358754d97E30920e2D874eFE65237d',  
}

export const ADDRESS_SYNC=[ // have to sync  !!!!!IMPORTANT
  ADDRESS_SETTINGS.LZ,
  ADDRESS_SETTINGS.KCOIN,
]

export const CONTRACT_SYNC= () =>{ 

const CONTRACT_SYNC=[{  // dex contract
  abi: dexContract.abi,
  address: ADDRESS_SETTINGS.DEX_ADDRESS,
}];

for(let address of ADDRESS_SYNC) //token
{
  CONTRACT_SYNC.push({
    abi: wrappedTokenContract.abi,
    address
  })
}

return CONTRACT_SYNC;
}


export const TOKEN_ADDRESSES = [ // is token? !!!!!IMPORTANT
  ADDRESS_SETTINGS.LZ,
  ADDRESS_SETTINGS.KCOIN,
]

export const BOOK_SETTINGS={
  SELL_BOOK_LZ_KCOIN: '0x1c7d69223c6294a662773243b3ac14a8f1c9e4d7fbbdfef14eec1b3b71f37bb9',
  BUY_BOOK_LZ_KCOIN: '0x571d59632937092488302ebbe179dcb65c8615634411b862ff855cb5414923b1',
}


export const DEX_CONTRACT_ADDRESS = ADDRESS_SETTINGS.DEX_ADDRESS;

export const COIN_SUPPLY = {
  DEFAULT_NUMBER: 15030000000,
  X_NUMBER: 64,
};

export const PAIRS = [
  {
    displayName: 'LZ/KCOIN',
    key: 'LZ/KCOIN',
    tokenASymbol: 'LZ',
    tokenBSymbol: 'KCOIN',
    options: {
      tokenA: ADDRESS_SETTINGS.LZ,
      tokenB: ADDRESS_SETTINGS.KCOIN,
      sellBookId: BOOK_SETTINGS.SELL_BOOK_LZ_KCOIN,
      buyBookId: BOOK_SETTINGS.BUY_BOOK_LZ_KCOIN,
    },
    fixedDecimalNumber: 6,
  }
];


const listBuyBook = PAIRS.map(i => {
  return i.options.buyBookId;
});

export const getOrderType = (book) => {
  return listBuyBook.some(i => i.toLowerCase() === book.toLowerCase());
};

export const getBook = (tokenA: string, tokenB: string) => {
  let rs = null;
  const pair = PAIRS.find(
    i => i.tokenASymbol === tokenA && i.tokenBSymbol === tokenB,
  );
  if (pair && pair.options) {
    const { sellBookId, buyBookId } = pair.options;
    rs = {
      sellBookId,
      buyBookId,
    };
  }
  return rs;
};

const listBookPairs = {};

PAIRS.forEach(pair => {
  const { tokenASymbol, tokenBSymbol } = pair;
  const { sellBookId, buyBookId, tokenA, tokenB } = pair.options;
  if (!listBookPairs[`${tokenASymbol}`]) {
    listBookPairs[`${tokenASymbol}`] = {
      coin: tokenASymbol,
      tokenA,
      listBook: [],
    };
  }
  if (!listBookPairs[`${tokenBSymbol}`]) {
    listBookPairs[`${tokenBSymbol}`] = {
      coin: tokenBSymbol,
      tokenB,
      listBook: [],
    };
  }
  listBookPairs[`${tokenASymbol}`].listBook.push(sellBookId);
  listBookPairs[`${tokenBSymbol}`].listBook.push(buyBookId);
});

export const getBookByCoin = () => {
  return listBookPairs;
};

export const TIME_CACHE_LZ_PRICE = 10;
export const DEFAULT_SUPPLY = 240000000;
