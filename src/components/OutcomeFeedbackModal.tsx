"use client";
import Image from "next/image";
import { getMoveImage } from "@/global/utils";

interface OutcomeFeedbackModalProps {
  showOutcomeFeedback: {
    type: "win" | "lose" | "draw" | null;
    message: string;
    playerMove?: string;
    botMove?: string;
    prizeMoney?: string;
  };
  isFadingOut: boolean;
}

export function OutcomeFeedbackModal({
  showOutcomeFeedback,
  isFadingOut,
}: OutcomeFeedbackModalProps) {
  if (!showOutcomeFeedback.type) {
    return null;
  }

  return (
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
              <div className="text-sm mt-1">{showOutcomeFeedback.botMove}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
