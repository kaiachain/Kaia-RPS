"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  handleCommit,
  handleReveal,
  handleForfeit,
  getLatestGames,
  getLatestGamesOf,
  getTotalGames,
  getReservedHouseLiquidity,
  getContractBalance,
} from "../global/helper";

import { ContractStats } from "@/components/ContractStats";
import { GameHistoryTabs } from "@/components/GameHistoryTabs";
import { GameInterface } from "@/components/GameInterface";
import Navigation from "@/components/Navigation";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import Confetti from "react-confetti";
import { useConnectWallet } from "@web3-onboard/react";

import { Move } from "@/global/utils/enums";
import RockIcon from "@/assets/rock.png";
import PaperIcon from "@/assets/paper.png";
import ScissorsIcon from "@/assets/scissors.png";
import {
  switchNetwork,
  shouldSwitchNetwork,
  getWalletButtonText,
  getTokenBalance,
  setupGameContract,
  getCurrentNetwork,
} from "../global/utils";

export default function GamePage() {
  const [gameContract, setGameContract] = useState<ethers.Contract | null>(
    null
  );

  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [salt, setSalt] = useState<string | null>(null);
  const [participationFee, setParticipationFee] = useState("");
  const [isRevealing, setIsRevealing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showOutcomeFeedback, setShowOutcomeFeedback] = useState<{
    type: "win" | "lose" | "draw" | null;
    message: string;
    playerMove?: string;
    botMove?: string;
    prizeMoney?: string;
  }>({ type: null, message: "" });
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [globalGames, setGlobalGames] = useState<any[]>([]);
  const [playerGames, setPlayerGames] = useState<any[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [totalGames, setTotalGames] = useState<string>("0");
  const [reservedLiquidity, setReservedLiquidity] = useState<string>("0");
  const [contractBalance, setContractBalance] = useState<string>("0");
  const [walletBalance, setWalletBalance] = useState<string>("0");
  const [participationFeeError, setParticipationFeeError] =
    useState<string>("");
  const [hasActiveGame, setHasActiveGame] = useState<boolean>(false);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [isForfeiting, setIsForfeiting] = useState<boolean>(false);
  const [isPageLoaded, setIsPageLoaded] = useState<boolean>(false);

  // Connect wallet using Web3Onboard
  const [{ wallet }, connect] = useConnectWallet();

  // Helper function to get move image
  const getMoveImage = (moveName: string) => {
    switch (moveName) {
      case "Rock":
        return RockIcon;
      case "Paper":
        return PaperIcon;
      case "Scissors":
        return ScissorsIcon;
      default:
        return RockIcon;
    }
  };

  // Set page as loaded after initial render
  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  // Check if player has active game
  const checkActiveGame = useCallback(async () => {
    if (!gameContract || !wallet?.accounts?.[0]?.address) {
      setHasActiveGame(false);
      return;
    }

    try {
      const [exists] = await gameContract.getCurrentGame(
        wallet.accounts[0].address
      );
      setHasActiveGame(exists);
    } catch (error) {
      console.error("Error checking active game:", error);
      setHasActiveGame(false);
    }
  }, [gameContract, wallet?.accounts]);

  // Load games data (with loading state - used for initial load)
  const loadGamesData = useCallback(async () => {
    if (!gameContract) {
      return;
    }

    setIsLoadingGames(true);
    try {
      // Load total games count
      const total = await getTotalGames(gameContract);

      setTotalGames(total);

      // Load contract balance and liquidity
      const balance = await getContractBalance(gameContract);
      const liquidity = await getReservedHouseLiquidity(gameContract);

      setContractBalance(balance);
      setReservedLiquidity(liquidity);

      // Load wallet balance if wallet is connected
      if (wallet?.accounts?.[0]?.address) {
        const provider = new ethers.providers.Web3Provider(wallet.provider);
        const walletBal = await getTokenBalance(
          wallet.accounts[0].address,
          provider
        );

        setWalletBalance(walletBal);
      }

      // Check for active game
      await checkActiveGame();

      // Load global games
      const global = await getLatestGames(gameContract, 30);

      setGlobalGames(global);

      // Load player games if wallet is connected
      if (wallet?.accounts?.[0]?.address) {
        const player = await getLatestGamesOf(
          gameContract,
          wallet.accounts[0].address,
          30
        );

        setPlayerGames(player);
      }
    } catch (error) {
      console.error("Error loading games:", error);

      // Check if wallet is on wrong network and show switch network button
      if (wallet && shouldSwitchNetwork(wallet)) {
        toast.error(
          (t) => (
            <div className="flex items-center justify-between gap-3 flex-col">
              <span className="text-sm font-semibold">Incorrect Network</span>
              <button
                onClick={() => {
                  switchNetwork(wallet);
                  toast.dismiss(t.id);
                }}
                className="bg-[#bff009] text-[#040404] py-1.5 px-4 rounded-2xl hover:bg-[#a8d908] hover:scale-105 transition-all duration-200 ease-in-out cursor-pointer shadow disabled:opacity-50 font-bold text-sm"
              >
                Switch to {getCurrentNetwork().name}
              </button>
            </div>
          ),
          { duration: 6000 }
        );
      } else {
        toast.error("Failed to load games data");
      }
    } finally {
      setIsLoadingGames(false);
    }
  }, [gameContract, wallet, checkActiveGame]);

  // Set up contract and load games when wallet or contract changes
  useEffect(() => {
    // Set up contract if wallet connects and no contract exists
    if (wallet && !gameContract) {
      const contract = setupGameContract(wallet);
      if (contract) {
        setGameContract(contract);
      }
    }

    // Load games data when contract is available
    if (gameContract) {
      loadGamesData();
    }
  }, [wallet, gameContract, loadGamesData]);

  // Silent refresh that doesn't show loading state (used for post-game updates)
  const refreshGamesDataSilently = useCallback(async () => {
    if (!gameContract) {
      return;
    }

    try {
      // Load total games count
      const total = await getTotalGames(gameContract);
      setTotalGames(total);

      // Load contract balance and liquidity
      const balance = await getContractBalance(gameContract);
      const liquidity = await getReservedHouseLiquidity(gameContract);
      setContractBalance(balance);
      setReservedLiquidity(liquidity);

      // Load wallet balance if wallet is connected
      if (wallet?.accounts?.[0]?.address) {
        const provider = new ethers.providers.Web3Provider(wallet.provider);
        const walletBal = await getTokenBalance(
          wallet.accounts[0].address,
          provider
        );
        setWalletBalance(walletBal);
      }

      // Check for active game (but don't override if we just set it)
      // await checkActiveGame();

      // Load global games
      const global = await getLatestGames(gameContract, 30);
      setGlobalGames(global);

      // Load player games if wallet is connected
      if (wallet?.accounts?.[0]?.address) {
        const player = await getLatestGamesOf(
          gameContract,
          wallet.accounts[0].address,
          30
        );
        setPlayerGames(player);
      }
    } catch (error) {
      console.error("Error silently refreshing games:", error);
      // Don't show toast for silent refresh errors
    }
  }, [gameContract, wallet]);

  // Reload games after a successful game (silent refresh)
  const reloadGamesAfterGame = useCallback(() => {
    setTimeout(() => {
      refreshGamesDataSilently();
    }, 500); // Wait for transaction to be mined
  }, [refreshGamesDataSilently]);

  // Commit move
  const commitMove = useCallback(async () => {
    if (!gameContract || selectedMove === null || !salt)
      return toast.error("Move or salt missing");

    setIsCommitting(true);
    try {
      await handleCommit(gameContract, selectedMove, salt, participationFee);
      toast.success("Move committed!");

      await checkActiveGame(); // Update active game state

      reloadGamesAfterGame();
    } catch (err: any) {
      console.error("Commit move error:", err);

      // Check if user rejected the transaction
      if (
        err?.code === 4001 ||
        err?.message?.includes("user rejected") ||
        err?.message?.includes("User rejected")
      ) {
        toast.error("Transaction cancelled by user");
      } else if (
        err?.code === "INSUFFICIENT_FUNDS" ||
        err?.message?.includes("insufficient funds")
      ) {
        toast.error("Insufficient funds for transaction");
      } else if (err?.message?.includes("execution reverted")) {
        toast.error(
          "Transaction failed. Please check your inputs and try again"
        );
      } else if (err?.message) {
        toast.error(err.message);
      } else {
        toast.error("Failed to commit move. Please try again");
      }
    } finally {
      setIsCommitting(false);
    }
  }, [
    gameContract,
    selectedMove,
    salt,
    participationFee,
    checkActiveGame,
    reloadGamesAfterGame,
  ]);

  // Handle participation fee input validation
  const handleParticipationFeeChange = useCallback(
    (value: string) => {
      // Allow empty string
      if (value === "") {
        setParticipationFee("");
        setParticipationFeeError("");
        return;
      }

      // Remove any non-numeric characters except decimal point
      const cleanValue = value.replace(/[^0-9.]/g, "");

      // Ensure only one decimal point
      const parts = cleanValue.split(".");
      if (parts.length > 2) return;

      // Limit to 2 decimal places
      if (parts[1] && parts[1].length > 2) return;

      // Don't allow just a decimal point
      if (cleanValue === ".") return;

      setParticipationFee(cleanValue);
      // Check minimum and maximum values only if it's a valid number
      if (cleanValue && cleanValue !== ".") {
        const numValue = parseFloat(cleanValue);
        if (isNaN(numValue)) {
          setParticipationFeeError("Please enter a valid number");
        } else if (numValue < 0.01) {
          setParticipationFeeError("Minimum participation fee: 0.01 KAIA");
        } else if (numValue > 100) {
          setParticipationFeeError("Maximum participation fee: 100.00 KAIA");
        } else {
          // Check against available liquidity (contract balance - reserved liquidity)
          const reservedLiquidityNum = parseFloat(reservedLiquidity);
          const contractBalanceNum = parseFloat(contractBalance);
          const availableLiquidity = contractBalanceNum - reservedLiquidityNum;

          if (!isNaN(availableLiquidity) && numValue > availableLiquidity) {
            setParticipationFeeError(
              `Insufficient Kaia in contract. Max: ${availableLiquidity.toFixed(2)} KAIA`
            );
          } else {
            setParticipationFeeError("");
          }
        }
      } else {
        setParticipationFeeError("");
      }
    },
    [reservedLiquidity, contractBalance]
  );

  // Reveal move
  const revealMove = useCallback(async () => {
    if (!gameContract || selectedMove === null || !salt)
      return toast.error("Move or salt missing");
    setIsRevealing(true);
    // Clear any previous result when starting a new reveal
    setLastResult(null);
    try {
      await new Promise((res) => setTimeout(res, 1800)); // bot thinking
      const result = await handleReveal(gameContract, selectedMove, salt);

      // The event args from the smart contract are:
      // { player, gameId, userMove, botMove, winner, prizeMoney }
      const { userMove, botMove, winner, prizeMoney } = result;

      // Convert winner enum to string (0=Pending, 1=Player, 2=Bot, 3=Draw)
      const outcome = winner === 1 ? "Win" : winner === 2 ? "Lose" : "Draw";

      setLastResult({
        playerMove: Move[userMove],
        botMove: Move[botMove],
        result: outcome,
        payout: ethers.utils.formatEther(prizeMoney),
      });

      // Show appropriate feedback based on outcome
      if (outcome === "Win") {
        setShowConfetti(true);
        setShowOutcomeFeedback({
          type: "win",
          message: "🎉 You Won! 🎉",
          playerMove: Move[userMove],
          botMove: Move[botMove],
          prizeMoney: ethers.utils.formatEther(prizeMoney),
        });
        setTimeout(() => {
          setShowConfetti(false);
          setIsFadingOut(true);
          setTimeout(() => {
            setShowOutcomeFeedback({ type: null, message: "" });
            setIsFadingOut(false);
          }, 500);
        }, 6000);
      } else if (outcome === "Lose") {
        setShowOutcomeFeedback({
          type: "lose",
          message: "😔 You Lost 😔",
          playerMove: Move[userMove],
          botMove: Move[botMove],
        });
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            setShowOutcomeFeedback({ type: null, message: "" });
            setIsFadingOut(false);
          }, 500);
        }, 3500);
      } else if (outcome === "Draw") {
        setShowOutcomeFeedback({
          type: "draw",
          message: "🤝 It's a Draw! 🤝",
          playerMove: Move[userMove],
          botMove: Move[botMove],
        });
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            setShowOutcomeFeedback({ type: null, message: "" });
            setIsFadingOut(false);
          }, 500);
        }, 3500);
      }
      // Update game state first
      await checkActiveGame(); // Update active game state
      reloadGamesAfterGame();

      // ✅ Only clear inputs after everything is confirmed
      setTimeout(() => {
        setSelectedMove(null);
        setSalt(null);
        setParticipationFee("");
      }, 100);
    } catch (err: any) {
      console.error("Reveal move error:", err);

      // Check if user rejected the transaction
      if (
        err?.code === 4001 ||
        err?.message?.includes("user rejected") ||
        err?.message?.includes("User rejected")
      ) {
        toast.error("Transaction cancelled by user");
      } else if (
        err?.code === "INSUFFICIENT_FUNDS" ||
        err?.message?.includes("insufficient funds")
      ) {
        toast.error("Insufficient funds for transaction");
      } else if (err?.message?.includes("execution reverted")) {
        toast.error(
          "Transaction failed. Please check your inputs and try again"
        );
      } else if (err?.message) {
        toast.error(err.message);
      } else {
        toast.error("Failed to reveal move. Please try again");
      }
    } finally {
      // ✅ Always reset the loading state, but don't clear inputs on error
      setIsRevealing(false);
    }
  }, [gameContract, selectedMove, salt, checkActiveGame, reloadGamesAfterGame]);

  // Memoized event handlers
  const handleForfeitGame = useCallback(async () => {
    if (!gameContract) return;
    try {
      setIsForfeiting(true);
      await handleForfeit(gameContract);
      toast.success("Game forfeited successfully!");
      setHasActiveGame(false);
      setSalt(null);
      setSelectedMove(null);
      setParticipationFee("");

      // Reload games data to reflect the forfeit
      reloadGamesAfterGame();
    } catch (error) {
      console.error("Failed to forfeit game:", error);
      toast.error("Failed to forfeit game");
    } finally {
      setIsForfeiting(false);
    }
  }, [gameContract, reloadGamesAfterGame]);

  return (
    <div className="bg-[#040404] min-h-screen text-white">
      {showConfetti && (
        <Confetti width={window.innerWidth} height={window.innerHeight} />
      )}

      {/* Outcome Feedback Overlay */}
      {showOutcomeFeedback.type && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div
            className={`px-8 py-6 rounded-lg text-2xl font-bold text-white shadow-2xl transform transition-all duration-500 flex flex-col items-center gap-4 bg-gray-800 border-2 ${
              isFadingOut ? "animate-fade-out" : "animate-scale-in"
            } ${
              showOutcomeFeedback.type === "win"
                ? "border-[#bff009]"
                : showOutcomeFeedback.type === "lose"
                  ? "border-red-500"
                  : "border-yellow-500"
            }`}
          >
            <div className="text-center">{showOutcomeFeedback.message}</div>

            {/* Prize Money Display */}
            {showOutcomeFeedback.prizeMoney && (
              <div className="text-center text-lg font-bold text-[#bff009]">
                Prize: {showOutcomeFeedback.prizeMoney} KAIA
              </div>
            )}

            {/* Move Images */}
            {showOutcomeFeedback.playerMove && showOutcomeFeedback.botMove && (
              <div className="flex items-center gap-6">
                {/* Player Move */}
                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium mb-2">You</div>
                  <div className="w-16 h-16 rounded-lg bg-white/20 flex items-center justify-center">
                    <Image
                      src={getMoveImage(showOutcomeFeedback.playerMove)}
                      alt={showOutcomeFeedback.playerMove}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover invert brightness-0"
                    />
                  </div>
                  <div className="text-sm mt-1">
                    {showOutcomeFeedback.playerMove}
                  </div>
                </div>

                {/* VS */}
                <div className="text-xl font-bold">VS</div>

                {/* Bot Move */}
                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium mb-2">Bot</div>
                  <div className="w-16 h-16 rounded-lg bg-white/20 flex items-center justify-center">
                    <Image
                      src={getMoveImage(showOutcomeFeedback.botMove)}
                      alt={showOutcomeFeedback.botMove}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover invert brightness-0"
                    />
                  </div>
                  <div className="text-sm mt-1">
                    {showOutcomeFeedback.botMove}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Navigation
        shouldSwitchNetwork={shouldSwitchNetwork}
        switchNetwork={switchNetwork}
        getWalletButtonText={getWalletButtonText}
      />

      {/* Main Content with top padding for fixed nav */}
      <div
        className={`px-6 max-w-5xl mx-auto pt-16 min-h-[calc(100vh-4rem)] flex items-center justify-center transition-opacity duration-700 ease-out ${
          isPageLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-20">
          {/* Left Column - Main Game */}
          <GameInterface
            selectedMove={selectedMove}
            salt={salt}
            participationFee={participationFee}
            participationFeeError={participationFeeError}
            hasActiveGame={hasActiveGame}
            isCommitting={isCommitting}
            isRevealing={isRevealing}
            isForfeiting={isForfeiting}
            walletBalance={walletBalance}
            lastResult={lastResult}
            reservedLiquidity={reservedLiquidity}
            contractBalance={contractBalance}
            onMoveSelect={setSelectedMove}
            onSaltChange={setSalt}
            onParticipationFeeChange={handleParticipationFeeChange}
            onCommitMove={commitMove}
            onRevealMove={revealMove}
            onForfeit={handleForfeitGame}
            walletAddress={wallet?.accounts?.[0]?.address}
          />

          {/* Right Column - Game Stats and History */}
          <div className="lg:col-span-1 self-center">
            {/* Contract Stats */}
            <ContractStats
              walletAddress={wallet?.accounts?.[0]?.address}
              totalGames={totalGames}
              contractBalance={contractBalance}
              reservedLiquidity={reservedLiquidity}
            />

            {/* Game History Tabs */}
            <GameHistoryTabs
              walletAddress={wallet?.accounts?.[0]?.address}
              isLoadingGames={isLoadingGames}
              playerGames={playerGames}
              globalGames={globalGames}
              onConnect={connect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
