import { ethers } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe.only("VotingToken", () => {
  let VotingToken : any;
  let votingToken : any;
  let owner : HardhatEthersSigner;
  let addr1 : HardhatEthersSigner;
  let addr2 : HardhatEthersSigner;

  const tokenName = "ZeroVotingERC20";
  const tokenSymbol = "ZV";

  beforeEach(async () => {
    VotingToken = await ethers.getContractFactory(tokenName);
    [
      owner,
      addr1,
      addr2,
    ] = await ethers.getSigners();

    votingToken = await VotingToken.deploy(tokenName, tokenSymbol, owner);
    await votingToken.waitForDeployment();
  });

  it("Should correctly set name of contract and symbol", async () => {
    expect(
      await votingToken.name()
    ).to.equal(
      tokenName
    );

    expect(
      await votingToken.symbol()
    ).to.equal(
      tokenSymbol
    );
  });

  it("Should let delegate votes and sign them", async () => {
    await votingToken.connect(owner).mint(owner.address, parseInt("101", 18));

    await votingToken.connect(
      owner
    ).delegate(
      owner.address
    );

    const votes = await votingToken.getVotes(owner.address);

    expect(
      votes
    ).to.equal(
      ethers.parseUnits("101", 18)
    );
  });

  it("Should update votes after transfer", async () => {
    await votingToken.connect(owner).delegate(owner.address);

    expect(await votingToken.getVotes(owner.address)).to.equal(ethers.parseUnits("1000000", 18));

    await votingToken.transfer(addr1.address, ethers.parseUnits("500000", 18));

    expect(await votingToken.getVotes(owner.address)).to.equal(ethers.parseUnits("500000", 18));
    expect(await votingToken.getVotes(addr1.address)).to.equal(0);
  });

  it("Should update votes after delegate after transfer", async () => {
    await votingToken.transfer(addr1.address, ethers.parseUnits("500000", 18));

    await votingToken.connect(addr1).delegate(addr1.address);

    expect(await votingToken.getVotes(addr1.address)).to.equal(ethers.parseUnits("500000", 18));
  });
});
