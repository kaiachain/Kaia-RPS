"use client";
import { useEffect, useState } from "react";
import web3Onboard from "./web3-onboard";
import { Web3OnboardProvider } from "@web3-onboard/react";

export default function Web3Onboard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // this forces a rerender
    setHydrated(true);
  }, []);

  if (!hydrated) {
    // this returns null on first render, so the client and server match
    return null;
  }
  return (
    <Web3OnboardProvider web3Onboard={web3Onboard}>
      {children}
    </Web3OnboardProvider>
  );
}
