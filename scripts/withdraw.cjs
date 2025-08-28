const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  // Configuration
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_KAIA_GAME_ADDRESS;
  const WITHDRAW_AMOUNT = process.env.WITHDRAW_AMOUNT; // Optional, if not set will withdraw all unreserved
  const WITHDRAW_ALL = process.env.WITHDRAW_ALL === "true"; // Force withdraw all unreserved

  if (!CONTRACT_ADDRESS) {
    console.error(
      "❌ Error: NEXT_PUBLIC_KAIA_GAME_ADDRESS not set in environment"
    );
    console.log("Please set NEXT_PUBLIC_KAIA_GAME_ADDRESS in your .env file");
    process.exit(1);
  }

  console.log("💰 KAIA Withdraw Script");
  console.log("=======================");
  console.log(`Contract Address: ${CONTRACT_ADDRESS}`);

  if (WITHDRAW_AMOUNT) {
    console.log(`Withdraw Amount: ${WITHDRAW_AMOUNT} KAIA`);
  } else if (WITHDRAW_ALL) {
    console.log(`Withdraw Mode: All Unreserved Liquidity`);
  } else {
    console.log(`Withdraw Mode: All Unreserved Liquidity (default)`);
  }
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

    if (!isOwner) {
      console.error("❌ Error: Only the contract owner can withdraw funds");
      console.log("Owner address:", owner);
      console.log("Your address:", deployer.address);
      process.exit(1);
    }

    console.log("");

    // Check current contract status
    const currentBalance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
    const currentBalanceEther = ethers.utils.formatEther(currentBalance);
    console.log(`Current Contract Balance: ${currentBalanceEther} KAIA`);

    const reservedLiquidity = await game.reservedHouseLiquidity();
    const reservedLiquidityEther = ethers.utils.formatEther(reservedLiquidity);
    console.log(`Reserved House Liquidity: ${reservedLiquidityEther} KAIA`);

    const unreservedLiquidity = currentBalance.sub(reservedLiquidity);
    const unreservedLiquidityEther =
      ethers.utils.formatEther(unreservedLiquidity);
    console.log(`Unreserved Liquidity: ${unreservedLiquidityEther} KAIA`);

    if (unreservedLiquidity.isZero()) {
      console.log("");
      console.log("ℹ️  No unreserved liquidity available to withdraw");
      console.log("All funds are currently reserved for active games");
      process.exit(0);
    }

    console.log("");

    // Determine withdrawal amount
    let withdrawAmountWei;
    let withdrawAmountEther;

    if (WITHDRAW_AMOUNT && !WITHDRAW_ALL) {
      // Specific amount withdrawal
      withdrawAmountWei = ethers.utils.parseEther(WITHDRAW_AMOUNT);
      withdrawAmountEther = WITHDRAW_AMOUNT;

      // Validate amount
      if (withdrawAmountWei.gt(unreservedLiquidity)) {
        console.error(
          "❌ Error: Withdrawal amount exceeds unreserved liquidity"
        );
        console.log(`Requested: ${withdrawAmountEther} KAIA`);
        console.log(`Available: ${unreservedLiquidityEther} KAIA`);
        process.exit(1);
      }

      console.log(`Preparing to withdraw: ${withdrawAmountEther} KAIA`);
      console.log(
        `This will leave: ${ethers.utils.formatEther(unreservedLiquidity.sub(withdrawAmountWei))} KAIA unreserved`
      );
    } else {
      // Withdraw all unreserved
      withdrawAmountWei = unreservedLiquidity;
      withdrawAmountEther = unreservedLiquidityEther;
      console.log(
        `Preparing to withdraw all unreserved: ${withdrawAmountEther} KAIA`
      );
      console.log(`This will leave: 0.00 KAIA unreserved`);
    }

    console.log("");

    // Check deployer balance before withdrawal
    const deployerBalanceBefore = await ethers.provider.getBalance(
      deployer.address
    );
    const deployerBalanceBeforeEther = ethers.utils.formatEther(
      deployerBalanceBefore
    );
    console.log(`Your Balance Before: ${deployerBalanceBeforeEther} KAIA`);

    console.log("");

    // Perform withdrawal
    let tx;
    if (WITHDRAW_AMOUNT && !WITHDRAW_ALL) {
      console.log("💸 Using specific amount withdrawal...");
      tx = await game.withdraw(withdrawAmountWei);
    } else {
      console.log("💸 Using withdraw all unreserved...");
      tx = await game.withdrawAllUnreserved();
    }

    console.log(`Transaction hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    await tx.wait();
    console.log("✅ Withdrawal transaction confirmed!");

    // Check new balances
    const newBalance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
    const newBalanceEther = ethers.utils.formatEther(newBalance);

    const newReservedLiquidity = await game.reservedHouseLiquidity();
    const newUnreservedLiquidity = newBalance.sub(newReservedLiquidity);
    const newUnreservedLiquidityEther = ethers.utils.formatEther(
      newUnreservedLiquidity
    );

    const deployerBalanceAfter = await ethers.provider.getBalance(
      deployer.address
    );
    const deployerBalanceAfterEther =
      ethers.utils.formatEther(deployerBalanceAfter);

    console.log("");
    console.log("📊 Updated Contract Status:");
    console.log(`New Contract Balance: ${newBalanceEther} KAIA`);
    console.log(
      `New Reserved Liquidity: ${ethers.utils.formatEther(newReservedLiquidity)} KAIA`
    );
    console.log(
      `New Unreserved Liquidity: ${newUnreservedLiquidityEther} KAIA`
    );
    console.log("");
    console.log("💰 Your Wallet Status:");
    console.log(`Balance Before: ${deployerBalanceBeforeEther} KAIA`);
    console.log(`Balance After: ${deployerBalanceAfterEther} KAIA`);
    console.log(
      `Received: ${ethers.utils.formatEther(deployerBalanceAfter.sub(deployerBalanceBefore))} KAIA`
    );

    console.log("");
    console.log("🎉 Withdrawal completed successfully!");

    // Show remaining liquidity for players
    if (newUnreservedLiquidity.gt(0)) {
      console.log(
        `Players can still bet up to: ${newUnreservedLiquidityEther} KAIA`
      );
    } else {
      console.log("⚠️  Warning: No unreserved liquidity remaining");
      console.log(
        "Players cannot place new bets until more funds are deposited"
      );
    }
  } catch (error) {
    console.error("❌ Error during withdrawal:", error);

    if (error.message?.includes("Exceeds unreserved")) {
      console.log("");
      console.log(
        "💡 Tip: The withdrawal amount exceeds available unreserved liquidity"
      );
      console.log(
        "   Use 'npm run withdraw:all' to withdraw all available funds"
      );
    } else if (error.message?.includes("Nothing to withdraw")) {
      console.log("");
      console.log("💡 Tip: No unreserved liquidity available");
      console.log("   All funds are currently reserved for active games");
    } else if (error.message?.includes("Not owner")) {
      console.log("");
      console.log("💡 Tip: Only the contract owner can withdraw funds");
    }

    process.exit(1);
  }
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    if (args[0] === "all") {
      process.env.WITHDRAW_ALL = "true";
      console.log("🎯 Mode: Withdraw all unreserved liquidity");
    } else {
      const amount = parseFloat(args[0]);
      if (isNaN(amount) || amount <= 0) {
        console.error(
          "❌ Error: Invalid amount. Please provide a positive number or 'all'"
        );
        console.log("Usage: node scripts/withdraw.cjs [amount|all]");
        console.log("Examples:");
        console.log("  node scripts/withdraw.cjs 25.5    # Withdraw 25.5 KAIA");
        console.log(
          "  node scripts/withdraw.cjs all     # Withdraw all unreserved"
        );
        process.exit(1);
      }
      process.env.WITHDRAW_AMOUNT = args[0];
    }
  }

  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = { main };
