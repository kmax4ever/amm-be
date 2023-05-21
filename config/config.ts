const config = {
  mongo: {
    uri: process.env.DB_ENDPOINT,
  },
  rpcEndpoint: process.env.RPC_END_POINT,
  version: process.env.VERSION ? +process.env.VERSION : 1,
  isSync: process.env.IS_SYNC || false,
  initBlock: Number(process.env.INIT_BLOCK_SYNC) || 10000000,
};

export default config;
