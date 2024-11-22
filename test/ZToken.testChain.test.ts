import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ZToken } from "../typechain";
import { parseEther } from "ethers";

describe("ZToken Campaign Tests", async () => {
  let zToken : ZToken;
  let ownerSigner : SignerWithAddress;
  let beneficiarySigner : SignerWithAddress;
  let user1 : SignerWithAddress;

  before(async () => {
    // From HH config. Deployer, mint beneficiary and user
    [
      ownerSigner,
      beneficiarySigner,
      user1,
    ] = await ethers.getSigners();

    const ZeroToken = await ethers.getContractFactory("ZToken");
    // attach address of contract, deployed on zChain
    zToken = await ZeroToken.attach(process.env.DEPLOYED_TOKEN_ADDRESS as string);
  });

  it("Should return the correct token name and symbol", async () => {
    expect(await zToken.name()).to.equal(process.env.Z_TOKEN_NAME);
    expect(await zToken.symbol()).to.equal(process.env.Z_TOKEN_SYMBOL);
  });

  it("Should allow transferring tokens", async () => {
    const balanceBefore = await zToken.connect(ownerSigner).balanceOf(ownerSigner.address);
    const transferAmount = parseEther("20");

    const tx = await zToken.connect(beneficiarySigner).transfer(ownerSigner.address, transferAmount);
    // wait 2 blocks just in case (can fail with 1)
    await tx.wait(2);

    expect(
      await zToken.connect(ownerSigner).balanceOf(ownerSigner.address)
    ).to.equal(
      balanceBefore + transferAmount
    );
  });

  it("Should mint tokens to the beneficiary", async () => {
    const initialBalance = await zToken.balanceOf(beneficiarySigner.address);

    const lastMintTime = await zToken.lastMintTime();

    // check here that lastMintTime was before now
    expect(
      Math.floor(Date.now() / 1000)
    ).to.be.gt(
      lastMintTime
    );

    const tx = await zToken.connect(ownerSigner).mint();
    await tx.wait(2);

    const newBalance = await zToken.balanceOf(beneficiarySigner.address);

    expect(
      newBalance
    ).to.be.gt(
      initialBalance
    );
  });

  it("Should be able to reassign the minter role to another address", async () => {
    const minterRole = await zToken.MINTER_ROLE();

    expect(
      await zToken.hasRole(minterRole, beneficiarySigner.address)
    ).to.be.false;

    const grant = await zToken.connect(ownerSigner).grantRole(minterRole, beneficiarySigner.address);
    // wait 2 blocks just in case (can fail with 1)
    await grant.wait(2);

    // both must be coin holders
    expect(
      await zToken.hasRole(minterRole, ownerSigner.address)
    ).to.be.true;
    expect(
      await zToken.hasRole(minterRole, beneficiarySigner.address)
    ).to.be.true;

    // revoke role from the owner
    const revoke = await zToken.connect(ownerSigner).revokeRole(minterRole, ownerSigner.address);
    await revoke.wait(2);

    expect(
      await zToken.hasRole(minterRole, ownerSigner.address)
    ).to.be.false;

    // give it back
    const grant2 = await zToken.connect(ownerSigner).grantRole(minterRole, ownerSigner.address);
    await grant2.wait(2);

    expect(
      await zToken.hasRole(minterRole, ownerSigner.address)
    ).to.be.true;

    // revoke role from beneficiary
    const revoke2 = await zToken.connect(ownerSigner).revokeRole(minterRole, beneficiarySigner.address);
    await revoke2.wait(2);
  });

  it("Should burn token upon transfer to token address", async () => {
    const beneficiaryBalanceBefore = await zToken.balanceOf(beneficiarySigner.address);
    const tokenSupplyBefore = await zToken.totalSupply();
    const transferAmt = 3n;

    const tx = await zToken.connect(beneficiarySigner).transfer(zToken.target, transferAmt);
    // wait 2 blocks just in case (can fail with 1)
    await tx.wait(2);

    const beneficiaryBalanceAfter = await zToken.balanceOf(beneficiarySigner.address);
    const tokenSupplyAfter = await zToken.totalSupply();

    expect(beneficiaryBalanceBefore - beneficiaryBalanceAfter).to.eq(transferAmt);
    expect(tokenSupplyBefore - tokenSupplyAfter).to.eq(transferAmt);
  });

  it("Should set the new beneficiary address correctly", async () => {
    const newBeneficiary = user1.address;

    const tx = await zToken.connect(ownerSigner).setMintBeneficiary(newBeneficiary);
    await tx.wait(2);

    const mintBeneficiary = await zToken.mintBeneficiary();

    expect(
      mintBeneficiary
    ).to.eq(
      newBeneficiary
    );

    // give the role back to beneficiary
    const tx2 = await zToken.connect(ownerSigner).setMintBeneficiary(beneficiarySigner.address);
    await tx2.wait(2);
  });

  it("Should successfully change admin delay and change to new admin after", async () => {
    const newDelay = 2n;

    const tx1 = await zToken.connect(ownerSigner).changeDefaultAdminDelay(newDelay);
    await tx1.wait(2);

    expect(
      await zToken.defaultAdminDelay()
    ).to.eq(
      newDelay
    );

    const tx2 = await zToken.connect(ownerSigner).beginDefaultAdminTransfer(user1.address);
    await tx2.wait(2);

    const tx3 = await zToken.connect(user1).acceptDefaultAdminTransfer();
    await tx3.wait(2);

    expect(
      await zToken.defaultAdmin()
    ).to.eq(
      user1.address
    );

    // assign back
    const tx4 = await zToken.connect(user1).beginDefaultAdminTransfer(ownerSigner.address);
    await tx4.wait(2);

    const tx5 = await zToken.connect(ownerSigner).acceptDefaultAdminTransfer();
    await tx5.wait(2);
  });

  it("should cancel the admin transfer during the delay period", async () => {
    const tx1 = await zToken.connect(ownerSigner).beginDefaultAdminTransfer(beneficiarySigner.address);
    await tx1.wait(2);

    const tx2 = await zToken.connect(ownerSigner).cancelDefaultAdminTransfer();
    await tx2.wait(2);

    const [ pendingAdmin, schedule ] = await zToken.pendingDefaultAdmin();

    expect(
      pendingAdmin
    ).to.eq(
      ethers.ZeroAddress
    );

    expect(
      schedule
    ).to.eq(
      0n
    );
  });
});
