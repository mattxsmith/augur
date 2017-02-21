import { formatNumber, formatPercent, formatRealEtherEstimate, formatEtherEstimate } from '../../../../utils/format-number';
import { formatDate } from '../../../../utils/format-date';
import { abi, augur } from '../../../../services/augurjs';
import { BINARY, CATEGORICAL, SCALAR } from '../../../markets/constants/market-types';
import { EXPIRY_SOURCE_SPECIFIC } from '../../../create-market/constants/market-values-constraints';

import { submitNewMarket } from '../../../create-market/actions/submit-new-market';

export const select = (formState, currentBlockNumber, currentBlockMillisSinceEpoch, periodLength, baseReporters, numEventsCreatedInPast24Hours, numEventsInReportPeriod, dispatch) => {
  const tradingFee = augur.calculateTradingFees(formState.makerFee, formState.takerFee).tradingFee;
  const validityBond = augur.calculateValidityBond(tradingFee, periodLength, baseReporters, numEventsCreatedInPast24Hours, numEventsInReportPeriod);
  const o = { ...formState };
  o.type = formState.type;
  o.endDate = formatDate(formState.endDate);
  o.takerFeePercent = formatPercent(formState.takerFee);
  o.makerFeePercent = formatPercent(formState.makerFee);
  o.volume = formatNumber(0);
  o.expirySource = formState.expirySource === EXPIRY_SOURCE_SPECIFIC ? formState.expirySourceUrl : formState.expirySource;
  o.formattedDescription = o.description;
  o.outcomes = selectOutcomesFromForm(
    formState.type,
    formState.categoricalOutcomes,
    formState.scalarSmallNum,
    formState.scalarBigNum);
  o.isFavorite = false;
  o.eventBond = formatEtherEstimate(validityBond);
  o.gasFees = formatRealEtherEstimate(augur.getTxGasEth({ ...augur.api.functions.CreateMarket.createMarket }, augur.rpc.gasPrice));
  o.marketCreationFee = formatRealEtherEstimate(abi.unfix(augur.calculateRequiredMarketValue(augur.rpc.gasPrice)));
  o.tags = [formState.topic, ...(formState.keywords || [])];

  if (o.isCreatingOrderBook) {
    const formattedFairPrices = [];

    o.initialFairPrices.values.map((cV, i) => {
      formattedFairPrices[i] = formatNumber(cV.value, { decimals: 2, minimized: true, denomination: `ETH | ${cV.label}` });
      return formattedFairPrices;
    });

    o.initialFairPrices = {
      ...o.initialFairPrices,
      formatted: formattedFairPrices
    };

    o.initialLiquidityFormatted = formatNumber(o.initialLiquidity, { denomination: 'ETH' });
    o.bestStartingQuantityFormatted = formatNumber(o.bestStartingQuantity, { denomination: 'Shares' });
    o.startingQuantityFormatted = formatNumber(o.startingQuantity, { denomination: 'Shares' });
    o.priceWidthFormatted = formatNumber(o.priceWidth, { decimals: 2, minimized: true, denomination: 'ETH' });
  }

  o.onSubmit = () => { dispatch(submitNewMarket(o)); };

  return o;
};

export const selectOutcomesFromForm = (
  type,
  categoricalOutcomes,
  scalarSmallNum,
  scalarBigNum) => {
  switch (type) {
    case BINARY:
      return [{ id: 1, name: 'No' }, { id: 2, name: 'Yes' }];
    case CATEGORICAL:
      return categoricalOutcomes.map((outcome, i) => {
        const obj = { id: i, name: outcome };
        return obj;
      });
    case SCALAR:
      return [{ id: 1, name: scalarSmallNum }, { id: 2, name: scalarBigNum }];
    default:
      break;
  }
};
