const RuleEngine = require('./ruleEngine');
const MLEngine = require('./mlEngine');
const BaselineEngine = require('./baselineEngine');
const db = require('../database/db');

class HybridRiskEngine {
  /**
   * Evaluates an incoming activity event end-to-end
   * Produces explainable composite risk score, contributing factors, and alert trigger
   */
  static async evaluateEvent(currentEvent) {
    const userId = currentEvent.user_id;

    // 1. Fetch user recent events for context
    const now = new Date(currentEvent.timestamp || Date.now()).getTime();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const recentEvents = await db.find('activity_events', e => 
      e.user_id === userId && e.timestamp >= oneDayAgo
    );

    // 2. Component A: Rule-Based Detection
    const ruleResult = await RuleEngine.evaluateEvent(currentEvent);

    // 3. Component B: Dynamic Baseline Deviation
    const baselineResult = await BaselineEngine.evaluateBaselineDeviation(userId, [...recentEvents, currentEvent]);

    // 4. Component C: ML Isolation Forest Anomaly Inference
    const mlResult = await MLEngine.predictAnomaly(currentEvent, recentEvents, baselineResult.baseline);

    // 5. Dynamic Hybrid Risk Formulation
    // Formula: S_composite = min(100, round(0.45 * S_rule + 0.30 * S_ml + 0.25 * S_baseline))
    const wRule = 0.45;
    const wML = 0.30;
    const wBase = 0.25;

    const rawRuleScore = ruleResult.ruleRiskScore;
    const rawMLScore = mlResult.anomalyScore * 100;
    const rawBaseScore = baselineResult.baselineAnomalyScore;

    let compositeScore = (wRule * rawRuleScore) + (wML * rawMLScore) + (wBase * rawBaseScore);

    // Critical rule trigger safety floor: high confidence critical rules ensure minimum score 65
    if (ruleResult.maxSeverity === 'Critical') {
      compositeScore = Math.max(compositeScore, 65);
    }

    const finalScore = Math.min(100, Math.max(0, Math.round(compositeScore * 10) / 10));

    // Determine Severity Tier
    let severity = 'Low';
    if (finalScore >= 80) severity = 'Critical';
    else if (finalScore >= 60) severity = 'High';
    else if (finalScore >= 30) severity = 'Medium';

    // Build Transparent Contributing Factors
    const contributingFactors = [];

    // Add Rule triggers
    for (const tr of ruleResult.triggeredRules) {
      contributingFactors.push({
        type: 'RULE_TRIGGER',
        name: tr.ruleName,
        weight: tr.riskWeight,
        severity: tr.severity,
        observed: tr.observedMetric,
        threshold: tr.threshold,
        explanation: tr.detail
      });
    }

    // Add Baseline deviations
    for (const dev of baselineResult.deviations) {
      contributingFactors.push({
        type: 'BASELINE_DEVIATION',
        name: dev.metric,
        weight: Math.round(Math.abs(dev.zScore) * 8),
        severity: dev.severity,
        observed: dev.observedValue,
        baseline: dev.baselineAvg,
        zScore: dev.zScore,
        explanation: dev.explanation
      });
    }

    // Add Isolation Forest Anomaly
    if (mlResult.isAnomaly || mlResult.anomalyScore > 0.55) {
      contributingFactors.push({
        type: 'ML_ANOMALY',
        name: 'Isolation Forest Behavioral Anomaly',
        weight: Math.round(mlResult.anomalyScore * 30),
        severity: mlResult.anomalyScore > 0.75 ? 'HIGH' : 'MEDIUM',
        score: mlResult.anomalyScore,
        model: mlResult.model,
        explanation: `Multi-dimensional feature vector yielded anomaly score of ${mlResult.anomalyScore.toFixed(3)} (decision threshold: 0.62).`
      });
    }

    // Attribution: Detection Method
    let detectionMethod = 'HYBRID';
    if (ruleResult.isTriggered && !baselineResult.isAnomalous && !mlResult.isAnomaly) {
      detectionMethod = 'RULE_BASED';
    } else if (!ruleResult.isTriggered && (baselineResult.isAnomalous || mlResult.isAnomaly)) {
      detectionMethod = 'ANOMALY_BASED';
    }

    const shouldAlert = finalScore >= 45 || ruleResult.maxSeverity === 'Critical';

    return {
      userId,
      compositeRiskScore: finalScore,
      severity,
      detectionMethod,
      ruleRiskScore: rawRuleScore,
      anomalyRiskScore: parseFloat(rawMLScore.toFixed(1)),
      baselineScore: rawBaseScore,
      shouldAlert,
      contributingFactors,
      ruleResult,
      baselineResult,
      mlResult
    };
  }
}

module.exports = HybridRiskEngine;
