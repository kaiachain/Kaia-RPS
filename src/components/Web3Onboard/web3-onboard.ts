"use client";
import injectedModule, { ProviderLabel } from "@web3-onboard/injected-wallets";
import { init } from "@web3-onboard/react";
import { getWeb3OnboardChains } from "../../global/utils";

const injected = injectedModule({
  displayUnavailable: [ProviderLabel.MetaMask, ProviderLabel.OKXWallet],
});

export default init({
  theme: "dark",
  wallets: [injected],
  chains: getWeb3OnboardChains(),
  appMetadata: {
    name: "Kaia RPS Tutorial",
    description: "PVE rock-paper-scissors game using Kaia token",
  },
  connect: {
    autoConnectLastWallet: true,
  },
  accountCenter: {
    desktop: {
      enabled: false,
    },
    mobile: {
      enabled: false,
    },
  },
});
