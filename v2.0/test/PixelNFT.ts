import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

describe("PixelNFT", function () {
  const TOKEN_URI = "https://youtu.be/kXYiU_JCYtU";

  //Fixture for deploying the NFT
  async function deployNFTFixture() {
    const [owner, account1, account2] = await ethers.getSigners();

    const PixelNFT = await ethers.getContractFactory("PixelNFT");

    const pixelNFT = await PixelNFT.deploy();

    return { pixelNFT, owner, account1, account2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { pixelNFT, owner } = await loadFixture(deployNFTFixture);

      expect(await pixelNFT.owner()).to.equal(owner.address);
    });

    it("Should allow owner to mint an NFT and emit minting/transfer event", async function () {
      const { pixelNFT, owner } = await loadFixture(deployNFTFixture);

      await expect(pixelNFT.mintNFT(owner.address, TOKEN_URI))
        .to.emit(pixelNFT, "Transfer")
        .withArgs(ethers.constants.AddressZero, owner.address, 0);
    });

    it("Should not allow non-owner addresses to mint an NFT", async function () {
      const { pixelNFT, owner, account1 } = await loadFixture(
        deployNFTFixture
      );

      await expect(
        pixelNFT.connect(account1).mintNFT(owner.address, TOKEN_URI)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should mint NFT with correct tokenUri", async function () {
      const { pixelNFT, owner } = await loadFixture(deployNFTFixture);

      //Mint the NFT
      await pixelNFT.mintNFT(owner.address, TOKEN_URI);

      expect(await pixelNFT.tokenURI(0)).to.equal(TOKEN_URI);
    });
  });

  describe("Transfers & Approvals", function () {
    it("Should allow owner to transfer the NFT", async function () {
      const { pixelNFT, owner, account1 } = await loadFixture(
        deployNFTFixture
      );

      //Mint the NFT
      await pixelNFT.mintNFT(owner.address, TOKEN_URI);

      await expect(
        pixelNFT.transferFrom(owner.address, account1.address, 0)
      )
        .to.emit(pixelNFT, "Transfer")
        .withArgs(owner.address, account1.address, 0);
    });

    it("Should allow recipient to transfer the NFT after receiving the token", async function () {
      const { pixelNFT, owner, account1, account2 } = await loadFixture(
        deployNFTFixture
      );

      //Mint the NFT
      await pixelNFT.mintNFT(owner.address, TOKEN_URI);

      //Transfer token to account1
      await pixelNFT.transferFrom(owner.address, account1.address, 0);

      await expect(
        pixelNFT
          .connect(account1)
          .transferFrom(account1.address, account2.address, 0)
      )
        .to.emit(pixelNFT, "Transfer")
        .withArgs(account1.address, account2.address, 0);
    });

    it("Should not allow non-token-owning addresses to transfer the NFT unless approved", async function () {
      const { pixelNFT, owner, account1, account2 } = await loadFixture(
        deployNFTFixture
      );

      //Mint the NFT
      await pixelNFT.mintNFT(owner.address, TOKEN_URI);

      //Transfer token to account1
      await pixelNFT.transferFrom(owner.address, account1.address, 0);

      await expect(
        pixelNFT
          .connect(account2)
          .transferFrom(account1.address, account2.address, 0)
      ).to.be.revertedWith("ERC721: caller is not token owner or approved");

      await expect(
        pixelNFT
          .connect(owner)
          .transferFrom(account1.address, account2.address, 0)
      ).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });

    it("Should allow only token-owner addresses to set ERC721 approvals", async function () {
      const { pixelNFT, owner, account1, account2 } = await loadFixture(
        deployNFTFixture
      );

      //Mint the NFT
      await pixelNFT.mintNFT(owner.address, TOKEN_URI);

      //Transfer token to account1
      await pixelNFT.transferFrom(owner.address, account1.address, 0);

      //Reject approval setting from account2
      await expect(
        pixelNFT.connect(account2).approve(account2.address, 0)
      ).to.be.revertedWith(
        "ERC721: approve caller is not token owner or approved for all"
      );

      //Reject approval setting from contract owner
      await expect(
        pixelNFT.connect(owner).approve(account2.address, 0)
      ).to.be.revertedWith(
        "ERC721: approve caller is not token owner or approved for all"
      );

      //Allow token holder to set approval
      //Reject approval setting from account2
      await expect(
        pixelNFT.connect(account1).approve(account2.address, 0)
      )
        .to.emit(pixelNFT, "Approval")
        .withArgs(account1.address, account2.address, 0);
    });

    it("Should allow approved addresses to transfer the NFT", async function () {
      const { pixelNFT, owner, account1, account2 } = await loadFixture(
        deployNFTFixture
      );

      //Mint the NFT
      await pixelNFT.mintNFT(owner.address, TOKEN_URI);

      //Transfer token to account1
      await pixelNFT.transferFrom(owner.address, account1.address, 0);

      //Approve the contract owner to manage account1's transactions
      pixelNFT.connect(account1).approve(owner.address, 0);

      //Still won't allow account2 to transfer as it is not approved
      await expect(
        pixelNFT
          .connect(account2)
          .transferFrom(account1.address, account2.address, 0)
      ).to.be.revertedWith("ERC721: caller is not token owner or approved");

      //Should allow the approved owner address to transfer the token
      await expect(
        pixelNFT
          .connect(owner)
          .transferFrom(account1.address, account2.address, 0)
      )
        .to.emit(pixelNFT, "Transfer")
        .withArgs(account1.address, account2.address, 0);
    });
  });
});
