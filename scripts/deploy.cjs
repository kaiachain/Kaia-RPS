const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  console.log("Deploying KaiaGame…");
  const KaiaGame = await ethers.getContractFactory("KaiaGame");
  const game = await KaiaGame.deploy(); // no constructor args
  await game.deployed();

  const address = game.address;
  console.log("KaiaGame deployed to:", address);

  // Seed house liquidity so commits pass the reservation check
  const [deployer] = await ethers.getSigners();
  const seedAmount = ethers.utils.parseEther("2"); // adjust as needed
  console.log(`Seeding liquidity: ${seedAmount} wei`);
  await (
    await deployer.sendTransaction({ to: address, value: seedAmount })
  ).wait();

  const bal = await ethers.provider.getBalance(address);
  console.log("Contract balance:", bal.toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
