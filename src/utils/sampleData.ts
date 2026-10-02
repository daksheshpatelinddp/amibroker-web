import { CandleBar, StockMetadata } from '../types/market';

export const STOCK_UNIVERSE: StockMetadata[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Energy', industry: 'Integrated Oil, Gas & Telecom', marketCapCr: 1980000, isFnO: true, isFavorite: true },
  { symbol: 'TCS', name: 'Tata Consultancy Services', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Information Technology', industry: 'IT Services & Consulting', marketCapCr: 1520000, isFnO: true, isFavorite: true },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Financial Services', industry: 'Private Sector Banking', marketCapCr: 1310000, isFnO: true, isFavorite: true },
  { symbol: 'INFY', name: 'Infosys Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Information Technology', industry: 'IT Services & Consulting', marketCapCr: 780000, isFnO: true, isFavorite: false },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Financial Services', industry: 'Private Sector Banking', marketCapCr: 890000, isFnO: true, isFavorite: false },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Telecommunication', industry: 'Telecom Services', marketCapCr: 940000, isFnO: true, isFavorite: true },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Automobile', industry: 'Commercial Vehicles & EVs', marketCapCr: 360000, isFnO: true, isFavorite: true },
  { symbol: 'TATASTEEL', name: 'Tata Steel Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Metals & Mining', industry: 'Steel & Ferro Alloys', marketCapCr: 195000, isFnO: true, isFavorite: false },
  { symbol: 'SBIN', name: 'State Bank of India', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Financial Services', industry: 'Public Sector Banking', marketCapCr: 710000, isFnO: true, isFavorite: false },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Capital Goods', industry: 'EPC Infrastructure & Defense', marketCapCr: 490000, isFnO: true, isFavorite: true },
  { symbol: 'ITC', name: 'ITC Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'FMCG', industry: 'Diversified FMCG & Cigarettes', marketCapCr: 610000, isFnO: true, isFavorite: false },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', market: 'NSE_FNO', group: 'Nifty 50', sector: 'FMCG', industry: 'Household & Personal Products', marketCapCr: 680000, isFnO: true, isFavorite: false },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Financial Services', industry: 'NBFC & Consumer Lending', marketCapCr: 440000, isFnO: true, isFavorite: true },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Automobile', industry: 'Passenger Cars & Utility Vehicles', marketCapCr: 390000, isFnO: true, isFavorite: false },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Ind', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Healthcare', industry: 'Pharmaceuticals & Generics', marketCapCr: 410000, isFnO: true, isFavorite: false },
  { symbol: 'AXISBANK', name: 'Axis Bank Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Financial Services', industry: 'Private Sector Banking', marketCapCr: 360000, isFnO: true, isFavorite: false },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Financial Services', industry: 'Private Sector Banking', marketCapCr: 350000, isFnO: true, isFavorite: false },
  { symbol: 'TITAN', name: 'Titan Company Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Consumer Durables', industry: 'Jewellery & Watches', marketCapCr: 320000, isFnO: true, isFavorite: true },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Metals & Mining', industry: 'Trading & Conglomerate', marketCapCr: 340000, isFnO: true, isFavorite: false },
  { symbol: 'NTPC', name: 'NTPC Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Power', industry: 'Thermal & Renewable Power', marketCapCr: 390000, isFnO: true, isFavorite: false },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Automobile', industry: 'SUVs & Farm Tractors', marketCapCr: 370000, isFnO: true, isFavorite: true },
  { symbol: 'TRENT', name: 'Trent Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Consumer Services', industry: 'Apparel & Fast Fashion Retail', marketCapCr: 260000, isFnO: true, isFavorite: true },
  { symbol: 'LTIM', name: 'LTIMindtree Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Information Technology', industry: 'IT Solutions & Cloud Services', marketCapCr: 165000, isFnO: true, isFavorite: false },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation of India', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Power', industry: 'Power Transmission', marketCapCr: 310000, isFnO: true, isFavorite: false },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Energy', industry: 'Oil Exploration & Production', marketCapCr: 360000, isFnO: true, isFavorite: false },
  { symbol: 'COALINDIA', name: 'Coal India Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Metals & Mining', industry: 'Coal Mining', marketCapCr: 305000, isFnO: true, isFavorite: false },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corp Ltd', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Energy', industry: 'Oil Refining & Marketing', marketCapCr: 145000, isFnO: true, isFavorite: false },
  { symbol: 'IOC', name: 'Indian Oil Corporation', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Energy', industry: 'Refineries', marketCapCr: 240000, isFnO: true, isFavorite: false },
  { symbol: 'GAIL', name: 'GAIL (India) Limited', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Energy', industry: 'Gas Transmission & Distribution', marketCapCr: 150000, isFnO: true, isFavorite: false },
  { symbol: 'BEL', name: 'Bharat Electronics Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Capital Goods', industry: 'Defense Electronics & Avionics', marketCapCr: 220000, isFnO: true, isFavorite: true },
  { symbol: 'HAL', name: 'Hindustan Aeronautics Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Capital Goods', industry: 'Aerospace & Defense', marketCapCr: 310000, isFnO: true, isFavorite: true },
  { symbol: 'BHEL', name: 'Bharat Heavy Electricals Ltd', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Capital Goods', industry: 'Heavy Electrical Equipment', marketCapCr: 98000, isFnO: true, isFavorite: false },
  { symbol: 'SUZLON', name: 'Suzlon Energy Limited', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Capital Goods', industry: 'Wind Turbines & Renewable Power', marketCapCr: 110000, isFnO: true, isFavorite: true },
  { symbol: 'ZOMATO', name: 'Zomato Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Consumer Services', industry: 'Food Delivery & Quick Commerce', marketCapCr: 245000, isFnO: true, isFavorite: true },
  { symbol: 'JIOFIN', name: 'Jio Financial Services Ltd', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Financial Services', industry: 'Non-Banking Financial & Fintech', marketCapCr: 215000, isFnO: true, isFavorite: true },
  { symbol: 'IRCTC', name: 'Indian Railway Catering & Tourism', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Consumer Services', industry: 'Railways & Hospitality', marketCapCr: 75000, isFnO: true, isFavorite: false },
  { symbol: 'TATACHEM', name: 'Tata Chemicals Limited', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Chemicals', industry: 'Basic & Specialty Chemicals', marketCapCr: 28000, isFnO: true, isFavorite: false },
  { symbol: 'TATAPOWER', name: 'Tata Power Company Limited', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Power', industry: 'Electric Utilities & Solar', marketCapCr: 140000, isFnO: true, isFavorite: true },
  { symbol: 'VEDL', name: 'Vedanta Limited', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Metals & Mining', industry: 'Diversified Metals & Natural Resources', marketCapCr: 190000, isFnO: true, isFavorite: true },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Metals & Mining', industry: 'Aluminium & Copper', marketCapCr: 155000, isFnO: true, isFavorite: false },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Metals & Mining', industry: 'Steel & Ferro Alloys', marketCapCr: 235000, isFnO: true, isFavorite: false },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Consumer Durables', industry: 'Paints & Decor', marketCapCr: 295000, isFnO: true, isFavorite: false },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Construction Materials', industry: 'Cement & Building Products', marketCapCr: 330000, isFnO: true, isFavorite: false },
  { symbol: 'GRASIM', name: 'Grasim Industries Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Construction Materials', industry: 'Viscose & Cement', marketCapCr: 175000, isFnO: true, isFavorite: false },
  { symbol: 'CIPLA', name: 'Cipla Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Healthcare', industry: 'Pharmaceuticals & Generics', marketCapCr: 130000, isFnO: true, isFavorite: false },
  { symbol: 'DRREDDY', name: "Dr. Reddy's Laboratories", market: 'NSE_FNO', group: 'Nifty 50', sector: 'Healthcare', industry: 'Pharmaceuticals & Formulations', marketCapCr: 110000, isFnO: true, isFavorite: false },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Healthcare', industry: 'Hospitals & Healthcare Services', marketCapCr: 102000, isFnO: true, isFavorite: false },
  { symbol: 'DIVISLAB', name: "Divi's Laboratories Limited", market: 'NSE_FNO', group: 'Nifty 50', sector: 'Healthcare', industry: 'Active Pharmaceutical Ingredients', marketCapCr: 145000, isFnO: true, isFavorite: false },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Automobile', industry: 'Motorcycles (Royal Enfield)', marketCapCr: 135000, isFnO: true, isFavorite: false },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Automobile', industry: 'Two-Wheelers & Scooters', marketCapCr: 108000, isFnO: true, isFavorite: false },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Automobile', industry: 'Two & Three Wheelers', marketCapCr: 275000, isFnO: true, isFavorite: false },
  { symbol: 'NESTLEIND', name: 'Nestle India Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'FMCG', industry: 'Packaged Foods & Beverages', marketCapCr: 240000, isFnO: true, isFavorite: false },
  { symbol: 'BRITANNIA', name: 'Britannia Industries Ltd', market: 'NSE_FNO', group: 'Nifty 50', sector: 'FMCG', industry: 'Biscuits, Bakery & Dairy', marketCapCr: 140000, isFnO: true, isFavorite: false },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Financial Services', industry: 'Private Sector Banking', marketCapCr: 112000, isFnO: true, isFavorite: false },
  { symbol: 'TECHM', name: 'Tech Mahindra Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Information Technology', industry: 'IT Telecom & Digital Services', marketCapCr: 160000, isFnO: true, isFavorite: false },
  { symbol: 'WIPRO', name: 'Wipro Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Information Technology', industry: 'IT Services & Consulting', marketCapCr: 290000, isFnO: true, isFavorite: false },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Co', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Financial Services', industry: 'Life Insurance', marketCapCr: 155000, isFnO: true, isFavorite: false },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Company', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Financial Services', industry: 'Life Insurance', marketCapCr: 180000, isFnO: true, isFavorite: false },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Financial Services', industry: 'Financial Holding & Insurance', marketCapCr: 300000, isFnO: true, isFavorite: false },
  { symbol: 'ADANIPORTS', name: 'Adani Ports and SEZ Ltd', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Services', industry: 'Ports & Logistics Infrastructure', marketCapCr: 310000, isFnO: true, isFavorite: false },
  { symbol: 'DLF', name: 'DLF Limited', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Realty', industry: 'Real Estate Development & Commercial', marketCapCr: 215000, isFnO: true, isFavorite: true },
  { symbol: 'CANBK', name: 'Canara Bank', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Financial Services', industry: 'Public Sector Banking', marketCapCr: 95000, isFnO: true, isFavorite: false },
  { symbol: 'PNB', name: 'Punjab National Bank', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Financial Services', industry: 'Public Sector Banking', marketCapCr: 115000, isFnO: true, isFavorite: false },
  { symbol: 'YESBANK', name: 'Yes Bank Limited', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Financial Services', industry: 'Private Sector Banking', marketCapCr: 65000, isFnO: true, isFavorite: true },
  { symbol: 'SWIGGY', name: 'Swiggy Limited', market: 'NSE_EQ', group: 'New Listings & IPOs', sector: 'Consumer Services', industry: 'Food Delivery & Hyperlocal', marketCapCr: 112000, isFnO: false, isFavorite: true },
  { symbol: 'IREDA', name: 'Indian Renewable Energy Dev Agency', market: 'NSE_EQ', group: 'Nifty Midcap 150', sector: 'Financial Services', industry: 'Renewable Energy Financing', marketCapCr: 62000, isFnO: false, isFavorite: true },
  { symbol: 'TATATECH', name: 'Tata Technologies Limited', market: 'NSE_EQ', group: 'Nifty Midcap 150', sector: 'Information Technology', industry: 'Engineering R&D Services', marketCapCr: 41000, isFnO: false, isFavorite: false },
  { symbol: 'KALYANKJIL', name: 'Kalyan Jewellers India Ltd', market: 'NSE_EQ', group: 'Nifty Midcap 150', sector: 'Consumer Durables', industry: 'Gems & Jewellery', marketCapCr: 72000, isFnO: false, isFavorite: true },
  { symbol: 'POLICYBZR', name: 'PB Fintech Limited (PolicyBazaar)', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Financial Services', industry: 'FinTech & Insurance Marketplace', marketCapCr: 84000, isFnO: true, isFavorite: false },
  { symbol: 'PAYTM', name: 'One97 Communications Limited', market: 'NSE_EQ', group: 'Nifty 100', sector: 'Financial Services', industry: 'Digital Payments & Financial Services', marketCapCr: 55000, isFnO: false, isFavorite: false },
  { symbol: 'CDSL', name: 'Central Depository Services Ltd', market: 'NSE_EQ', group: 'Nifty Midcap 150', sector: 'Financial Services', industry: 'Capital Market Infrastructure', marketCapCr: 33000, isFnO: false, isFavorite: true },
  { symbol: 'BSE', name: 'BSE Limited', market: 'NSE_EQ', group: 'Nifty Midcap 150', sector: 'Financial Services', industry: 'Stock Exchanges', marketCapCr: 68000, isFnO: false, isFavorite: true },
  { symbol: 'ANGELONE', name: 'Angel One Limited', market: 'NSE_EQ', group: 'Nifty Midcap 150', sector: 'Financial Services', industry: 'Retail Stock Broking & Wealth', marketCapCr: 28000, isFnO: false, isFavorite: false },
  { symbol: 'MOTHERSON', name: 'Samvardhana Motherson International', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Automobile', industry: 'Auto Ancillaries & Wiring Systems', marketCapCr: 125000, isFnO: true, isFavorite: false },
  { symbol: 'DIXON', name: 'Dixon Technologies Limited', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Consumer Durables', industry: 'Electronics Manufacturing Services (EMS)', marketCapCr: 88000, isFnO: true, isFavorite: true },
  { symbol: 'POLYCAB', name: 'Polycab India Limited', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Capital Goods', industry: 'Cables, Wires & Fast Moving Electrical', marketCapCr: 104000, isFnO: true, isFavorite: false },
  { symbol: 'PERSISTENT', name: 'Persistent Systems Limited', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Information Technology', industry: 'Digital Engineering & Cloud Services', marketCapCr: 82000, isFnO: true, isFavorite: false },
  { symbol: 'COFORGE', name: 'Coforge Limited', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Information Technology', industry: 'IT Services & Digital Solutions', marketCapCr: 51000, isFnO: true, isFavorite: false },
  { symbol: 'TVSMOTOR', name: 'TVS Motor Company Limited', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Automobile', industry: 'Two & Three Wheelers', marketCapCr: 128000, isFnO: true, isFavorite: false },
  { symbol: 'CHOLAFIN', name: 'Cholamandalam Investment & Finance', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Financial Services', industry: 'Vehicle Financing & NBFC', marketCapCr: 114000, isFnO: true, isFavorite: false },
  { symbol: 'AUROPHARMA', name: 'Aurobindo Pharma Limited', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Healthcare', industry: 'Pharmaceuticals & Active Ingredients', marketCapCr: 78000, isFnO: true, isFavorite: false },
  { symbol: 'MAXHEALTH', name: 'Max Healthcare Institute Ltd', market: 'NSE_FNO', group: 'Nifty 100', sector: 'Healthcare', industry: 'Hospitals & Medical Care', marketCapCr: 94000, isFnO: true, isFavorite: false },
  { symbol: 'MANKIND', name: 'Mankind Pharma Limited', market: 'NSE_EQ', group: 'Nifty 100', sector: 'Healthcare', industry: 'Formulations & Consumer Healthcare', marketCapCr: 106000, isFnO: false, isFavorite: false },
  { symbol: 'RVNL', name: 'Rail Vikas Nigam Limited', market: 'NSE_FNO', group: 'Nifty Midcap 150', sector: 'Capital Goods', industry: 'Railway Infrastructure & Construction', marketCapCr: 92000, isFnO: true, isFavorite: true },
  { symbol: 'IRFC', name: 'Indian Railway Finance Corporation', market: 'NSE_EQ', group: 'Nifty 100', sector: 'Financial Services', industry: 'Railway Rolling Stock Financing', marketCapCr: 210000, isFnO: false, isFavorite: true },
  { symbol: 'MAZDOCK', name: 'Mazagon Dock Shipbuilders Ltd', market: 'NSE_EQ', group: 'Nifty Midcap 150', sector: 'Capital Goods', industry: 'Defense Warships & Submarines', marketCapCr: 88000, isFnO: false, isFavorite: true },
  { symbol: 'COCHINSHIP', name: 'Cochin Shipyard Limited', market: 'NSE_EQ', group: 'Nifty Midcap 150', sector: 'Capital Goods', industry: 'Shipbuilding & Marine Engineering', marketCapCr: 42000, isFnO: false, isFavorite: false },
  { symbol: 'NHPC', name: 'NHPC Limited', market: 'NSE_EQ', group: 'Nifty Midcap 150', sector: 'Power', industry: 'Hydroelectric Power Generation', marketCapCr: 90000, isFnO: false, isFavorite: false },
  { symbol: 'SJVN', name: 'SJVN Limited', market: 'NSE_EQ', group: 'Nifty Midcap 150', sector: 'Power', industry: 'Hydro & Solar Renewable Power', marketCapCr: 45000, isFnO: false, isFavorite: false },
  { symbol: 'HUDCO', name: 'Housing & Urban Development Corp', market: 'NSE_EQ', group: 'Nifty Midcap 150', sector: 'Financial Services', industry: 'Urban Infrastructure Financing', marketCapCr: 48000, isFnO: false, isFavorite: false },
  { symbol: 'NBCC', name: 'NBCC (India) Limited', market: 'NSE_EQ', group: 'Nifty Smallcap 250', sector: 'Construction Materials', industry: 'Project Management & Redevelopment', marketCapCr: 24000, isFnO: false, isFavorite: false },
  { symbol: 'PREMIERENE', name: 'Premier Energies Limited', market: 'NSE_EQ', group: 'New Listings & IPOs', sector: 'Power', industry: 'Solar Cell & Module Manufacturing', marketCapCr: 52000, isFnO: false, isFavorite: true },
];

/**
 * Generate deterministic, realistic multi-year historical candles (250+ trading days)
 * incorporating real market patterns: trends, pullbacks, volatility, and corporate action events.
 */
export function generateRealisticNseHistory(
  symbol: string,
  basePrice: number,
  volatility: number,
  trendFactor: number,
  corporateEvent?: { date: string; type: 'SPLIT' | 'BONUS' | 'DEMERGER'; factor: number }
): CandleBar[] {
  const bars: CandleBar[] = [];
  const days = 300; // ~1.2 years of trading days
  let currentClose = basePrice;

  // Start roughly 300 trading days prior
  const startDate = new Date('2023-08-01');

  // Pseudo-random deterministic generator based on symbol string
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) {
    seed = (seed * 31 + symbol.charCodeAt(i)) & 0xffffffff;
  }
  const pseudoRandom = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return (seed >>> 0) / 4294967296;
  };

  let currentDate = new Date(startDate);

  for (let i = 0; i < days; i++) {
    // Skip weekends
    while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    const dateStr = currentDate.toISOString().split('T')[0];

    // Check if we passed the unadjusted corporate event (simulate raw unadjusted jump)
    if (corporateEvent && dateStr === corporateEvent.date) {
      // In raw unadjusted data, on the ex-date the price suddenly drops according to the event!
      currentClose = currentClose * corporateEvent.factor;
    }

    const shock = (pseudoRandom() - 0.485) * volatility * currentClose + trendFactor * (currentClose * 0.0008);
    const prevClose = currentClose;
    currentClose = Math.max(10, currentClose + shock);

    const openNoise = (pseudoRandom() - 0.5) * 0.008 * currentClose;
    const open = Number((prevClose + openNoise).toFixed(2));
    const high = Number((Math.max(open, currentClose) + pseudoRandom() * 0.015 * currentClose).toFixed(2));
    const low = Number((Math.min(open, currentClose) - pseudoRandom() * 0.015 * currentClose).toFixed(2));
    const close = Number(currentClose.toFixed(2));

    // Volume & Delivery
    const baseVolume = 1500000 + Math.floor(pseudoRandom() * 3000000);
    // Institutional delivery percentage: typically between 35% and 72% on NSE cash
    const deliveryPct = Number((38 + pseudoRandom() * 34).toFixed(2));
    const deliveryQty = Math.round(baseVolume * (deliveryPct / 100));

    bars.push({
      date: dateStr,
      open,
      high,
      low,
      close,
      volume: baseVolume,
      deliveryQty,
      deliveryPct,
      turnover: Math.round((baseVolume * close) / 100000), // Lakhs
      trades: Math.floor(baseVolume / 45),
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return bars;
}

// Generate base unadjusted raw historical datasets for all symbols in STOCK_UNIVERSE
export const INITIAL_MARKET_DATA: Record<string, CandleBar[]> = (() => {
  const baseMap: Record<string, CandleBar[]> = {
    RELIANCE: generateRealisticNseHistory('RELIANCE', 2450, 0.018, 0.35, {
      date: '2024-10-28',
      type: 'BONUS',
      factor: 0.5,
    }),
    TCS: generateRealisticNseHistory('TCS', 3400, 0.016, 0.25),
    HDFCBANK: generateRealisticNseHistory('HDFCBANK', 1580, 0.017, 0.15),
    INFY: generateRealisticNseHistory('INFY', 1420, 0.02, 0.3),
    ICICIBANK: generateRealisticNseHistory('ICICIBANK', 980, 0.016, 0.45),
    BHARTIARTL: generateRealisticNseHistory('BHARTIARTL', 1150, 0.017, 0.45),
    TATAMOTORS: generateRealisticNseHistory('TATAMOTORS', 610, 0.024, 0.6),
    TATASTEEL: generateRealisticNseHistory('TATASTEEL', 118, 0.022, 0.2), // post split level
    SBIN: generateRealisticNseHistory('SBIN', 570, 0.019, 0.4),
    LT: generateRealisticNseHistory('LT', 2700, 0.018, 0.5),
    ITC: generateRealisticNseHistory('ITC', 440, 0.014, 0.2),
    HINDUNILVR: generateRealisticNseHistory('HINDUNILVR', 2350, 0.013, 0.12),
    BAJFINANCE: generateRealisticNseHistory('BAJFINANCE', 6800, 0.021, 0.35),
    MARUTI: generateRealisticNseHistory('MARUTI', 11200, 0.018, 0.3),
    SUNPHARMA: generateRealisticNseHistory('SUNPHARMA', 1450, 0.016, 0.4),
    AXISBANK: generateRealisticNseHistory('AXISBANK', 1050, 0.018, 0.35),
    KOTAKBANK: generateRealisticNseHistory('KOTAKBANK', 1720, 0.015, 0.2),
    TITAN: generateRealisticNseHistory('TITAN', 3250, 0.019, 0.45),
    ADANIENT: generateRealisticNseHistory('ADANIENT', 2800, 0.028, 0.3),
    NTPC: generateRealisticNseHistory('NTPC', 340, 0.017, 0.5),
    'M&M': generateRealisticNseHistory('M&M', 2650, 0.02, 0.55),
    TRENT: generateRealisticNseHistory('TRENT', 5200, 0.025, 0.7),
    LTIM: generateRealisticNseHistory('LTIM', 4850, 0.022, 0.28),
  };

  for (const s of STOCK_UNIVERSE) {
    if (!baseMap[s.symbol]) {
      const price = Math.round(80 + (s.marketCapCr % 1400));
      baseMap[s.symbol] = generateRealisticNseHistory(s.symbol, price, 0.02, 0.25);
    }
  }

  return baseMap;
})();

/**
 * Generate 20-Year (2004 - 2026) Full Historical NSE Dataset (~5,200 trading days)
 * Faithfully modeling 2 decades of NSE bull runs, GFC crash, COVID crash, rallies,
 * and key corporate action ex-dates.
 */
export function generateTwentyYearHistory(
  symbol: string,
  startPrice2004: number,
  corporateEvents: { date: string; type: 'SPLIT' | 'BONUS' | 'DEMERGER' | 'RIGHTS'; factor: number }[] = []
): CandleBar[] {
  const bars: CandleBar[] = [];
  const startDate = new Date('2004-01-01');
  const endDate = new Date('2026-03-01');

  let seed = 0;
  for (let i = 0; i < symbol.length; i++) {
    seed = (seed * 37 + symbol.charCodeAt(i)) & 0xffffffff;
  }
  const prng = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return (seed >>> 0) / 4294967296;
  };

  let currentClose = startPrice2004;
  let cur = new Date(startDate);

  // Map of events by date
  const eventMap = new Map<string, { type: string; factor: number }>();
  corporateEvents.forEach((e) => eventMap.set(e.date, e));

  while (cur <= endDate) {
    // Skip Saturday & Sunday
    if (cur.getDay() !== 0 && cur.getDay() !== 6) {
      const dateStr = cur.toISOString().split('T')[0];

      // If unadjusted corporate event date reached
      if (eventMap.has(dateStr)) {
        const ev = eventMap.get(dateStr)!;
        currentClose = currentClose * ev.factor;
      }

      // Year-based macroeconomic trend weight
      const year = cur.getFullYear();
      let regimeTrend = 0.0003;
      let regimeVol = 0.015;

      if (year >= 2004 && year <= 2007) {
        regimeTrend = 0.0009; // Strong India growth cycle
        regimeVol = 0.016;
      } else if (year === 2008) {
        regimeTrend = -0.0018; // Global Financial Crisis crash
        regimeVol = 0.035;
      } else if (year === 2009) {
        regimeTrend = 0.0016; // GFC Recovery
        regimeVol = 0.025;
      } else if (year === 2020 && cur.getMonth() >= 1 && cur.getMonth() <= 3) {
        regimeTrend = -0.0035; // COVID pandemic crash
        regimeVol = 0.045;
      } else if (year === 2020 && cur.getMonth() > 3) {
        regimeTrend = 0.0022; // Post-COVID massive recovery
        regimeVol = 0.02;
      } else if (year >= 2021) {
        regimeTrend = 0.0007; // Structural India bull run
        regimeVol = 0.014;
      }

      const dailyRet = (prng() - 0.485) * regimeVol + regimeTrend;
      const prevClose = currentClose;
      currentClose = Math.max(5, currentClose * (1 + dailyRet));

      const openNoise = (prng() - 0.5) * 0.006 * currentClose;
      const open = Number((prevClose + openNoise).toFixed(2));
      const high = Number((Math.max(open, currentClose) + prng() * 0.012 * currentClose).toFixed(2));
      const low = Number((Math.min(open, currentClose) - prng() * 0.012 * currentClose).toFixed(2));
      const close = Number(currentClose.toFixed(2));

      // 20-year volume expansion (from ~200k shares/day in 2004 to 5M+ shares/day in 2025)
      const yearMultiplier = 0.2 + ((year - 2004) / 22) * 2.5;
      const baseVol = Math.round((600000 + prng() * 1800000) * yearMultiplier);
      const deliveryPct = Number((35 + prng() * 35).toFixed(1));
      const deliveryQty = Math.round(baseVol * (deliveryPct / 100));

      bars.push({
        date: dateStr,
        open,
        high,
        low,
        close,
        volume: baseVol,
        deliveryQty,
        deliveryPct,
        turnover: Math.round((baseVol * close) / 100000),
        trades: Math.floor(baseVol / 50),
      });
    }
    cur.setDate(cur.getDate() + 1);
  }

  return bars;
}

/**
 * Generate 20-Year Dataset for all key symbols
 */
export function generateFullTwentyYearMarketData(): Record<string, CandleBar[]> {
  return {
    RELIANCE: generateTwentyYearHistory('RELIANCE', 120, [
      { date: '2009-11-26', type: 'BONUS', factor: 0.5 },
      { date: '2017-09-07', type: 'BONUS', factor: 0.5 },
      { date: '2020-05-14', type: 'RIGHTS', factor: 0.985 },
      { date: '2023-07-20', type: 'DEMERGER', factor: 0.905 },
      { date: '2024-10-28', type: 'BONUS', factor: 0.5 },
    ]),
    TCS: generateTwentyYearHistory('TCS', 130, [
      { date: '2006-07-28', type: 'BONUS', factor: 0.5 },
      { date: '2009-06-16', type: 'BONUS', factor: 0.5 },
      { date: '2018-05-31', type: 'BONUS', factor: 0.5 },
    ]),
    INFY: generateTwentyYearHistory('INFY', 85, [
      { date: '2006-07-14', type: 'BONUS', factor: 0.5 },
      { date: '2014-12-02', type: 'BONUS', factor: 0.5 },
      { date: '2015-06-15', type: 'BONUS', factor: 0.5 },
      { date: '2018-09-04', type: 'BONUS', factor: 0.5 },
    ]),
    HDFCBANK: generateTwentyYearHistory('HDFCBANK', 45, [
      { date: '2011-07-14', type: 'SPLIT', factor: 0.2 },
      { date: '2019-09-19', type: 'SPLIT', factor: 0.5 },
    ]),
    ICICIBANK: generateTwentyYearHistory('ICICIBANK', 55, [
      { date: '2014-12-04', type: 'SPLIT', factor: 0.2 },
      { date: '2017-06-20', type: 'BONUS', factor: 0.909 },
    ]),
    TATASTEEL: generateTwentyYearHistory('TATASTEEL', 40, [
      { date: '2022-07-28', type: 'SPLIT', factor: 0.1 },
    ]),
    TATAMOTORS: generateTwentyYearHistory('TATAMOTORS', 70, [
      { date: '2011-09-12', type: 'SPLIT', factor: 0.2 },
    ]),
    SBIN: generateTwentyYearHistory('SBIN', 50, [
      { date: '2014-11-20', type: 'SPLIT', factor: 0.1 },
    ]),
    LT: generateTwentyYearHistory('LT', 160, [
      { date: '2006-09-28', type: 'BONUS', factor: 0.5 },
      { date: '2008-09-29', type: 'BONUS', factor: 0.5 },
      { date: '2013-07-11', type: 'BONUS', factor: 0.5 },
    ]),
    ITC: generateTwentyYearHistory('ITC', 35, [
      { date: '2005-09-21', type: 'SPLIT', factor: 0.1 },
      { date: '2005-09-21', type: 'BONUS', factor: 0.5 },
      { date: '2010-08-03', type: 'BONUS', factor: 0.667 },
      { date: '2016-07-01', type: 'BONUS', factor: 0.5 },
    ]),
    BHARTIARTL: generateTwentyYearHistory('BHARTIARTL', 65, [
      { date: '2009-07-23', type: 'SPLIT', factor: 0.5 },
      { date: '2021-10-18', type: 'RIGHTS', factor: 0.98 },
    ]),
    HINDUNILVR: generateTwentyYearHistory('HINDUNILVR', 210),
    BAJFINANCE: generateTwentyYearHistory('BAJFINANCE', 15, [
      { date: '2016-09-08', type: 'SPLIT', factor: 0.5 },
      { date: '2016-09-08', type: 'BONUS', factor: 0.5 },
    ]),
    MARUTI: generateTwentyYearHistory('MARUTI', 450),
    SUNPHARMA: generateTwentyYearHistory('SUNPHARMA', 40, [
      { date: '2010-11-29', type: 'SPLIT', factor: 0.2 },
      { date: '2013-07-29', type: 'BONUS', factor: 0.5 },
    ]),
    AXISBANK: generateTwentyYearHistory('AXISBANK', 30, [
      { date: '2014-07-28', type: 'SPLIT', factor: 0.2 },
    ]),
    KOTAKBANK: generateTwentyYearHistory('KOTAKBANK', 35, [
      { date: '2010-09-13', type: 'SPLIT', factor: 0.5 },
      { date: '2015-07-08', type: 'BONUS', factor: 0.5 },
    ]),
    TITAN: generateTwentyYearHistory('TITAN', 12, [
      { date: '2011-06-23', type: 'SPLIT', factor: 0.1 },
      { date: '2011-06-23', type: 'BONUS', factor: 0.5 },
    ]),
    ADANIENT: generateTwentyYearHistory('ADANIENT', 25, [
      { date: '2009-09-17', type: 'SPLIT', factor: 0.1 },
    ]),
    NTPC: generateTwentyYearHistory('NTPC', 60, [
      { date: '2019-03-18', type: 'BONUS', factor: 0.8 },
    ]),
    'M&M': generateTwentyYearHistory('M&M', 45, [
      { date: '2010-06-03', type: 'SPLIT', factor: 0.5 },
      { date: '2017-12-21', type: 'BONUS', factor: 0.5 },
    ]),
    TRENT: generateTwentyYearHistory('TRENT', 30, [
      { date: '2016-09-12', type: 'SPLIT', factor: 0.1 },
    ]),
    LTIM: generateTwentyYearHistory('LTIM', 380, [
      { date: '2022-11-24', type: 'DEMERGER', factor: 1.0 },
    ]),
  };
}

/**
 * Generate historical dataset for all symbols filtered or generated for any custom date range.
 * Supports arbitrary date intervals, e.g. 2023-12-01 to 2026-09-30 or 2021-01-01 to 2022-12-31.
 * Supports ALL 60+ major NSE symbols and any dynamically added stocks.
 */
export function generateRangeHistoricalData(
  startDateStr: string = '2004-01-01',
  endDateStr: string = '2026-09-30',
  additionalSymbols?: string[]
): Record<string, CandleBar[]> {
  const full = generateFullTwentyYearMarketData();
  const start = startDateStr.trim() || '2004-01-01';
  const end = endDateStr.trim() || new Date().toISOString().split('T')[0];

  // Include ALL symbols from STOCK_UNIVERSE (60+ stocks) plus any custom symbols
  const allSymbols = Array.from(
    new Set([
      ...STOCK_UNIVERSE.map((s) => s.symbol),
      ...Object.keys(full),
      ...(additionalSymbols || []),
    ])
  );

  const ranged: Record<string, CandleBar[]> = {};
  for (const sym of allSymbols) {
    let bars = full[sym];
    if (!bars) {
      bars = generateTwentyYearHistory(sym, 120);
    }
    const subset = bars.filter((b) => b.date >= start && b.date <= end);
    ranged[sym] = subset.length > 0 ? subset : bars.slice(-250);
  }
  return ranged;
}

/**
 * Fetch / Simulate Real-Time Live Google Finance Intraday Feed
 * Allows intraday charting (1m, 5m, 15m, 1h) with live market ticks.
 */
export function simulateGoogleIntradayStream(
  symbol: string,
  lastClose: number,
  barsCount: number = 60
): CandleBar[] {
  const bars: CandleBar[] = [];
  const now = new Date();
  let currentPrice = lastClose;

  for (let i = barsCount; i >= 0; i--) {
    const barTime = new Date(now.getTime() - i * 60 * 1000);
    const timeStr = `${barTime.toISOString().split('T')[0]} ${String(barTime.getHours()).padStart(2, '0')}:${String(barTime.getMinutes()).padStart(2, '0')}`;
    const delta = (Math.random() - 0.49) * (lastClose * 0.0018);
    const bOpen = currentPrice;
    currentPrice = Number(Math.max(10, currentPrice + delta).toFixed(2));
    const bHigh = Number((Math.max(bOpen, currentPrice) + Math.random() * (lastClose * 0.0008)).toFixed(2));
    const bLow = Number((Math.min(bOpen, currentPrice) - Math.random() * (lastClose * 0.0008)).toFixed(2));
    const bClose = currentPrice;
    const vol = Math.floor(5000 + Math.random() * 25000);
    const deliv = Math.round(vol * (0.4 + Math.random() * 0.25));

    bars.push({
      date: timeStr,
      open: bOpen,
      high: bHigh,
      low: bLow,
      close: bClose,
      volume: vol,
      deliveryQty: deliv,
      deliveryPct: Number(((deliv / vol) * 100).toFixed(1)),
    });
  }

  return bars;
}

/**
 * Append Today's EOD Daily Bhavcopy Bar
 */
export function appendDailyEodBar(
  currentBars: CandleBar[],
  symbol: string
): CandleBar[] {
  if (!currentBars || currentBars.length === 0) return currentBars;
  const lastBar = currentBars[currentBars.length - 1];
  const lastDate = new Date(lastBar.date);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + 1);
  while (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  const dateStr = nextDate.toISOString().split('T')[0];

  // Prevent duplicate date
  if (currentBars.some((b) => b.date === dateStr)) {
    return currentBars;
  }

  const change = (Math.random() - 0.48) * (lastBar.close * 0.018);
  const newClose = Number((lastBar.close + change).toFixed(2));
  const newOpen = Number((lastBar.close + (Math.random() - 0.5) * (lastBar.close * 0.005)).toFixed(2));
  const newHigh = Number((Math.max(newOpen, newClose) + Math.random() * (lastBar.close * 0.008)).toFixed(2));
  const newLow = Number((Math.min(newOpen, newClose) - Math.random() * (lastBar.close * 0.008)).toFixed(2));
  const newVol = Math.round(lastBar.volume * (0.8 + Math.random() * 0.5));
  const newDeliv = Math.round(newVol * (0.42 + Math.random() * 0.2));

  const newBar: CandleBar = {
    date: dateStr,
    open: newOpen,
    high: newHigh,
    low: newLow,
    close: newClose,
    volume: newVol,
    deliveryQty: newDeliv,
    deliveryPct: Number(((newDeliv / newVol) * 100).toFixed(1)),
    turnover: Math.round((newVol * newClose) / 100000),
    trades: Math.floor(newVol / 45),
  };

  return [...currentBars, newBar];
}
