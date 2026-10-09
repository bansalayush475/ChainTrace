export interface RiskFactors {
  transactionAnomalies: number;
  counterpartyRisk: number;
  fundVelocity: number;
  clusterAssociation: number;
  knownFraudExposure: number;
  exchangeMixerExposure: number;
}

const WEIGHTS = {
  transactionAnomalies: 0.25,
  counterpartyRisk: 0.2,
  fundVelocity: 0.15,
  clusterAssociation: 0.15,
  knownFraudExposure: 0.15,
  exchangeMixerExposure: 0.1,
};

export function calculateRiskScore(factors: RiskFactors): number {
  const score =
    factors.transactionAnomalies * WEIGHTS.transactionAnomalies +
    factors.counterpartyRisk * WEIGHTS.counterpartyRisk +
    factors.fundVelocity * WEIGHTS.fundVelocity +
    factors.clusterAssociation * WEIGHTS.clusterAssociation +
    factors.knownFraudExposure * WEIGHTS.knownFraudExposure +
    factors.exchangeMixerExposure * WEIGHTS.exchangeMixerExposure;
  return Math.min(100, Math.round(score));
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export function getRiskLevel(score: number): RiskLevel {
  if (score < 30) return "LOW";
  if (score < 60) return "MEDIUM";
  if (score < 80) return "HIGH";
  return "CRITICAL";
}

export function getRiskColor(score: number): string {
  const level = getRiskLevel(score);
  switch (level) {
    case "CRITICAL":
      return "var(--risk-critical)";
    case "HIGH":
      return "var(--risk-high)";
    case "MEDIUM":
      return "var(--risk-medium)";
    case "LOW":
      return "var(--risk-low)";
  }
}

export function getRiskBgClass(score: number): string {
  const level = getRiskLevel(score);
  switch (level) {
    case "CRITICAL":
      return "bg-red-900/30 text-red-400 border-red-800";
    case "HIGH":
      return "bg-orange-900/30 text-orange-400 border-orange-800";
    case "MEDIUM":
      return "bg-amber-900/30 text-amber-400 border-amber-800";
    case "LOW":
      return "bg-green-900/30 text-green-400 border-green-800";
  }
}

export function getDefaultRiskFactors(overallScore: number, seed?: string): RiskFactors {
  const base = overallScore;
  let offset = 0;
  if (seed) {
    for (let i = 0; i < seed.length; i++) {
      offset = (offset << 5) - offset + seed.charCodeAt(i);
      offset |= 0;
    }
  }
  const absOffset = Math.abs(offset);
  const d1 = ((base * 7 + absOffset) % 11) - 5;
  const d2 = ((base * 13 + absOffset) % 9) - 4;
  const d3 = ((base * 17 + absOffset) % 13) - 6;
  const d4 = ((base * 23 + absOffset) % 9) - 4;
  const d5 = ((base * 29 + absOffset) % 15) - 7;
  const d6 = ((base * 31 + absOffset) % 11) - 5;

  return {
    transactionAnomalies: Math.min(100, Math.max(0, base + d1)),
    counterpartyRisk: Math.min(100, Math.max(0, base + d2)),
    fundVelocity: Math.min(100, Math.max(0, base + d3)),
    clusterAssociation: Math.min(100, Math.max(0, base + d4)),
    knownFraudExposure: Math.min(100, Math.max(0, base + d5)),
    exchangeMixerExposure: Math.min(100, Math.max(0, base + d6)),
  };
}

export function truncateAddress(address: string, chars = 8): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatAmount(amount: number, decimals = 4): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(amount);
}
