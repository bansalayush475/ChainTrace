import React from 'react';
import { getRiskColor, getRiskLevel, type RiskFactors } from '../../utils/riskEngine';

interface RiskScoreGaugeProps {
  score: number;
  factors?: RiskFactors;
  size?: 'sm' | 'md' | 'lg';
}

const FACTOR_LABELS: Record<keyof RiskFactors, string> = {
  transactionAnomalies: 'Tx Anomalies',
  counterpartyRisk: 'Counterparty',
  fundVelocity: 'Fund Velocity',
  clusterAssociation: 'Cluster Assoc.',
  knownFraudExposure: 'Fraud Exposure',
  exchangeMixerExposure: 'Mixer Exposure',
};

export default function RiskScoreGauge({ score, factors, size = 'md' }: RiskScoreGaugeProps) {
  const color = getRiskColor(score);
  const level = getRiskLevel(score);

  const svgSize = size === 'sm' ? 120 : size === 'lg' ? 200 : 160;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const r = svgSize * 0.38;
  const strokeWidth = size === 'sm' ? 8 : 12;

  const circumference = 2 * Math.PI * r;
  const arcFraction = 0.75; // 270 degrees arc
  const arcLength = circumference * arcFraction;
  const dashOffset = arcLength * (1 - score / 100);

  const startAngle = 135; // degrees
  const rotateTransform = `rotate(${startAngle}, ${cx}, ${cy})`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
      {/* SVG Gauge */}
      <div style={{ position: 'relative', filter: `drop-shadow(0 0 12px ${color}35)` }}>
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          {/* Background arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            transform={rotateTransform}
          />
          {/* Score arc with smooth transition */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={rotateTransform}
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.2, 0.8, 0.2, 1), stroke 0.4s ease' }}
          />
          {/* Score text */}
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fill: color,
              fontSize: size === 'sm' ? '24px' : '36px',
              fontWeight: 800,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {score}
          </text>
          <text
            x={cx}
            y={cy + (size === 'sm' ? 14 : 20)}
            textAnchor="middle"
            style={{
              fill: color,
              fontSize: size === 'sm' ? '9px' : '11px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              fontFamily: 'JetBrains Mono, monospace',
              textTransform: 'uppercase',
            }}
          >
            {level}
          </text>
        </svg>
      </div>

      {/* Factor Bars */}
      {factors && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '9px' }}>
          {(Object.entries(factors) as [keyof RiskFactors, number][]).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 500 }}>
                  {FACTOR_LABELS[key]}
                </span>
                <span style={{
                  color: getRiskColor(value),
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 700,
                }}>
                  {value}/100
                </span>
              </div>
              <div style={{ height: '5px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${value}%`,
                    background: `linear-gradient(90deg, ${getRiskColor(value)}88, ${getRiskColor(value)})`,
                    borderRadius: '2px',
                    transition: 'width 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    boxShadow: `0 0 6px ${getRiskColor(value)}50`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
