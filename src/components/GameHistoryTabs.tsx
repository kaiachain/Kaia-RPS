import React from "react";
import { getMoveName, isGameForfeited } from "@/global/utils";

interface Game {
  id: string;
  player: string;
  participationFee: string;
  userMove: string;
  botMove: string;
  winner: string;
  prizeMoney: string;
  commitBlock: string;
  revealBlock: string;
}

interface GameHistoryTabsProps {
  walletAddress?: string;
  isLoadingGames: boolean;
  playerGames: Game[];
  globalGames: Game[];
  onConnect: () => void;
}

export const GameHistoryTabs: React.FC<GameHistoryTabsProps> = ({
  walletAddress,
  isLoadingGames,
  playerGames,
  globalGames,
  onConnect,
}) => {
  const [activeTab, setActiveTab] = React.useState<"recent" | "global">(
    "recent"
  );
  // Memoized game arrays to prevent unnecessary re-renders
  const memoizedPlayerGames = React.useMemo(
    () => playerGames.slice(),
    [playerGames]
  );
  const memoizedGlobalGames = React.useMemo(
    () => globalGames.slice(),
    [globalGames]
  );

  return (
    <div className="animate-fade-in">
      <>
        {/* Tab Headers */}
        <div className="flex mb-2 relative">
          <button
            onClick={() => setActiveTab("recent")}
            className={`flex-1 py-2 px-4 font-bold text-base transition-colors duration-200 cursor-pointer ${
              activeTab === "recent"
                ? "text-[#bff009]"
                : "text-gray-500 hover:text-[#bff009]"
            }`}
          >
            👤 My Games
          </button>
          <button
            onClick={() => setActiveTab("global")}
            className={`flex-1 py-2 px-4 font-bold text-base transition-colors duration-200 cursor-pointer ${
              activeTab === "global"
                ? "text-[#bff009]"
                : "text-gray-500 hover:text-[#bff009]"
            }`}
          >
            🌍 Global Games
          </button>

          {/* Animated Underline */}
          <div
            className={`absolute bottom-0 h-0.5 bg-[#bff009] transition-all duration-300 ease-in-out rounded-full ${
              activeTab === "recent" ? "left-0 w-1/2" : "left-1/2 w-1/2"
            }`}
          />
        </div>

        {/* Tab Content */}
        <div className="relative overflow-hidden h-[400px]">
          <div
            className={`transition-transform duration-300 ease-in-out ${
              activeTab === "recent" ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Your Recent Games Tab */}
            <div>
              {!walletAddress ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 font-semibold mb-4">
                    Connect your wallet to view your games
                  </div>
                  <button
                    onClick={() => onConnect()}
                    className="bg-[#bff009] text-[#040404] py-2 px-6 rounded-lg hover:bg-[#a8d908] hover:scale-102 active:scale-95 transition-all duration-200 font-bold text-sm cursor-pointer shadow-lg hover:shadow-xl"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : isLoadingGames ? (
                <div className="text-center py-4 text-white">
                  Loading your games...
                </div>
              ) : playerGames.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {memoizedPlayerGames.map((game) => (
                    <div
                      key={game.id}
                      className={`p-3 rounded-lg relative cursor-pointer transition-all duration-200 ${
                        game.winner === "0"
                          ? "bg-[#bff009]/10 hover:bg-[#bff009]/20 border border-[#bff009]/40 hover:border-[#bff009]/60" // Light green background and border for ongoing games
                          : "bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-[#bff009]/60" // Default background and border for completed games
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">
                            Game #{game.id}
                          </div>
                          <div className="text-xs text-gray-400">
                            Participation Fee:{" "}
                            <span className="text-[#bff009]">
                              {game.participationFee} KAIA
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">
                            Prize:{" "}
                            <span className="text-[#bff009]">
                              {game.winner === "0"
                                ? "-"
                                : `${game.prizeMoney} KAIA`}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-xs flex flex-col items-end">
                          <div className="mb-2">
                            <div
                              className={`font-semibold ${
                                game.winner === "1"
                                  ? "text-[#bff009]"
                                  : game.winner === "2"
                                    ? "text-[#df4037]"
                                    : game.winner === "0"
                                      ? "text-[#bff009]"
                                      : "text-[#fbbf24]"
                              }`}
                            >
                              {game.winner === "1"
                                ? "You Won! 🎉"
                                : game.winner === "2"
                                  ? "You Lost 😔"
                                  : game.winner === "0"
                                    ? "In Progress ⏳"
                                    : "Draw 🤝"}
                            </div>
                            <div className="text-gray-300">
                              {game.winner === "0" ? (
                                "Awaiting Reveal"
                              ) : isGameForfeited(game) ? (
                                "Forfeited"
                              ) : (
                                <>
                                  {getMoveName(game.userMove)} vs{" "}
                                  {getMoveName(game.botMove)}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-300">
                  No games played yet
                </div>
              )}
            </div>
          </div>

          <div
            className={`absolute top-0 left-0 w-full transition-transform duration-300 ease-in-out ${
              activeTab === "global" ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Global Games Tab */}
            <div>
              {!walletAddress ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 font-semibold mb-4">
                    Connect your wallet to view global games
                  </div>
                  <button
                    onClick={() => onConnect()}
                    className="bg-[#bff009] text-[#040404] py-2 px-6 rounded-lg hover:bg-[#a8d908] hover:scale-102 active:scale-95 transition-all duration-200 font-bold text-sm cursor-pointer shadow-lg hover:shadow-xl"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : isLoadingGames ? (
                <div className="text-center py-4 text-white">
                  Loading games...
                </div>
              ) : globalGames.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {memoizedGlobalGames.map((game) => (
                    <div
                      key={game.id}
                      className={`p-3 rounded-lg relative cursor-pointer transition-all duration-200 ${
                        game.winner === "0"
                          ? "bg-[#bff009]/10 hover:bg-[#bff009]/20 border border-[#bff009]/40 hover:border-[#bff009]/60" // Light green background and border for ongoing games
                          : "bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-[#bff009]/60" // Default background and border for completed games
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">
                            Game #{game.id}
                          </div>
                          <div className="text-xs text-gray-300">
                            Player: {game.player.slice(0, 6)}...
                            {game.player.slice(-4)}
                          </div>
                          <div className="text-xs text-gray-400">
                            Participation Fee:{" "}
                            <span className="text-[#bff009]">
                              {game.participationFee} KAIA
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">
                            Prize:{" "}
                            <span className="text-[#bff009]">
                              {game.winner === "0"
                                ? "-"
                                : `${game.prizeMoney} KAIA`}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-xs flex flex-col items-end">
                          <div className="mb-5">
                            <div
                              className={`font-semibold ${
                                game.winner === "1"
                                  ? "text-[#bff009]"
                                  : game.winner === "2"
                                    ? "text-[#df4037]"
                                    : game.winner === "0"
                                      ? "text-[#bff009]"
                                      : "text-[#fbbf24]"
                              }`}
                            >
                              {game.winner === "1"
                                ? "Player Win"
                                : game.winner === "2"
                                  ? "Bot Win"
                                  : game.winner === "0"
                                    ? "In Progress ⏳"
                                    : "Draw"}
                            </div>
                            <div className="text-gray-300">
                              {game.winner === "0" ? (
                                "Awaiting Reveal"
                              ) : isGameForfeited(game) ? (
                                "Forfeited"
                              ) : (
                                <>
                                  {getMoveName(game.userMove)} vs{" "}
                                  {getMoveName(game.botMove)}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-300">
                  No games played yet
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    </div>
  );
};
