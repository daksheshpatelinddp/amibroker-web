import { CandleBar, CorporateAction } from '../types/market';

/**
 * Pre-populated Corporate Actions for major NSE stocks demonstrating:
 * - Splits (e.g. Tata Steel 10:1, IRCTC 5:1, Eicher Motors 10:1)
 * - Bonus (e.g. Reliance 1:1, TCS 1:1, Infosys 1:1)
 * - Demerger (e.g. Jio Financial Services demerged from Reliance)
 * - Rights (e.g. Reliance Rights Issue ₹1257)
 * - Symbol changes (e.g. MINDTREE -> LTIM, CADILAHC -> ZYDUSLIFE)
 */
export const DEFAULT_CORPORATE_ACTIONS: CorporateAction[] = [
  {
    id: 'ca-rel-bonus-2024',
    symbol: 'RELIANCE',
    exDate: '2024-10-28',
    actionType: 'BONUS',
    ratio: '1:1',
    factor: 0.5,
    details: 'Bonus 1:1 (1 free share for every 1 share held). Halves prior historical price.',
  },
  {
    id: 'ca-rel-demerger-jfs',
    symbol: 'RELIANCE',
    exDate: '2023-07-20',
    actionType: 'DEMERGER',
    ratio: '1:1',
    factor: 0.905, // Discovered value of Jio Financial Services ₹261.85 vs ₹2840 base
    details: 'Demerger of Jio Financial Services (1 share of JFSL for 1 share of RIL).',
  },
  {
    id: 'ca-rel-rights-2020',
    symbol: 'RELIANCE',
    exDate: '2020-05-14',
    actionType: 'RIGHTS',
    ratio: '1:15',
    factor: 0.985,
    details: 'Rights Issue: 1 share for every 15 held @ ₹1257. Factor 0.985x.',
  },
  {
    id: 'ca-rel-bonus-2017',
    symbol: 'RELIANCE',
    exDate: '2017-09-07',
    actionType: 'BONUS',
    ratio: '1:1',
    factor: 0.5,
    details: 'Bonus 1:1 issue. Historical prices halved.',
  },
  {
    id: 'ca-rel-bonus-2009',
    symbol: 'RELIANCE',
    exDate: '2009-11-26',
    actionType: 'BONUS',
    ratio: '1:1',
    factor: 0.5,
    details: 'Bonus 1:1 issue. Historical prices halved.',
  },
  {
    id: 'ca-tatasteel-split',
    symbol: 'TATASTEEL',
    exDate: '2022-07-28',
    actionType: 'SPLIT',
    ratio: '10:1',
    factor: 0.1, // 1 share of ₹10 FV split into 10 shares of ₹1 FV
    details: 'Sub-division/Stock Split from Face Value ₹10 to ₹1 (10:1). Multiplier 0.1x.',
  },
  {
    id: 'ca-tcs-bonus-2018',
    symbol: 'TCS',
    exDate: '2018-05-31',
    actionType: 'BONUS',
    ratio: '1:1',
    factor: 0.5,
    details: 'Bonus 1:1 issue. Past prices halved, volume doubled.',
  },
  {
    id: 'ca-tcs-bonus-2009',
    symbol: 'TCS',
    exDate: '2009-06-16',
    actionType: 'BONUS',
    ratio: '1:1',
    factor: 0.5,
    details: 'Bonus 1:1 issue. Historical prices halved.',
  },
  {
    id: 'ca-tcs-bonus-2006',
    symbol: 'TCS',
    exDate: '2006-07-28',
    actionType: 'BONUS',
    ratio: '1:1',
    factor: 0.5,
    details: 'Bonus 1:1 issue. Historical prices halved.',
  },
  {
    id: 'ca-infy-bonus-2018',
    symbol: 'INFY',
    exDate: '2018-09-04',
    actionType: 'BONUS',
    ratio: '1:1',
    factor: 0.5,
    details: 'Bonus 1:1 issue. Adjusted factor 0.5x.',
  },
  {
    id: 'ca-infy-bonus-2015',
    symbol: 'INFY',
    exDate: '2015-06-15',
    actionType: 'BONUS',
    ratio: '1:1',
    factor: 0.5,
    details: 'Bonus 1:1 issue. Adjusted factor 0.5x.',
  },
  {
    id: 'ca-infy-bonus-2014',
    symbol: 'INFY',
    exDate: '2014-12-02',
    actionType: 'BONUS',
    ratio: '1:1',
    factor: 0.5,
    details: 'Bonus 1:1 issue. Adjusted factor 0.5x.',
  },
  {
    id: 'ca-infy-bonus-2006',
    symbol: 'INFY',
    exDate: '2006-07-14',
    actionType: 'BONUS',
    ratio: '1:1',
    factor: 0.5,
    details: 'Bonus 1:1 issue. Adjusted factor 0.5x.',
  },
  {
    id: 'ca-hdfc-split-2019',
    symbol: 'HDFCBANK',
    exDate: '2019-09-19',
    actionType: 'SPLIT',
    ratio: '2:1',
    factor: 0.5,
    details: 'Stock split from ₹2 FV to ₹1 FV (2:1). Factor 0.5x.',
  },
  {
    id: 'ca-hdfc-split-2011',
    symbol: 'HDFCBANK',
    exDate: '2011-07-14',
    actionType: 'SPLIT',
    ratio: '5:1',
    factor: 0.2,
    details: 'Stock split from ₹10 FV to ₹2 FV (5:1). Factor 0.2x.',
  },
  {
    id: 'ca-icici-split-2014',
    symbol: 'ICICIBANK',
    exDate: '2014-12-04',
    actionType: 'SPLIT',
    ratio: '5:1',
    factor: 0.2,
    details: 'Stock split from ₹10 FV to ₹2 FV (5:1). Factor 0.2x.',
  },
  {
    id: 'ca-icici-bonus-2017',
    symbol: 'ICICIBANK',
    exDate: '2017-06-20',
    actionType: 'BONUS',
    ratio: '1:10',
    factor: 0.909,
    details: 'Bonus 1:10 issue. Factor 0.909x.',
  },
  {
    id: 'ca-tatamotors-split-2011',
    symbol: 'TATAMOTORS',
    exDate: '2011-09-12',
    actionType: 'SPLIT',
    ratio: '5:1',
    factor: 0.2,
    details: 'Stock split from ₹10 FV to ₹2 FV (5:1). Factor 0.2x.',
  },
  {
    id: 'ca-sbin-split-2014',
    symbol: 'SBIN',
    exDate: '2014-11-20',
    actionType: 'SPLIT',
    ratio: '10:1',
    factor: 0.1,
    details: 'Stock split from ₹10 FV to ₹1 FV (10:1). Factor 0.1x.',
  },
  {
    id: 'ca-lt-bonus-2013',
    symbol: 'LT',
    exDate: '2013-07-11',
    actionType: 'BONUS',
    ratio: '1:2',
    factor: 0.667,
    details: 'Bonus 1:2 issue. Factor 0.667x.',
  },
  {
    id: 'ca-lt-bonus-2008',
    symbol: 'LT',
    exDate: '2008-09-29',
    actionType: 'BONUS',
    ratio: '1:1',
    factor: 0.5,
    details: 'Bonus 1:1 issue. Factor 0.5x.',
  },
  {
    id: 'ca-lt-bonus-2006',
    symbol: 'LT',
    exDate: '2006-09-28',
    actionType: 'BONUS',
    ratio: '1:1',
    factor: 0.5,
    details: 'Bonus 1:1 issue. Factor 0.5x.',
  },
  {
    id: 'ca-itc-bonus-2016',
    symbol: 'ITC',
    exDate: '2016-07-01',
    actionType: 'BONUS',
    ratio: '1:2',
    factor: 0.667,
    details: 'Bonus 1:2 issue. Factor 0.667x.',
  },
  {
    id: 'ca-itc-bonus-2010',
    symbol: 'ITC',
    exDate: '2010-08-03',
    actionType: 'BONUS',
    ratio: '1:2',
    factor: 0.667,
    details: 'Bonus 1:2 issue. Factor 0.667x.',
  },
  {
    id: 'ca-itc-split-2005',
    symbol: 'ITC',
    exDate: '2005-09-21',
    actionType: 'SPLIT',
    ratio: '10:1',
    factor: 0.1,
    details: 'Stock split from ₹10 FV to ₹1 FV (10:1). Factor 0.1x.',
  },
  {
    id: 'ca-itc-bonus-2005',
    symbol: 'ITC',
    exDate: '2005-09-21',
    actionType: 'BONUS',
    ratio: '1:2',
    factor: 0.5,
    details: 'Bonus 1:2 issue. Factor 0.5x.',
  },
  {
    id: 'ca-airtel-rights-2021',
    symbol: 'BHARTIARTL',
    exDate: '2021-10-18',
    actionType: 'RIGHTS',
    ratio: '1:14',
    factor: 0.98,
    details: 'Rights Issue: ₹535 per share. Factor 0.98x.',
  },
  {
    id: 'ca-airtel-split-2009',
    symbol: 'BHARTIARTL',
    exDate: '2009-07-23',
    actionType: 'SPLIT',
    ratio: '2:1',
    factor: 0.5,
    details: 'Stock split from ₹10 FV to ₹5 FV (2:1). Factor 0.5x.',
  },
  {
    id: 'ca-bajfin-split-2016',
    symbol: 'BAJFINANCE',
    exDate: '2016-09-08',
    actionType: 'SPLIT',
    ratio: '2:1',
    factor: 0.5,
    details: 'Stock split from ₹10 FV to ₹2 FV (5:1 / 2:1). Factor 0.5x.',
  },
  {
    id: 'ca-bajfin-bonus-2016',
    symbol: 'BAJFINANCE',
    exDate: '2016-09-08',
    actionType: 'BONUS',
    ratio: '1:1',
    factor: 0.5,
    details: 'Bonus 1:1 issue. Factor 0.5x.',
  },
  {
    id: 'ca-sunpharma-bonus-2013',
    symbol: 'SUNPHARMA',
    exDate: '2013-07-29',
    actionType: 'BONUS',
    ratio: '1:1',
    factor: 0.5,
    details: 'Bonus 1:1 issue. Factor 0.5x.',
  },
  {
    id: 'ca-sunpharma-split-2010',
    symbol: 'SUNPHARMA',
    exDate: '2010-11-29',
    actionType: 'SPLIT',
    ratio: '5:1',
    factor: 0.2,
    details: 'Stock split from ₹5 FV to ₹1 FV (5:1). Factor 0.2x.',
  },
  {
    id: 'ca-axisbank-split-2014',
    symbol: 'AXISBANK',
    exDate: '2014-07-28',
    actionType: 'SPLIT',
    ratio: '5:1',
    factor: 0.2,
    details: 'Stock split from ₹10 FV to ₹2 FV (5:1). Factor 0.2x.',
  },
  {
    id: 'ca-kotak-bonus-2015',
    symbol: 'KOTAKBANK',
    exDate: '2015-07-08',
    actionType: 'BONUS',
    ratio: '1:1',
    factor: 0.5,
    details: 'Bonus 1:1 issue. Factor 0.5x.',
  },
  {
    id: 'ca-kotak-split-2010',
    symbol: 'KOTAKBANK',
    exDate: '2010-09-13',
    actionType: 'SPLIT',
    ratio: '2:1',
    factor: 0.5,
    details: 'Stock split from ₹10 FV to ₹5 FV (2:1). Factor 0.5x.',
  },
  {
    id: 'ca-titan-split-2011',
    symbol: 'TITAN',
    exDate: '2011-06-23',
    actionType: 'SPLIT',
    ratio: '10:1',
    factor: 0.1,
    details: 'Stock split from ₹10 FV to ₹1 FV (10:1). Factor 0.1x.',
  },
  {
    id: 'ca-titan-bonus-2011',
    symbol: 'TITAN',
    exDate: '2011-06-23',
    actionType: 'BONUS',
    ratio: '1:1',
    factor: 0.5,
    details: 'Bonus 1:1 issue. Factor 0.5x.',
  },
  {
    id: 'ca-adanient-split-2009',
    symbol: 'ADANIENT',
    exDate: '2009-09-17',
    actionType: 'SPLIT',
    ratio: '10:1',
    factor: 0.1,
    details: 'Stock split from ₹10 FV to ₹1 FV (10:1). Factor 0.1x.',
  },
  {
    id: 'ca-ntpc-bonus-2019',
    symbol: 'NTPC',
    exDate: '2019-03-18',
    actionType: 'BONUS',
    ratio: '1:5',
    factor: 0.8,
    details: 'Bonus 1:5 issue. Factor 0.8x.',
  },
  {
    id: 'ca-mm-bonus-2017',
    symbol: 'M&M',
    exDate: '2017-12-21',
    actionType: 'BONUS',
    ratio: '1:1',
    factor: 0.5,
    details: 'Bonus 1:1 issue. Factor 0.5x.',
  },
  {
    id: 'ca-mm-split-2010',
    symbol: 'M&M',
    exDate: '2010-06-03',
    actionType: 'SPLIT',
    ratio: '2:1',
    factor: 0.5,
    details: 'Stock split from ₹10 FV to ₹5 FV (2:1). Factor 0.5x.',
  },
  {
    id: 'ca-trent-split-2016',
    symbol: 'TRENT',
    exDate: '2016-09-12',
    actionType: 'SPLIT',
    ratio: '10:1',
    factor: 0.1,
    details: 'Stock split from ₹10 FV to ₹1 FV (10:1). Factor 0.1x.',
  },
  {
    id: 'ca-sym-ltim',
    symbol: 'LTIM',
    exDate: '2022-11-24',
    actionType: 'SYMBOL_CHANGE',
    factor: 1.0,
    oldSymbol: 'LTI',
    newSymbol: 'LTIM',
    details: 'Amalgamation of Mindtree into LTI; Symbol changed to LTIMindtree (LTIM).',
  },
  {
    id: 'ca-sym-zydus',
    symbol: 'ZYDUSLIFE',
    exDate: '2022-03-07',
    actionType: 'SYMBOL_CHANGE',
    factor: 1.0,
    oldSymbol: 'CADILAHC',
    newSymbol: 'ZYDUSLIFE',
    details: 'Company Name & Symbol changed from Cadila Healthcare to Zydus Lifesciences.',
  },
];

/**
 * Symbol alias dictionary to seamlessly handle historical symbol changes
 */
export const SYMBOL_ALIASES: Record<string, string[]> = {
  LTIM: ['LTI', 'MINDTREE', 'LTIMINDTREE'],
  ZYDUSLIFE: ['CADILAHC', 'CADILA'],
  MOTHERSON: ['MOTHERSUMI'],
  TATAMOTORS: ['TATAMTRDVR', 'TELCO'],
  JSWINFRA: ['JSW'],
};

/**
 * Resolve any previous or alternative symbol alias to the canonical ticker
 */
export function resolveCanonicalSymbol(input: string): string {
  const clean = input.trim().toUpperCase();
  for (const [canonical, aliases] of Object.entries(SYMBOL_ALIASES)) {
    if (canonical === clean || aliases.includes(clean)) {
      return canonical;
    }
  }
  return clean;
}

/**
 * Calculate Theoretical Ex-Rights Price (TERP) and adjustment factor
 */
export function calculateRightsAdjustmentFactor(
  cumRightsPrice: number,
  existingShares: number,
  rightsShares: number,
  rightsIssuePrice: number
): { terp: number; factor: number } {
  const totalValue = existingShares * cumRightsPrice + rightsShares * rightsIssuePrice;
  const totalShares = existingShares + rightsShares;
  const terp = totalValue / totalShares;
  const factor = terp / cumRightsPrice;
  return { terp, factor };
}

/**
 * Applies corporate action adjustments backwards in time from newest to oldest.
 * If raw is chosen, returns original unadjusted bars.
 */
export function adjustCandleHistory(
  candles: CandleBar[],
  actions: CorporateAction[],
  symbol: string,
  applyAdjustments: boolean = true
): CandleBar[] {
  if (!applyAdjustments || actions.length === 0) {
    return candles.map(c => ({ ...c, isAdjusted: false }));
  }

  // If candles are already corporate-adjusted from Parquet dataset, preserve them
  if (candles.length > 0 && candles[0].isAdjusted) {
    return candles;
  }

  // Filter actions applicable to this symbol, sorted descending by exDate
  const relevantActions = actions
    .filter(a => a.symbol === symbol && a.actionType !== 'SYMBOL_CHANGE')
    .sort((a, b) => new Date(b.exDate).getTime() - new Date(a.exDate).getTime());

  if (relevantActions.length === 0) {
    return candles.map(c => ({ ...c, isAdjusted: false }));
  }

  // Create deep copy of candles sorted chronologically
  const result: CandleBar[] = candles.map(c => ({ ...c }));

  // Each corporate action multiplies all candles strictly BEFORE exDate by its factor
  for (const action of relevantActions) {
    const exDateStr = action.exDate.trim();
    const factor = action.factor;

    for (let i = 0; i < result.length; i++) {
      // Use pure ISO date string comparison (YYYY-MM-DD) to prevent timezone & timestamp discrepancies
      const barDateStr = result[i].date.split(' ')[0].trim();
      if (barDateStr < exDateStr) {
        result[i].open = Number((result[i].open * factor).toFixed(2));
        result[i].high = Number((result[i].high * factor).toFixed(2));
        result[i].low = Number((result[i].low * factor).toFixed(2));
        result[i].close = Number((result[i].close * factor).toFixed(2));
        // Volume is inversely adjusted so that traded value remains identical
        result[i].volume = Math.round(result[i].volume / factor);
        if (result[i].deliveryQty) {
          result[i].deliveryQty = Math.round((result[i].deliveryQty as number) / factor);
        }
        result[i].isAdjusted = true;
      }
    }
  }

  return result;
}
