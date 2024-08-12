/* eslint-disable prefer-arrow/prefer-arrow-functions */
import * as hre from "hardhat";
import { expect } from "chai";
import { MeowToken } from "../typechain";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { percents } from "./helpers/percents";
import { AUTH_ERROR } from "./helpers/errors";
import { TRANSFER } from "./helpers/events";


const YEAR_IN_SECONDS = 31536000n;
let initialTotalSupply : bigint;

// TODO how are these values calculated?
const mintableTokensEachYear = [
  909090909n,
  772727272n,
  656565656n,
  557575757n,
  473737373n,
  402020202n,
  341414141n,
  289898989n,
  245454545n,
  208080808n,
  176767676n,
  151515151n,
];

// TODO how are these values calculated?
const accumulatedMintableTokens = [
  909090909n,
  1681818181n,
  2338383838n,
  2895959595n,
  3369696969n,
  3771717171n,
  4113131313n,
  4403030303n,
  4648484848n,
  4856565656n,
  5033333333n,
  5184848484n,
];

// Inflation rate for each year
const inflationRate = [
  900n,
  765n,
  650n,
  552n,
  469n,
  398n,
  338n,
  287n,
  243n,
  206n,
  175n,
  150n,
];

describe("MeowToken Test", () => {
  let meowToken : MeowToken;
  let admin : SignerWithAddress;
  let beneficiary : SignerWithAddress;
  let dummy : SignerWithAddress;

  let deployTime : bigint;

  before(async () => {
    [admin, beneficiary, dummy] = await hre.ethers.getSigners();

    const MeowTokenFactory = await hre.ethers.getContractFactory("MeowToken");
    meowToken = await MeowTokenFactory.deploy(admin.address, admin.address);
    initialTotalSupply = await meowToken.totalSupply();

    deployTime = await meowToken.deployTime();
  });

  describe.only("Deployment", () => {
    it("Should set the given address as the admin and minter of the contract", async () => {
      expect(await meowToken.hasRole(await meowToken.MINTER_ROLE(), admin.address)).to.be.true;
      expect(await meowToken.hasRole(await meowToken.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
    });

    it("Succeeds when an authorized address calls to mint", async () => {
      const beneficiaryBalBefore = await meowToken.balanceOf(beneficiary.address);

      expect(await meowToken.connect(admin).mint(beneficiary.address)).to.emit(meowToken, TRANSFER);

      const beneficiaryBalAfter = await meowToken.balanceOf(beneficiary.address);

      // Because the `time` helper from HH increments the `block.timestamp` by 1s BEFORE executing the transaction
      // we always calculate the expected amount the same way
      const mintableTokens = await meowToken.calculateMintableTokens(await time.latest() + 1);

      const balDiff = beneficiaryBalAfter - beneficiaryBalBefore;
      expect(balDiff).to.eq(mintableTokens);
    });

    it("Fails when an address that does not have the MINTER_ROLE tries to mint", async () => {
      await expect(meowToken.connect(beneficiary).mint(beneficiary.address)).to.be.revertedWithCustomError(meowToken, AUTH_ERROR);
    });
  });

  describe("Inflation Calculations", () => {
    it("#currentInflationRate()", async () => {

      let newTime;
      let inflationRate = 900n;
      for (let i = 0; i < 20; i++) {
        newTime = deployTime + 31536000n * BigInt(i);

        inflationRate = await meowToken.currentInflationRate(i);
      }

      inflationRate = await meowToken.currentInflationRate(deployTime + 1175n);

      // TODO myself: compare with expected result
    });

    it("Reference formula", async () => {
      for (let k = 0; k < 20; k++) {
        const getTotalSupplyForYear = (year : bigint) => {
          const yearIdx = Number(year);
          let totalSupply = 1000000000n * 10n ** 18n;
          let tokensPerYear = 0n;
          for (let i = 0; i <= yearIdx; i++) {
            const rate = inflationRate[i] || 150n;
            tokensPerYear = totalSupply / 10000n * rate;
            totalSupply = i !== yearIdx ? totalSupply + tokensPerYear : totalSupply;
          }

          return {
            totalSupply,
            tokensPerYear,
          };
        };

        const initialSupply = 1000000000n * 10n ** 18n;
        const startTime = 1722542400n;
        const currentTime = startTime + 31536000n * BigInt(k);
        const timeDiff = currentTime - startTime;

        const yearsPassed = timeDiff / 31536000n;
        const {
          totalSupply,
          tokensPerYear,
        } = getTotalSupplyForYear(yearsPassed);

        const yearStartTime = startTime + yearsPassed * 31536000n;
        const tokensPerPeriod = tokensPerYear * (currentTime - yearStartTime) / 31536000n;
        const mintableTokens = totalSupply - initialSupply + tokensPerPeriod;
        // console.log(
        //   "Years Passed:", yearsPassed.toString(), ", ",
        //   "Inflation Rate (out of 10,000%):", inflationRate[Number(yearsPassed)] || 150n, ", ",
        //   "Mintable Tokens Per Year:", mintableTokens.toString(), ", ",
        //   "Total Supply:", totalSupply.toString()
        // );
      }
    });


    // it("Should revert when passed time earlier than deploytime", async () => {

    // });
  });

  describe("Minting Scenarios", () => {
    let lastMintTime : bigint;
    let totalSupply : bigint;

    let timeOfMint1 : bigint;
    let firstMintAmtRef : bigint;

    it("Should mint proper amount based on seconds if called in the middle of the first year", async () => {
      const deployTime = await meowToken.deployTime();
      totalSupply = await meowToken.totalSupply();

      timeOfMint1 = deployTime + YEAR_IN_SECONDS / 2n - 1n;
      const inflationRate = await meowToken.YEARLY_INFLATION_RATES(1);
      const tokensPerYearRef = totalSupply * inflationRate / 10000n;
      firstMintAmtRef = tokensPerYearRef / 2n;

      await time.increaseTo(timeOfMint1);
      timeOfMint1 += 1n;

      const beneficiaryBalBefore = await meowToken.balanceOf(beneficiary.address);
      await meowToken.connect(admin).mint(beneficiary.address);
      const beneficiaryBalAfter = await meowToken.balanceOf(beneficiary.address);

      const balDiff = beneficiaryBalAfter - beneficiaryBalBefore;
      console.log("Bal Diff: ", balDiff.toString());
      expect(balDiff).to.eq(firstMintAmtRef);

      // check that all state values set properly!
      lastMintTime = await meowToken.lastMintTime();
      totalSupply = await meowToken.totalSupply();

      expect(lastMintTime).to.eq(timeOfMint1);
      expect(totalSupply).to.eq(initialTotalSupply + firstMintAmtRef);
    });

    it("Should mint proper amount at the end of the year based on `lastMintLeftoverTokens`", async () => {
      const deployTime = await meowToken.deployTime();

      const tokensPerYear = initialTotalSupply * 900n / 10000n;
      const tokensPerYear2 = initialTotalSupply * 765n / 10000n;
      const tokensPerYear3 = initialTotalSupply * 650n / 10000n;

      const balanceBefore = await meowToken.balanceOf(beneficiary.address);

      const periodSeconds = 260825n;
      const secondMintTime = deployTime + (YEAR_IN_SECONDS) * 2n + periodSeconds;
      await time.increaseTo(secondMintTime);

      await meowToken.connect(admin).mint(beneficiary.address);

      const balanceAfter = await meowToken.balanceOf(beneficiary.address);
      const balanceDiff = balanceAfter - balanceBefore;

      const periodAmt = tokensPerYear3 * (periodSeconds + 1n) / YEAR_IN_SECONDS;
      const secondMintAmtRef = tokensPerYear * (YEAR_IN_SECONDS / 2n) / 31536000n + tokensPerYear2 + periodAmt;

      expect(balanceDiff).to.eq(secondMintAmtRef);

      lastMintTime = await meowToken.lastMintTime();
      totalSupply = await meowToken.totalSupply();

      expect(lastMintTime).to.eq(secondMintTime + 1n);
      expect(totalSupply).to.eq(initialTotalSupply + firstMintAmtRef + secondMintAmtRef);
    });
  });

  describe("Minting scenarios, where each test has clear contract", () => {
    let meowTokenClear : MeowToken;
    let admin : SignerWithAddress;
    let beneficiary : SignerWithAddress;

    let deployTime : bigint;

    const getTokensAmount = async (year : number) => {
      const localTotalSupply = await meowTokenClear.totalSupply();

      const inflationRate = await meowTokenClear.YEARLY_INFLATION_RATES(year);
      const tokensPerYearRef = localTotalSupply * inflationRate / 10000n;

      return tokensPerYearRef;
    };

    beforeEach(async () => {
      [admin, beneficiary] = await hre.ethers.getSigners();

      const MeowTokenFactory = await hre.ethers.getContractFactory("MeowToken");
      meowTokenClear = await MeowTokenFactory.deploy(admin.address, admin.address);
      initialTotalSupply = await meowTokenClear.totalSupply();

      deployTime = await meowTokenClear.deployTime();
    });

    it("Should return 0 mintable tokens with 0 passed time", async () => {

      deployTime = await meowTokenClear.deployTime();

      // spend 0 seconds
      const firstMintTime = deployTime;

      await expect(
        await meowTokenClear.calculateMintableTokens(firstMintTime)
      ).to.be.equal(
        0n
      );
    });

    it("Should return correct years amount of tokens, increased each year (non-mint)", async () => {

      let currentTime = deployTime;

      for (let year = 0; year < 10; year++) {
        // + year each iteration
        currentTime += 31536000n;

        const tokensFromContract = await meowTokenClear.calculateMintableTokens(currentTime);

        expect(
          tokensFromContract / 10n**18n
        ).to.be.equal(
          accumulatedMintableTokens[year]
        );
      }
    });

    it("Should return correct years amount of tokens, increased each year (mint)", async () => {
      let currentTime = deployTime;

      let timeOfMint = 0n;

      for (let year = 1; year < 13; year++) {
        currentTime += 31536000n;
        timeOfMint = currentTime;

        const tokensFromContract = await meowTokenClear.calculateMintableTokens(currentTime);
        const expectedAmount = await getTokensAmount(year);

        expect(
          tokensFromContract
        ).to.be.equal(
          expectedAmount
        );

        await time.increaseTo(timeOfMint);
        timeOfMint += 1n;

        const beneficiaryBalBefore = await meowTokenClear.balanceOf(beneficiary.address);
        await meowToken.connect(admin).mint(beneficiary.address);
        const beneficiaryBalAfter = await meowTokenClear.balanceOf(beneficiary.address);

        console.log(beneficiaryBalBefore);
        console.log(beneficiaryBalAfter);
      }
    });

    it("Should return correct amount of tokens, increased each 10.512.000 sec (1/3 part of year)", async () => {
      let currentTime = deployTime;

      for (let timeInterval = 0; timeInterval < 14; timeInterval++) {
        currentTime += 10512000n;

        await expect(
          await meowTokenClear.calculateMintableTokens(currentTime) / 10n**18n
        ).to.be.equal(
          mintableTokensEachYear[timeInterval] / 3n
        );
      }
    });

    it("", async () => {
      // TODO myself: deploy, wait some time (31536000 and 31535999), mint, then wait and mint again
    });

    it("", async () => {
      let currentTime = deployTime;

      currentTime += 31536000n;

      await meowTokenClear.connect(admin).mint(beneficiary.address);

      // TODO myself: deploy, wait some years and then mint (like after 2y and some seconds)
    });

    it("", async () => {
      // TODO myself: each second
    });

    it("", async () => {
      // TODO myself: a lot of years. SHould be 1.5% inflation and a lot of tokens
    });

    it("", async () => {
      // TODO myself: 1000000 years
    });
  });
});
