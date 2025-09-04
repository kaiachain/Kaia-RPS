// BotMoveCard.tsx
"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

interface BotMoveCardProps {
  move: string | null;
  isRevealing: boolean;
}

export const BotMoveCard: React.FC<BotMoveCardProps> = ({
  move,
  isRevealing,
}) => {
  const [showMove, setShowMove] = useState(false);

  // Helper function to get the move image
  const getMoveImage = (moveNumber: string | null) => {
    if (!moveNumber) return null;

    // Handle both string names and number formats
    if (typeof moveNumber === "string") {
      switch (moveNumber) {
        case "Rock":
          return "/rock.png";
        case "Paper":
          return "/paper.png";
        case "Scissors":
          return "/scissors.png";
        default:
          // Try parsing as number
          const moveNum = parseInt(moveNumber);
          switch (moveNum) {
            case 1:
              return "/rock.png";
            case 2:
              return "/paper.png";
            case 3:
              return "/scissors.png";
            default:
              return null;
          }
      }
    } else {
      // Handle number format
      switch (moveNumber) {
        case 1:
          return "/rock.png";
        case 2:
          return "/paper.png";
        case 3:
          return "/scissors.png";
        default:
          return null;
      }
    }
  };

  // Show move image when move is available and not revealing
  useEffect(() => {
    if (move && !isRevealing) {
      setShowMove(true);

      // Hide move after 5 seconds
      const timer = setTimeout(() => {
        setShowMove(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [move, isRevealing]);

  // Reset when revealing starts
  useEffect(() => {
    if (isRevealing) {
      setShowMove(false);
    }
  }, [isRevealing]);

  // Simple logic: show move if available and not revealing, otherwise show bot
  const shouldShowMove = showMove && move && !isRevealing;
  const moveImage = shouldShowMove ? getMoveImage(move) : null;

  return (
    <motion.div
      className="w-24 h-24 rounded-lg flex items-center justify-center text-2xl font-bold text-white shadow-lg bg-gray-800 overflow-hidden cursor-pointer"
      whileHover={{
        scale: 1.05,
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
      transition={{
        duration: 0.1,
      }}
    >
      <motion.div
        key={shouldShowMove ? "move" : "bot"}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full flex items-center justify-center"
      >
        {shouldShowMove && moveImage ? (
          <Image
            src={moveImage}
            alt={`Bot chose ${move}`}
            width={96}
            height={96}
            className="w-full h-full object-cover invert brightness-0"
          />
        ) : (
          <Image
            src="/bot.gif"
            alt="Bot thinking"
            width={96}
            height={96}
            className="w-full h-full object-cover"
          />
        )}
      </motion.div>
    </motion.div>
  );
};
