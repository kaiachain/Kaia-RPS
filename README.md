# 🎮 Rock, Paper, Scissors on Kaia Blockchain

A decentralized Rock, Paper, Scissors game built on the Kaia blockchain

## ✨ Features

### 🎯 Core Gameplay

- **Classic RPS**: Play Rock, Paper, Scissors against an AI bot
- **Commit-Reveal Scheme**: Secure move submission using cryptographic hashing
- **Winning Incentives**: Set your own participation fee (0.01 - 100 KAIA)
- **Instant Payouts**: Win 2x your participation fee when you beat the bot
- **Forfeit Protection**: Ability to forfeit games if needed

### 🎨 User Experience

- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Wallet Integration**: Seamless Web3Onboard wallet connection
- **Real-time Feedback**: Live game state updates and transaction status
- **Visual Feedback**:
  - Confetti animation for wins (6 seconds)
  - Outcome feedback with move images
  - Prize money display for victories
  - Smooth animations and transitions
- **Game History**: Track your games and view global statistics
- **Mobile Responsive**: Optimized for all screen sizes

### 🔧 Technical Features

- **Smart Contract**: Solidity-based game logic with security features
- **Gas Optimization**: Dynamic gas estimation with fallback mechanisms
- **Error Handling**: Comprehensive error messages and user feedback
- **Performance**: Optimized with React hooks (useMemo, useCallback)
- **Component Architecture**: Modular, reusable components

### 🏦 Contract Management

- **Liquidity Management**: Deposit/withdraw KAIA to control betting capacity
- **Owner Controls**: Secure withdrawal functions for contract owner
- **Real-time Monitoring**: Track contract balance, reserved liquidity, and available funds
- **Automated Scripts**: Easy-to-use CLI tools for contract administration

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask or compatible Web3 wallet
- KAIA testnet tokens for gameplay

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment Setup**

   ```bash
   # Copy environment variables (if needed)
   cp .env.example .env
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎮 How to Play

### 1. Connect Your Wallet

- Click "Connect Wallet" in the navigation bar
- Approve the connection in your wallet

### 2. Set Your Participation Fee

- Enter your participation fee (minimum 0.01 KAIA)
- Use quick buttons (0.01, 0.1, 1, 10) for convenience
- Ensure you have sufficient KAIA balance
- Ensure your participation fee is lower than the contract's balance

### 3. Choose Your Move

- Select Rock, Paper, or Scissors
- Generate a random salt for security
- Click "Commit Move" to submit your encrypted move

### 4. Reveal Your Move

- After the bot commits, reveal your move
- Click "Reveal Move" to complete the game
- View the outcome and collect your winnings!

### 5. Track Your Games

- View your game history in the "My Games" tab
- Check global statistics in the "Global Games" tab
- Monitor ongoing games with visual indicators

### Smart Contract

- **KaiaGame.sol**: Main game contract
- **Functions**:
  - `commitMove(bytes32 hash)`: Submit encrypted move
  - `revealMove(uint8 move, string salt)`: Reveal move and resolve game
  - `forfeitCurrentGame()`: Forfeit active game
  - `getCurrentGame(address player)`: Get player's active game
  - `getLatestGames(uint256 count)`: Get recent global games
  - `getLatestGamesOf(address player, uint256 count)`: Get player's games

## 🎨 UI/UX Features

### Visual Design

- **Color Scheme**: Kaia brand colors with custom accents
- **Typography**: Modern, readable fonts
- **Animations**: Smooth transitions and micro-interactions
- **Custom Scrollbar**: Thin, branded scrollbar design

### Responsive Design

- **Desktop**: Full-featured layout with side-by-side panels
- **Tablet**: Optimized spacing and touch targets
- **Mobile**: Stacked layout with mobile-friendly controls

### Interactive Elements

- **Hover Effects**: Scale and glow effects on interactive elements
- **Loading States**: ClipLoader animations for transactions
- **Feedback Banners**: Success, error, and warning messages
- **Game States**: Visual indicators for ongoing, completed, and forfeited games

## 🔒 Security Features

### Commit-Reveal Scheme

1. **Commit Phase**: Player submits `keccak256(abi.encodePacked(move, salt))`
2. **Reveal Phase**: Player reveals actual move and salt
3. **Verification**: Contract verifies hash matches reveal data

### Smart Contract Security

- **Reentrancy Protection**: Prevents attack vectors
- **Input Validation**: Comprehensive parameter checking
- **State Management**: Proper game state transitions
- **Error Handling**: Graceful failure modes

## 🛠️ Development

### Smart Contract Development

```bash
npx hardhat compile  # Compile contracts
npx hardhat deploy   # Deploy contracts
```

### Contract Management Scripts

```bash
# Deposit KAIA into contract (increase liquidity)
npm run deposit                    # Default: 10 KAIA
npm run deposit 50                # Custom amount: 50 KAIA

# Withdraw KAIA from contract (owner only)
npm run withdraw                   # Withdraw all unreserved liquidity
npm run withdraw:all              # Same as above
npx hardhat run scripts/withdraw.cjs --network kaia 25.5  # Custom amount
```

## 🎯 Game Mechanics

### Winning Conditions

- **Rock beats Scissors**
- **Paper beats Rock**
- **Scissors beats Paper**
- **Draw**: Same moves result in refund

### Payout Structure

- **Win**: 2x participation fee
- **Lose**: 0x (fee goes to contract)
- **Draw**: 1x (full refund)
- **Forfeit**: 0x (fee goes to contract)

### Game Flow

1. **Setup**: Player sets bet and connects wallet
2. **Commit**: Player submits encrypted move
3. **Bot Commit**: AI bot commits its move
4. **Reveal**: Player reveals move and game resolves
5. **Payout**: Winnings distributed automatically

## 🎉 Animations & Feedback

### Outcome Feedback

- **Win**: Green background, confetti (6s), prize display
- **Lose**: Red background, move images shown
- **Draw**: Yellow background, move images shown

### Visual Feedback

- **Page Load**: Fade-in animation for all components
- **Button Interactions**: Hover effects and loading states
- **Game Transitions**: Smooth state changes
- **Mobile Optimizations**: Touch-friendly interactions

## 📱 Mobile Experience

### Responsive Features

- **Touch Targets**: Minimum 44px for all interactive elements
- **Gesture Support**: Swipe-friendly navigation
- **Viewport Optimization**: Proper scaling and spacing
- **Performance**: Optimized for mobile devices

### Mobile-Specific UI

- **Stacked Layout**: Vertical arrangement on small screens
- **Simplified Navigation**: Streamlined mobile menu
- **Touch Feedback**: Visual feedback for touch interactions

## 🔧 Configuration

### Environment Variables

```env
NEXT_PUBLIC_ENV = "TESTNET"
PRIVATE_KEY = your_private_key (only required if you want to deploy the RPS Contract)
KAIA_RPC_URL = rpc_url
CHAIN_ID = chain_id
NEXT_PUBLIC_KAIA_GAME_ADDRESS = deployed_rps_address
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the smart contract code

---

**Built with ❤️ for the Kaia blockchain community**
