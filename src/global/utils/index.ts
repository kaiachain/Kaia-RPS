import { ethers } from "ethers";
import toast from "react-hot-toast";
import { KAIA_GAME_ABI, KAIA_GAME_ADDRESS } from "../constants";

// Environment configuration
export const ENV = process.env.NEXT_PUBLIC_ENV || "testnet";

// Network configurations
export const NETWORKS = {
  testnet: {
    chainId: "0x3e9", // 1001
    name: "Kairos Testnet",
    rpcUrl: "https://responsive-green-emerald.kaia-kairos.quiknode.pro",
    blockExplorer: "https://kairos.kaiascan.io",
    token: "KAIA",
  },
  mainnet: {
    chainId: "0x2019", // 8217
    name: "Kaia Mainnet",
    rpcUrl: "https://rpc.ankr.com/kaia",
    blockExplorer: "https://kaiascan.io",
    token: "KAIA",
  },
} as const;

// Convert to Web3Onboard chain format
export const getWeb3OnboardChains = () => {
  return Object.values(NETWORKS).map((network) => ({
    id: network.chainId,
    token: network.token,
    label: network.name,
    rpcUrl: network.rpcUrl,
    blockExplorerUrl: network.blockExplorer,
  }));
};

// Get current network config
export const getCurrentNetwork = () => {
  return NETWORKS[ENV as keyof typeof NETWORKS] || NETWORKS.testnet;
};

// Check if user is on correct network
export const isCorrectNetwork = (walletChainId: string) => {
  const currentNetwork = getCurrentNetwork();
  return walletChainId === currentNetwork.chainId;
};

// Network switching function
export const switchNetwork = async (wallet: any) => {
  if (!wallet) return;

  try {
    const currentNetwork = getCurrentNetwork();
    const provider = new ethers.providers.Web3Provider(wallet.provider);

    // Request network switch
    await provider.send("wallet_switchEthereumChain", [
      { chainId: currentNetwork.chainId },
    ]);

    toast.success(`Switched to ${currentNetwork.name}`);

    // Refresh the page or reconnect to update the state
    window.location.reload();
  } catch (error: any) {
    console.error("Network switch error:", error);

    // If the network doesn't exist, add it
    if (error.code === 4902) {
      try {
        const currentNetwork = getCurrentNetwork();
        const provider = new ethers.providers.Web3Provider(wallet.provider);

        await provider.send("wallet_addEthereumChain", [
          {
            chainId: currentNetwork.chainId,
            chainName: currentNetwork.name,
            nativeCurrency: {
              name: currentNetwork.token,
              symbol: currentNetwork.token,
              decimals: 18,
            },
            rpcUrls: [currentNetwork.rpcUrl],
            blockExplorerUrls: [currentNetwork.blockExplorer],
          },
        ]);

        toast.success(`Added and switched to ${currentNetwork.name}`);
        window.location.reload();
      } catch (addError: any) {
        console.error("Add network error:", addError);
        toast.error("Failed to add network");
      }
    } else {
      toast.error("Failed to switch network");
    }
  }
};

// Check if wallet is on correct network
export const shouldSwitchNetwork = (wallet: any) => {
  return wallet && !isCorrectNetwork(wallet.chains[0].id);
};

// Get button text based on wallet state
export const getWalletButtonText = (wallet: any, connecting: boolean) => {
  if (connecting) return "Connecting...";
  if (!wallet) return "Connect Wallet";
  if (shouldSwitchNetwork(wallet))
    return `Switch to ${getCurrentNetwork().name}`;
  return "Disconnect";
};

export async function getTokenBalance(
  address: string,
  provider: ethers.providers.Provider
) {
  const balance = await provider.getBalance(address);
  return ethers.utils.formatEther(balance);
}

export function getGameContract(signer: ethers.Signer) {
  if (!KAIA_GAME_ADDRESS) {
    throw new Error("KAIA_GAME_ADDRESS environment variable is not set");
  }

  return new ethers.Contract(KAIA_GAME_ADDRESS, KAIA_GAME_ABI, signer);
}

// Setup game contract from wallet
export const setupGameContract = (wallet: any): ethers.Contract | null => {
  if (!wallet) return null;

  try {
    const provider = new ethers.providers.Web3Provider(wallet.provider);
    const signer = provider.getSigner();
    return getGameContract(signer);
  } catch (error) {
    console.error("Error setting up game contract:", error);
    return null;
  }
};

// Move name conversion utility
export function getMoveName(moveNumber: string): string {
  const moves = ["None", "Rock", "Paper", "Scissors"];
  return moves[parseInt(moveNumber)] || "Unknown";
}

// Generate random salt for game moves
export function generateRandomSalt(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Check if a game was forfeited
export function isGameForfeited(game: any): boolean {
  return (
    game.winner === "2" && // Bot Win
    game.userMove === "0" && // None move
    game.botMove === "0" && // None move
    game.revealBlock !== "0" // Has been revealed/forfeited
  );
}
