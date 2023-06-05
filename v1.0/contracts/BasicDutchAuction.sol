//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

contract BasicDutchAuction {
    address payable public owner;
    uint256 public reservePrice;
    uint256 public numBlocksAuctionOpen;
    uint256 public offerPriceDecrement;

    uint256 public startBlock;
    uint256 public initialPrice;
    address public winner;

    constructor(
        uint256 _reservePrice,
        uint256 _numBlocksAuctionOpen,
        uint256 _offerPriceDecrement
    ) {
        owner = payable(msg.sender);
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        startBlock = block.number;

        initialPrice = calculateInitialPrice();
    }

    function calculateInitialPrice() internal view returns (uint256) {
        return reservePrice + (numBlocksAuctionOpen * offerPriceDecrement);
    }

    function getCurrentPrice() public view returns (uint256) {
        uint256 blocksElapsed = block.number - startBlock;
        uint256 currentPrice;

        if (blocksElapsed >= numBlocksAuctionOpen) {
            currentPrice = reservePrice;
        } else {
            currentPrice = initialPrice - (blocksElapsed * offerPriceDecrement);
        }

        return currentPrice;
    }

    function bid() external payable returns (address) {
        require(winner == address(0), "Auction has already concluded");
        require(isAuctionOpen(), "Auction expired");
        require(msg.value >= getCurrentPrice(), "The wei value sent is not acceptable");

        winner = msg.sender;
        owner.transfer(msg.value);

        return winner;
    }

    function isAuctionOpen() internal view returns (bool) {
        uint256 blocksElapsed = block.number - startBlock;
        return blocksElapsed <= numBlocksAuctionOpen;
    }
}
