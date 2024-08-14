export const YEAR_IN_SECONDS = 31536000n;
export const INFLATION_RATES_DEFAULT = [0n, 900n, 765n, 650n, 552n, 469n, 398n, 338n, 287n, 243n, 206n, 175n];
export const FINAL_INFLATION_RATE_DEFAULT = 150n;
export const MINTABLE_YEARLY_TOKENS_REF_DEFAULT = [
  0n, // so that index matches year number since deploy
  909090909090000000000000000n,
  772727272726500000000000000n,
  656565656565000000000000000n,
  557575757575200000000000000n,
  473737373736900000000000000n,
  402020202019800000000000000n,
  341414141413800000000000000n,
  289898989898700000000000000n,
  245454545454300000000000000n,
  208080808080600000000000000n,
  176767676767500000000000000n,
];
export const FINAL_MINTABLE_YEARLY_TOKENS_REF_DEFAULT = 151515151515000000000000000n;

export const getYearlyMintableTokens = (yearIndex : number) : bigint =>
  MINTABLE_YEARLY_TOKENS_REF_DEFAULT[yearIndex] !== undefined
    ? MINTABLE_YEARLY_TOKENS_REF_DEFAULT[yearIndex]
    : FINAL_MINTABLE_YEARLY_TOKENS_REF_DEFAULT;

export const getTokensPerPeriod = (yearIndex : number, periodLength : bigint) : bigint => {
  const perYear = getYearlyMintableTokens(yearIndex);

  return periodLength * perYear / YEAR_IN_SECONDS;
};
