require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    // Local Hardhat node — run `npm run node` to start it
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Example Sepolia testnet config (fill in your values)
    // sepolia: {
    //   url: `https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID`,
    //   accounts: [`0x${YOUR_PRIVATE_KEY}`],
    // },
  },
  paths: {
    sources:   "./",           // ProductRegistry.sol lives here
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};
