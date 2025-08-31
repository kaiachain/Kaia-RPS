// helpers.tsx
import { ethers } from "ethers";
import { Move } from "./utils/enums";

// Gas estimation helper with buffer
async function estimateGasWithBuffer(
  contract: ethers.Contract,
  method: string,
  params: any[] = [],
  overrides: any = {}
) {
  try {
    const gasEstimate = await contract.estimateGas[method](
      ...params,
      overrides
    );

    // Use higher buffer for reveal operations
    const buffer = method === "revealMove" ? 150 : 120; // 50% buffer for reveal, 20% for others
    const gasLimit = gasEstimate.mul(buffer).div(100);

    return gasLimit;
  } catch (error) {
    console.error(`Error estimating gas for ${method}:`, error);
    // Higher fallback for reveal operations
    const fallbackGas = method === "revealMove" ? 800000 : 300000; // Increased to 800k for reveal

    return ethers.BigNumber.from(fallbackGas);
  }
}

// Commit a move
export async function handleCommit(
  gameContract: ethers.Contract,
  selectedMove: Move,
  salt: string,
  participationFee: string
) {
  // Validate move (should be 1-3, not 0)
  if (selectedMove === Move.None) {
    throw new Error("Invalid move: Cannot commit with None move");
  }

  // Convert salt to bytes32 format as expected by the smart contract
  const saltBytes32 = ethers.utils.formatBytes32String(salt);

  // Create commit hash matching the smart contract's expected format
  // The contract expects: keccak256(abi.encodePacked(move, salt))
  const commitHash = ethers.utils.solidityKeccak256(
    ["uint8", "bytes32"],
    [selectedMove, saltBytes32]
  );

  // Estimate gas with buffer
  const gasLimit = await estimateGasWithBuffer(
    gameContract,
    "commitMove",
    [commitHash],
    { value: ethers.utils.parseEther(participationFee) }
  );

  const tx = await gameContract.commitMove(commitHash, {
    value: ethers.utils.parseEther(participationFee),
    gasLimit: gasLimit,
  });
  return tx.wait();
}

// Reveal a move
export async function handleReveal(
  gameContract: ethers.Contract,
  selectedMove: Move,
  salt: string
) {
  try {
    // Validate move (should be 1-3, not 0)
    if (selectedMove === Move.None) {
      throw new Error("Invalid move: Cannot reveal with None move");
    }

    // Convert salt to bytes32 format as expected by the smart contract
    const saltBytes32 = ethers.utils.formatBytes32String(salt);

    // Use a fixed high gas limit for reveal operations
    const gasLimit = ethers.BigNumber.from(1000000); // 1M gas for reveal

    const tx = await gameContract.revealMove(selectedMove, saltBytes32, {
      gasLimit: gasLimit,
    });

    const receipt = await tx.wait();

    // The smart contract emits "MoveRevealed" event, not "GameRevealed"
    const event = receipt.events?.find((e: any) => e.event === "MoveRevealed");
    if (!event) {
      throw new Error("No MoveRevealed event found in transaction receipt");
    }

    return event.args;
  } catch (error: any) {
    console.error("Reveal transaction failed:", error);

    // Re-throw the error with additional context
    if (error.message?.includes("user rejected") || error.code === 4001) {
      throw new Error("Transaction was rejected by user");
    } else if (error.message?.includes("Invalid move or salt")) {
      throw new Error("Invalid move or salt - please check your inputs");
    } else if (error.message?.includes("insufficient funds")) {
      throw new Error("Insufficient funds for transaction");
    } else {
      // Re-throw the original error if we can't categorize it
      throw new Error("Something went wrong");
    }
  }
}

// Forfeit a game
export async function handleForfeit(gameContract: ethers.Contract) {
  // Estimate gas with buffer
  const gasLimit = await estimateGasWithBuffer(
    gameContract,
    "forfeitCurrentGame"
  );

  const tx = await gameContract.forfeitCurrentGame({
    gasLimit: gasLimit,
  });
  const receipt = await tx.wait();

  // Return the transaction receipt for further processing if needed
  return receipt;
}

// Get the latest global games (up to 30)
export async function getLatestGames(
  gameContract: ethers.Contract,
  count: number = 30
) {
  if (count > 30) {
    count = 30; // Smart contract caps at 30
  }

  const games = await gameContract.getLatestGames(count);

  // Handle case where there are no games
  if (!games || games.length === 0) {
    return [];
  }

  const formattedGames = await Promise.all(
    games.map(async (game: any) => {
      return {
        id: game.id.toString(),
        player: game.player,
        participationFee: ethers.utils.formatEther(game.participationFee),
        userMove: game.userMove.toString(),
        botMove: game.botMove.toString(),
        winner: game.winner.toString(),
        prizeMoney: ethers.utils.formatEther(game.prizeMoney),
        commitBlock: game.commitBlock.toString(),
        revealBlock: game.revealBlock.toString(),
      };
    })
  );

  return formattedGames;
}

// Get the latest games for a specific player (up to 30)
export async function getLatestGamesOf(
  gameContract: ethers.Contract,
  playerAddress: string,
  count: number = 30
) {
  if (count > 30) {
    count = 30; // Smart contract caps at 30
  }

  const games = await gameContract.getLatestGamesOf(playerAddress, count);

  // Handle case where there are no games
  if (!games || games.length === 0) {
    return [];
  }

  const formattedGames = await Promise.all(
    games.map(async (game: any) => {
      return {
        id: game.id.toString(),
        player: game.player,
        participationFee: ethers.utils.formatEther(game.participationFee),
        userMove: game.userMove.toString(),
        botMove: game.botMove.toString(),
        winner: game.winner.toString(),
        prizeMoney: ethers.utils.formatEther(game.prizeMoney),
        commitBlock: game.commitBlock.toString(),
        revealBlock: game.revealBlock.toString(),
      };
    })
  );
  return formattedGames;
}

// Get total number of games played
export async function getTotalGames(gameContract: ethers.Contract) {
  try {
    const totalGames = await gameContract.totalGames();
    return totalGames.toString();
  } catch (error) {
    console.error("Error getting total games:", error);
    // Return "0" if there's an error (likely no games exist yet)
    return "0";
  }
}

// Get reserved house liquidity
export async function getReservedHouseLiquidity(gameContract: ethers.Contract) {
  try {
    const reservedLiquidity = await gameContract.reservedHouseLiquidity();
    return ethers.utils.formatEther(reservedLiquidity);
  } catch (error) {
    console.error("Error getting reserved house liquidity:", error);
    // Return "0" if there's an error
    return "0";
  }
}

// Get total contract balance
export async function getContractBalance(gameContract: ethers.Contract) {
  const balance = await gameContract.provider.getBalance(gameContract.address);

  return ethers.utils.formatEther(balance);
}
