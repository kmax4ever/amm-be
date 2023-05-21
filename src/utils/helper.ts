const BigNumber = require("bignumber.js");
export const dateFromNumber = (value: string) => {
  return new Date(Number(`${value}000`));
};

export const toBigNumber = (value: string) => {
  return new BigNumber(value);
};

export const getYesterday = () => {
  const date = new Date();
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
};

export const pagingFormat = ({ list, total, skip, limit }) => {
  const rs = {
    docs: list,
    pageInfo: {
      total: total,
      skip: skip,
      limit: limit,
    },
  };

  return rs;
};

export const waitMs = (msDuration: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null);
    }, msDuration);
  });
};
