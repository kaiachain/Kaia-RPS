import React, { useState, useEffect } from "react";
import Image from "next/image";
import KaiaLogo from "@/assets/kaialogo.png";
import { useConnectWallet } from "@web3-onboard/react";

interface NavigationProps {
  shouldSwitchNetwork: (wallet: any) => boolean;
  switchNetwork: (wallet: any) => void;
  getWalletButtonText: (wallet: any, connecting: boolean) => string;
}

export default function Navigation({
  shouldSwitchNetwork,
  switchNetwork,
  getWalletButtonText,
}: NavigationProps) {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate blur based on scroll position
  const blurAmount = Math.min((scrollY / 50) * 4, 3); // Max 4px blur after 50px scroll

  return (
    <nav
      className="fixed top-0 left-0 right-0 bg-transparent z-50 px-6 py-3 transition-all duration-200"
      style={{
        backdropFilter: `blur(${blurAmount}px)`,
        backgroundColor: `rgba(0, 0, 0, ${Math.min(scrollY / 50, 0)})`, // Fade in background opacity
      }}
    >
      <div className="flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-1">
          <Image src={KaiaLogo} alt="KAIA Logo" width={60} height={60} />
          <div className="text-xs font-semibold text-[#bff009] mt-2.5">RPS</div>
        </div>

        {/* Wallet Button */}
        <button
          onClick={
            wallet
              ? shouldSwitchNetwork(wallet)
                ? () => switchNetwork(wallet)
                : () => disconnect(wallet)
              : () => connect()
          }
          disabled={connecting}
          className="bg-[#bff009] text-[#040404] py-1.5 px-4 rounded-2xl hover:bg-[#a8d908] hover:scale-105 transition-all duration-200 ease-in-out cursor-pointer shadow disabled:opacity-50 font-bold text-sm"
        >
          {getWalletButtonText(wallet, connecting)}
        </button>
      </div>
    </nav>
  );
}
