import React from "react";

interface ContractStatsProps {
  walletAddress?: string;
  totalGames: string;
  contractBalance: string;
  reservedLiquidity: string;
}

export const ContractStats: React.FC<ContractStatsProps> = ({
  walletAddress,
  totalGames,
  contractBalance,
  reservedLiquidity,
}) => {
  // Memoized computed values
  const availableLiquidity = React.useMemo(() => {
    if (!walletAddress) return "-";
    return (
      parseFloat(contractBalance) - parseFloat(reservedLiquidity)
    ).toFixed(2);
  }, [walletAddress, contractBalance, reservedLiquidity]);

  return (
    <div className="mb-6 animate-fade-in">
      <h3 className="font-bold text-base mb-1 text-white">📈 Contract Stats</h3>
      <div className="space-y-2">
        {/* Total Games Stats */}
        <div className="bg-gray-800/50 border border-gray-600 text-white p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-700/50 hover:border-[#bff009]/60">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">📊 Games</h3>
              <p className="text-xs text-gray-300">Total played</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-[#bff009]">
                {walletAddress ? totalGames : "-"}
              </div>
            </div>
          </div>
        </div>

        {/* Available Liquidity Stats */}
        <div className="bg-gray-800/50 border border-gray-600 text-white p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-700/50 hover:border-[#bff009]/60">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">💰 Available KAIA</h3>
              <p className="text-xs text-gray-300">For new games</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-[#bff009]">
                {availableLiquidity}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
