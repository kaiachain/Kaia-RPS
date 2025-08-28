const { HardhatUserConfig } = require("hardhat/config");
require("@nomiclabs/hardhat-ethers");
const dotenv = require("dotenv");
dotenv.config();

const config = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    kaia: {
      url: process.env.KAIA_RPC_URL || "",
      chainId: Number(process.env.CHAIN_ID),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

module.exports = config;
