const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  // Configuration
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_KAIA_GAME_ADDRESS;

  // Get deposit amount from environment variable if you want to deposit a specific amount
  const DEPOSIT_AMOUNT = process.env.DEPOSIT_AMOUNT || "10"; // Default 10 KAIA if no environment variable set

  if (!CONTRACT_ADDRESS) {
    console.error(
      "❌ Error: NEXT_PUBLIC_KAIA_GAME_ADDRESS not set in environment"
    );
    console.log("Please set NEXT_PUBLIC_KAIA_GAME_ADDRESS in your .env file");
    process.exit(1);
  }

  console.log("🚀 KAIA Deposit Script");
  console.log("======================");
  console.log(`Contract Address: ${CONTRACT_ADDRESS}`);
  console.log(`Deposit Amount: ${DEPOSIT_AMOUNT} KAIA`);
  console.log("");

  try {
    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log(`Using signer: ${deployer.address}`);

    // Get contract instance
    const KaiaGame = await ethers.getContractFactory("KaiaGame");
    const game = KaiaGame.attach(CONTRACT_ADDRESS);

    // Check if deployer is the owner
    const owner = await game.owner();
    const isOwner = deployer.address.toLowerCase() === owner.toLowerCase();

    console.log(`Contract Owner: ${owner}`);
    console.log(`Is Signer Owner: ${isOwner ? "✅ Yes" : "❌ No"}`);
    console.log("");

    // Check current contract balance
    const currentBalance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
    const currentBalanceEther = ethers.utils.formatEther(currentBalance);
    console.log(`Current Contract Balance: ${currentBalanceEther} KAIA`);

    // Check reserved liquidity
    const reservedLiquidity = await game.reservedHouseLiquidity();
    const reservedLiquidityEther = ethers.utils.formatEther(reservedLiquidity);
    console.log(`Reserved House Liquidity: ${reservedLiquidityEther} KAIA`);

    // Calculate available liquidity
    const availableLiquidity = currentBalance.sub(reservedLiquidity);
    const availableLiquidityEther =
      ethers.utils.formatEther(availableLiquidity);
    console.log(`Available Liquidity: ${availableLiquidityEther} KAIA`);
    console.log("");

    // Parse deposit amount
    const depositAmountWei = ethers.utils.parseEther(DEPOSIT_AMOUNT);
    console.log(
      `Preparing to deposit: ${DEPOSIT_AMOUNT} KAIA (${depositAmountWei.toString()} wei)`
    );

    // Check deployer balance
    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    const deployerBalanceEther = ethers.utils.formatEther(deployerBalance);
    console.log(`Deployer Balance: ${deployerBalanceEther} KAIA`);

    if (deployerBalance.lt(depositAmountWei)) {
      console.error("❌ Error: Insufficient balance for deposit");
      console.log(`Required: ${DEPOSIT_AMOUNT} KAIA`);
      console.log(`Available: ${deployerBalanceEther} KAIA`);
      process.exit(1);
    }

    console.log("");

    // Perform deposit
    if (isOwner) {
      console.log("🔐 Using owner deposit function...");

      const tx = await game.deposit({ value: depositAmountWei });
      console.log(`Transaction hash: ${tx.hash}`);

      await tx.wait();
      console.log("✅ Deposit transaction confirmed!");
    } else {
      console.log("💸 Using direct transfer (fallback)...");

      const tx = await deployer.sendTransaction({
        to: CONTRACT_ADDRESS,
        value: depositAmountWei,
      });
      console.log(`Transaction hash: ${tx.hash}`);

      await tx.wait();
      console.log("✅ Transfer transaction confirmed!");
    }

    // Check new balance
    const newBalance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
    const newBalanceEther = ethers.utils.formatEther(newBalance);
    console.log("");
    console.log("📊 Updated Contract Status:");
    console.log(`New Contract Balance: ${newBalanceEther} KAIA`);
    console.log(
      `Balance Increase: ${ethers.utils.formatEther(newBalance.sub(currentBalance))} KAIA`
    );

    // Recalculate available liquidity
    const newReservedLiquidity = await game.reservedHouseLiquidity();
    const newAvailableLiquidity = newBalance.sub(newReservedLiquidity);
    const newAvailableLiquidityEther = ethers.utils.formatEther(
      newAvailableLiquidity
    );
    console.log(`New Available Liquidity: ${newAvailableLiquidityEther} KAIA`);

    console.log("");
    console.log("🎉 Deposit completed successfully!");
  } catch (error) {
    console.error("❌ Error during deposit:", error);

    if (error.message.includes("Not owner")) {
      console.log("");
      console.log(
        "💡 Tip: Only the contract owner can use the deposit() function."
      );
      console.log(
        "   The script will automatically fall back to direct transfer."
      );
    }

    process.exit(1);
  }
}

// Handle command line arguments
if (require.main === module) {
  // Check for command line argument
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const amount = parseFloat(args[0]);
    if (isNaN(amount) || amount <= 0) {
      console.error(
        "❌ Error: Invalid amount. Please provide a positive number."
      );
      console.log("Usage: node scripts/deposit.cjs [amount]");
      console.log("Example: node scripts/deposit.cjs 25.5");
      process.exit(1);
    }
    process.env.DEPOSIT_AMOUNT = args[0];
  }

  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = { main };
