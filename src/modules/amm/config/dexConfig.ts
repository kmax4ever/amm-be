import * as dexContract from "../contracts/Dex.json";
import * as wrappedTokenContract from "../contracts/WrappedToken.json";
import * as ListingJson from "../contracts/ListingFactory.json";
import * as TokenLockerJson from "../contracts/TokenLocker.json";
import * as PresaleFactoryJson from "../contracts/PresaleFactory.json";
import * as PresaleJson from "../contracts/Presale.json";
import * as fairToken from "../contracts/FairLaunchToken.json";
import * as PairJson from "../contracts/UniswapV2Pair.json";

export const ADDRESS_SETTINGS = {
  LISTING_FACTORY: process.env.LISTING_FACTORY,
  TOKEN_LOCKER: process.env.TOKEN_LOCKER,
  PRESALE_FACTORY: process.env.PRESALE_FACTORY,
  PZT: `0xfb17d52f77db6e32b5a082ed4307fcfb0a86beee`,
  PAIR: `0x400d7f19ca189762d7944a62ea351db8de54f571`,
};

export const ADDRESS_SYNC = [
  // have to sync  !!!!!IMPORTANT
  ADDRESS_SETTINGS.TOKEN_LOCKER,
  ADDRESS_SETTINGS.LISTING_FACTORY,
  ADDRESS_SETTINGS.PRESALE_FACTORY,
  ADDRESS_SETTINGS.PZT,
  ADDRESS_SETTINGS.PAIR,
];

export const CONTRACT_SYNC = () => {
  const CONTRACT_SYNC = [
    {
      abi: ListingJson.abi,
      address: ADDRESS_SETTINGS.LISTING_FACTORY,
    },
    { abi: TokenLockerJson.abi, address: "" },
    { abi: PresaleFactoryJson.abi, address: "" },
    { abi: TokenLockerJson.abi, address: "" },
    { abi: PresaleJson.abi, address: "" },
    { abi: fairToken.abi, address: "" },
    { abi: PairJson.abi, address: "" },
  ];

  for (let address of ADDRESS_SYNC) {
    //token
    // CONTRACT_SYNC.push({
    //   abi: wrappedTokenContract.abi,
    //   address
    // })
  }

  return CONTRACT_SYNC;
};

export const TOKEN_ADDRESSES = [];
