// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title KaiaGame PVE - Rock/Paper/Scissors using native KAIA participation fees
/// @notice Commit–reveal vs. a bot. Auto-pays prize money inside reveal (no separate claim).
/// @dev Slim variant with: totalGames, getCurrentGame, latest 10 global, latest 10 per user.
///      Uses reservation-based liquidity to guarantee 2x prize money coverage.
contract KaiaGame {
    // ----------------------------- Types ----------------------------------

    enum Move { None, Rock, Paper, Scissors }
    enum Winner { Pending, Player, Bot, Draw }

    struct Game {
        // Identity
        uint256 id;                 // global game id
        address player;             // player's wallet

        // Commit state
        bytes32 commitHash;         // keccak256(abi.encodePacked(move, salt))
        uint256 participationFee;   // player's KAIA (wei) paid at commit
        uint256 commitBlock;        // block.number when committed

        // Reveal/results
        Move userMove;              // revealed move (None until reveal)
        Move botMove;               // bot's move
        uint256 prizeMoney;         // wei sent to player in reveal (0 / participationFee / 2*participationFee)
        Winner winner;              // Pending/Player/Bot/Draw
        bool claimed;               // true once game is resolved (win/draw/lose)
        uint256 revealBlock;        // block.number when revealed/forfeited (0 until then)
    }

    /// @notice Compact view for frontends.
    struct GameView {
        uint256 id;
        address player;
        uint256 participationFee;
        uint8 userMove;   // Move as uint8
        uint8 botMove;    // Move as uint8
        uint8 winner;     // Winner as uint8
        uint256 prizeMoney;
        uint256 commitBlock;
        uint256 revealBlock;
    }

    // ---------------------------- Storage ---------------------------------

    address public owner;

    uint256 public nextGameId = 1;                    // next id to assign (starts at 1)
    mapping(uint256 => Game) public gamesById;        // all games by id
    mapping(address => uint256[]) private _gamesOf;    // per-player history (ids)
    mapping(address => uint256) public activeGameOf;   // 0 means none

    /// @notice House liquidity reserved to cover potential 2x prize payouts.
    /// @dev For each commit, reserve participationFee from the house side.
    uint256 public reservedHouseLiquidity;

    // ----------------------------- Events ---------------------------------

    event MoveCommitted(address indexed player, uint256 indexed gameId, uint256 participationFee);
    event MoveRevealed(
        address indexed player,
        uint256 indexed gameId,
        Move userMove,
        Move botMove,
        Winner winner,
        uint256 prizeMoney
    );
    event GameForfeited(address indexed player, uint256 indexed gameId);
    event Deposit(address indexed from, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);

    // --------------------------- Construction -----------------------------

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ----------------------------- Game Flow ------------------------------

    /**
     * @notice Player commits a move by posting the hash and sending native KAIA as the participation fee.
     * @param _commitHash keccak256(abi.encodePacked(move, salt)) where move is 1..3 and salt is bytes32
     *
     * Liquidity logic:
     * - Let B = contract balance *before* this call, R = reservedHouseLiquidity, F = participationFee (msg.value).
     * - To guarantee a future 2x payout (F from player + F from house), require:
     *       B >= R + F
     * - Then reserve F from the house by increasing reservedHouseLiquidity.
     */
    function commitMove(bytes32 _commitHash) external payable {
        require(msg.value > 0, "Participation fee must be > 0");

        // Only one active game per player
        uint256 activeId = activeGameOf[msg.sender];
        require(activeId == 0 || gamesById[activeId].claimed, "Finish previous game");

        // Compute pre-call balance (current balance includes msg.value)
        uint256 balanceBefore = address(this).balance - msg.value;

        // Require house has unreserved liquidity >= this participation fee
        require(balanceBefore >= reservedHouseLiquidity + msg.value, "Insufficient house liquidity");

        // Create new game
        uint256 id = nextGameId++;
        Game storage g = gamesById[id];
        g.id                = id;
        g.player            = msg.sender;
        g.commitHash        = _commitHash;
        g.participationFee  = msg.value;
        g.commitBlock       = block.number;
        g.userMove          = Move.None;
        g.botMove           = Move.None;
        g.prizeMoney        = 0;
        g.winner            = Winner.Pending;
        g.claimed           = false;
        g.revealBlock       = 0;

        // Indexing
        activeGameOf[msg.sender] = id;
        _gamesOf[msg.sender].push(id);

        // Reserve house liquidity equal to participation fee
        reservedHouseLiquidity += msg.value;

        emit MoveCommitted(msg.sender, id, msg.value);
    }

    /**
     * @notice Reveal the move and salt. The bot picks a pseudo-random move (educational only).
     * @dev Prize money is sent immediately (no separate claim).
     * @param _move player's move (1..3)
     * @param _salt 32-byte salt used when committing
     */
    function revealMove(Move _move, bytes32 _salt) external {
        uint256 id = activeGameOf[msg.sender];
        require(id != 0, "No active game");

        Game storage g = gamesById[id];
        require(!g.claimed, "Already finished");
        require(uint256(_move) > 0 && uint256(_move) <= 3, "Invalid move");

        // Verify commit
        bytes32 computedHash = keccak256(abi.encodePacked(_move, _salt));
        require(computedHash == g.commitHash, "Invalid move or salt");

        // Pseudo-random bot move (NOT secure; good for teaching)
        uint256 seed = uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, msg.sender)));
        Move botMove = Move(seed % 3 + 1); // 1..3

        // Determine outcome + prize money
        uint256 prize = 0;
        Winner winner = Winner.Bot;

        if (_move == botMove) {
            prize = g.participationFee;           // draw → refund fee
            winner = Winner.Draw;
        } else if (
            (_move == Move.Rock     && botMove == Move.Scissors) ||
            (_move == Move.Paper    && botMove == Move.Rock)     ||
            (_move == Move.Scissors && botMove == Move.Paper)
        ) {
            prize = g.participationFee * 2;       // player wins → 2x
            winner = Winner.Player;
        }

        // Close the game before external calls
        g.userMove   = _move;
        g.botMove    = botMove;
        g.prizeMoney = prize;
        g.winner     = winner;
        g.claimed    = true;
        g.revealBlock = block.number;
        activeGameOf[msg.sender] = 0;

        // Release the house reservation for this game
        reservedHouseLiquidity -= g.participationFee;

        // Pay prize money if any
        if (prize > 0) {
            require(address(this).balance >= prize, "Contract balance low");
            (bool ok, ) = msg.sender.call{value: prize}("");
            require(ok, "Payout failed");
        }

        emit MoveRevealed(msg.sender, id, _move, botMove, winner, prize);
    }

    /// @notice Player can forfeit their current game (e.g., if they lost the salt).
    /// @dev Ends the game with zero prize and winner = Bot. Frees the player to start a new game.
    function forfeitCurrentGame() external {
        uint256 id = activeGameOf[msg.sender];
        require(id != 0, "No active game");

        Game storage g = gamesById[id];
        require(!g.claimed, "Already finished");

        // Mark as finished with a bot win, no payout
        g.userMove   = Move.None;
        g.botMove    = Move.None;
        g.prizeMoney = 0;
        g.winner     = Winner.Bot;
        g.claimed    = true;
        g.revealBlock = block.number;

        // Clear active pointer and release reserved house liquidity
        activeGameOf[msg.sender] = 0;
        reservedHouseLiquidity -= g.participationFee;

        emit GameForfeited(msg.sender, id);
    }

    // -------------------------- Admin / Funding ---------------------------

    function deposit() external payable onlyOwner {
        require(msg.value > 0, "Zero deposit");
        emit Deposit(msg.sender, msg.value);
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external onlyOwner {
        uint256 unreserved = address(this).balance - reservedHouseLiquidity;
        require(amount <= unreserved, "Exceeds unreserved");
        (bool ok, ) = owner.call{value: amount}("");
        require(ok, "Withdraw failed");
        emit Withdraw(owner, amount);
    }

    function withdrawAllUnreserved() external onlyOwner {
        uint256 unreserved = address(this).balance - reservedHouseLiquidity;
        require(unreserved > 0, "Nothing to withdraw");
        (bool ok, ) = owner.call{value: unreserved}("");
        require(ok, "Withdraw failed");
        emit Withdraw(owner, unreserved);
    }

    // ------------------------------ Views --------------------------------

    function totalGames() external view returns (uint256) {
        return nextGameId - 1;
    }

    function getCurrentGame(address player)
        external
        view
        returns (bool exists, GameView memory v)
    {
        uint256 id = activeGameOf[player];
        if (id == 0) {
            return (false, v); // zero-initialized
        }

        Game storage g = gamesById[id];
        v = GameView({
            id: g.id,
            player: g.player,
            participationFee: g.participationFee,
            userMove: uint8(g.userMove),
            botMove: uint8(g.botMove),
            winner: uint8(g.winner),
            prizeMoney: g.prizeMoney,
            commitBlock: g.commitBlock,
            revealBlock: g.revealBlock
        });
        return (true, v);
    }

    function getLatestGames(uint256 n) external view returns (GameView[] memory out) {
        if (n == 0) return new GameView[](0) ;
        if (n > 30) n = 30;

        uint256 last = nextGameId - 1;
        if (last == 0) return new GameView[](0) ;

        uint256 start = last >= n ? (last - n + 1) : 1;
        uint256 count = last - start + 1;

        out = new GameView[](count);
        uint256 j = 0;
        for (uint256 id = last; id >= start; id--) {
            Game storage g = gamesById[id];
            out[j++] = GameView({
                id: g.id,
                player: g.player,
                participationFee: g.participationFee,
                userMove: uint8(g.userMove),
                botMove: uint8(g.botMove),
                winner: uint8(g.winner),
                prizeMoney: g.prizeMoney,
                commitBlock: g.commitBlock,
                revealBlock: g.revealBlock
            });
            if (id == 1) break;
        }
    }

    function getLatestGamesOf(address player, uint256 n) external view returns (GameView[] memory out) {
        if (n == 0) return new GameView[](0) ;
        if (n > 30) n = 30;

        uint256 len = _gamesOf[player].length;
        if (len == 0) return new GameView[](0);

        uint256 take = len >= n ? n : len;
        out = new GameView[](take);

        uint256 j = 0;
        for (uint256 idx = len; idx > 0 && j < take; idx--) {
            uint256 id = _gamesOf[player][idx - 1];
            Game storage g = gamesById[id];
            out[j++] = GameView({
                id: g.id,
                player: g.player,
                participationFee: g.participationFee,
                userMove: uint8(g.userMove),
                botMove: uint8(g.botMove),
                winner: uint8(g.winner),
                prizeMoney: g.prizeMoney,
                commitBlock: g.commitBlock,
                revealBlock: g.revealBlock
            });
        }
    }
}
