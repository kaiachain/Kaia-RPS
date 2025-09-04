import React from "react";
import Image from "next/image";
import { Move } from "@/global/utils/enums";
import { BotMoveCard } from "@/components/BotMoveCard";
import { ClipLoader } from "react-spinners";
import { generateRandomSalt } from "@/global/utils";
import RockIcon from "@/assets/rock.png";
import PaperIcon from "@/assets/paper.png";
import ScissorsIcon from "@/assets/scissors.png";
import KAIAIcon from "@/assets/kaia-token.png";

interface GameInterfaceProps {
  // Game state
  selectedMove: Move | null;
  salt: string | null;
  participationFee: string;
  participationFeeError: string;
  hasActiveGame: boolean;
  isCommitting: boolean;
  isRevealing: boolean;
  isForfeiting: boolean;
  walletBalance: string;
  lastResult: any;

  // Contract state
  reservedLiquidity: string;
  contractBalance: string;

  // Event handlers
  onMoveSelect: (move: Move) => void;
  onSaltChange: (salt: string) => void;
  onParticipationFeeChange: (value: string) => void;
  onCommitMove: () => void;
  onRevealMove: () => void;
  onForfeit: () => void;

  // Wallet state
  walletAddress?: string;
}

export const GameInterface: React.FC<GameInterfaceProps> = ({
  selectedMove,
  salt,
  participationFee,
  participationFeeError,
  hasActiveGame,
  isCommitting,
  isRevealing,
  isForfeiting,
  walletBalance,
  lastResult,
  onMoveSelect,
  onSaltChange,
  onParticipationFeeChange,
  onCommitMove,
  onRevealMove,
  onForfeit,
  walletAddress,
}) => {
  const handleGenerateSalt = React.useCallback(() => {
    onSaltChange(generateRandomSalt());
  }, [onSaltChange]);
  return (
    <div className="lg:col-span-1 self-center animate-fade-in">
      <div className="mb-4 flex justify-center gap-4">
        <div className="flex flex-col items-center">
          <BotMoveCard
            move={lastResult?.botMove || null}
            isRevealing={isRevealing}
          />
          <span className="mt-2 text-sm font-semibold text-white">
            Kaia RPS Bot
          </span>
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-bold text-gray-300 mb-2">
          Salt
        </label>
        <div className="relative group">
          <input
            type="text"
            placeholder="Enter your salt"
            value={salt || ""}
            onChange={(e) => onSaltChange(e.target.value)}
            className="w-full p-2 pl-3 pr-20 border-1 border-gray-600 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#bff009]/50 focus:border-[#bff009] group-hover:border-[#bff009]/60 transition-all duration-200 font-semibold"
          />
          <button
            onClick={handleGenerateSalt}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#bff009] hover:bg-[#a8d908] text-[#040404] px-3 py-1 rounded text-xs font-bold transition-all duration-200 hover:scale-102 cursor-pointer"
          >
            Generate
          </button>
        </div>
        <div className="flex justify-end items-center mt-2">
          <button
            onClick={onForfeit}
            disabled={!hasActiveGame || isForfeiting}
            className="text-xs text-gray-400 hover:text-[#bff009] transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isForfeiting ? "Forfeiting..." : "Forgot salt?"}
          </button>
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-bold text-gray-300 mb-2">
          Participation Fee
        </label>

        <div className="relative group">
          <input
            type="text"
            placeholder="0.01 - 100.00"
            value={participationFee}
            onChange={(e) => onParticipationFeeChange(e.target.value)}
            className="w-full p-2 pl-3 pr-10 border-1 border-gray-600 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#bff009]/50 focus:border-[#bff009] group-hover:border-[#bff009]/60 transition-all duration-200 font-semibold"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Image
              src={KAIAIcon}
              alt="KAIA"
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
        </div>

        {/* Quick Fee Buttons */}
        <div className="flex gap-2 mt-2">
          {[0.01, 0.1, 1, 5, 10].map((amount) => (
            <button
              key={amount}
              onClick={() => onParticipationFeeChange(amount.toString())}
              className="px-3 py-1 text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-all duration-200 hover:scale-105 cursor-pointer"
            >
              {amount} KAIA
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-red-400">{participationFeeError}</div>
          {walletAddress && (
            <div className="text-xs text-gray-400">
              Balance: {parseFloat(walletBalance).toFixed(2)} KAIA
            </div>
          )}
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-bold text-gray-300 mb-2">
          Choose Your Move
        </label>
        <div className="flex gap-2 sm:gap-4 w-full">
          {Object.entries(Move)
            .filter(([key]) => isNaN(Number(key)) && key !== "None")
            .map(([key, val]) => {
              const isSelected = selectedMove === val;

              // Get the correct image based on the move
              const getMoveImage = (moveKey: string) => {
                switch (moveKey) {
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

              return (
                <button
                  key={key}
                  onClick={() => onMoveSelect(val as Move)}
                  className={`relative group flex flex-col items-center p-2 sm:p-4 rounded-xl transition-all duration-300 transform hover:scale-105 flex-1 cursor-pointer ${
                    isSelected
                      ? "bg-[#bff009]/20 border-1 border-[#bff009] shadow-lg shadow-[#bff009]/25"
                      : "bg-gray-800/50 border-1 border-gray-600 hover:border-[#bff009]/60 hover:bg-gray-700/50"
                  }`}
                >
                  {/* Image */}
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 mb-2 sm:mb-3 transition-all duration-300 ${
                      isSelected ? "scale-110" : "group-hover:scale-105"
                    }`}
                  >
                    <Image
                      src={getMoveImage(key)}
                      alt={key}
                      width={80}
                      height={80}
                      className={`w-full h-full object-cover transition-all duration-300 invert brightness-0 ${
                        isSelected
                          ? "animate-wiggle"
                          : "group-hover:animate-wiggle"
                      }`}
                    />
                  </div>
                  {/* Label */}
                  <span
                    className={`font-bold text-xs sm:text-sm transition-colors duration-300 ${
                      isSelected
                        ? "text-[#bff009]"
                        : "text-white group-hover:text-[#bff009]"
                    }`}
                  >
                    {key}
                  </span>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#bff009] rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-[#040404]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Hover glow effect */}
                  <div
                    className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
                      isSelected
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-30"
                    } bg-gradient-to-br from-[#bff009]/20 to-transparent`}
                  />
                </button>
              );
            })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {!hasActiveGame ? (
          <button
            onClick={onCommitMove}
            disabled={
              !selectedMove ||
              !salt ||
              !participationFee ||
              !!participationFeeError ||
              isCommitting ||
              !walletAddress
            }
            className="flex-1 bg-[#bff009] text-[#040404] py-3 px-6 rounded-lg font-bold transition-all duration-200 hover:scale-102 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isCommitting ? (
              <>
                <ClipLoader size={16} color="#040404" />
                <span>Committing...</span>
              </>
            ) : (
              "Commit Move"
            )}
          </button>
        ) : (
          <button
            onClick={onRevealMove}
            disabled={!selectedMove || !salt || isRevealing || !walletAddress}
            className="flex-1 bg-[#bff009] text-[#040404] py-3 px-6 rounded-lg font-bold transition-all duration-200 hover:scale-102 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isRevealing ? (
              <>
                <ClipLoader size={16} color="#040404" />
                <span>Revealing...</span>
              </>
            ) : (
              "Reveal Move"
            )}
          </button>
        )}
      </div>
    </div>
  );
};
