export const BALANCE_CONTRACT = {
  abi: [
    {
      inputs: [
        {
          internalType: "address",
          name: "_owner",
          type: "address",
        },
        {
          internalType: "address[]",
          name: "tokenAddresses",
          type: "address[]",
        },
      ],
      name: "getBalances",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
        {
          internalType: "uint256[]",
          name: "",
          type: "uint256[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ],
  address: "0x6b1A7EC3296b6264a6F45C7b685D888eb9C2543f",
};