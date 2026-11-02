const db = require('../database/db');

class BaselineEngine {
  /**
   * Fetches established baseline for a user
   */
  static async getBaseline(userId) {
    let baseline = await db.findOne('user_baselines', b => b.user_id === userId);
    if (!baseline) {
      // Default baseline profile if not yet established
      baseline = {
        user_id: userId,
        work_hours_start: 9,
        work_hours_end: 18,
        avg_daily_downloads: 5.0,
        std_daily_downloads: 2.0,
        avg_daily_modifications: 10.0,
        std_daily_modifications: 3.5,
        avg_unique_resources_accessed: 8.0,
        std_unique_resources_accessed: 2.5,
        typical_ips: ['192.168.1.100', '10.0.1.50'],
        sample_period_days: 30,
        is_baseline_locked: false,
        last_calculated_at: new Date().toISOString()
      };
      await db.insert('user_baselines', baseline);
    }
    return baseline;
  }

  /**
   * Recalculates baseline using only trusted, eligible activity (excludes flagged/malicious)
   */
  static async recalculateBaseline(userId) {
    const baseline = await this.getBaseline(userId);
    if (baseline.is_baseline_locked) {
      return { baseline, updated: false, reason: 'Baseline is locked by security administrator.' };
    }

    // Filter only trusted past non-suspicious activity
    const eligibleEvents = await db.find('activity_events', e => 
      e.user_id === userId && !e.is_suspicious && e.status === 'SUCCESS'
    );

    if (eligibleEvents.length < 10) {
      return { baseline, updated: false, reason: 'Insufficient eligible training data points (minimum 10 required).' };
    }

    // Group events by calendar day
    const dayBuckets = {};
    const uniqueIps = new Set();

    for (const evt of eligibleEvents) {
      const day = evt.timestamp.split('T')[0];
      if (!dayBuckets[day]) {
        dayBuckets[day] = { downloads: 0, modifications: 0, resources: new Set() };
      }

      if (evt.event_type === 'FILE_DOWNLOAD') dayBuckets[day].downloads++;
      if (evt.event_type === 'RECORD_MODIFY') dayBuckets[day].modifications++;
      if (evt.resource_id) dayBuckets[day].resources.add(evt.resource_id);
      if (evt.ip_address) uniqueIps.add(evt.ip_address);
    }

    const days = Object.values(dayBuckets);
    if (days.length === 0) return { baseline, updated: false };

    // Calculate means
    const downloadCounts = days.map(d => d.downloads);
    const modCounts = days.map(d => d.modifications);
    const resourceCounts = days.map(d => d.resources.size);

    const calcStats = (arr) => {
      const n = arr.length;
      if (n === 0) return { mean: 0, std: 1 };
      const mean = arr.reduce((acc, v) => acc + v, 0) / n;
      const variance = arr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
      return { mean: parseFloat(mean.toFixed(2)), std: parseFloat(Math.max(0.5, Math.sqrt(variance)).toFixed(2)) };
    };

    const downloadStats = calcStats(downloadCounts);
    const modStats = calcStats(modCounts);
    const resStats = calcStats(resourceCounts);

    const updates = {
      avg_daily_downloads: downloadStats.mean,
      std_daily_downloads: downloadStats.std,
      avg_daily_modifications: modStats.mean,
      std_daily_modifications: modStats.std,
      avg_unique_resources_accessed: resStats.mean,
      std_unique_resources_accessed: resStats.std,
      typical_ips: Array.from(uniqueIps).slice(0, 5),
      last_calculated_at: new Date().toISOString()
    };

    await db.update('user_baselines', b => b.user_id === userId, updates);
    return { baseline: { ...baseline, ...updates }, updated: true };
  }

  /**
   * Compares recent user activity against their established baseline
   * Returns standard deviations (Z-score) and human-readable explanations
   */
  static async evaluateBaselineDeviation(userId, recentEvents = []) {
    const baseline = await this.getBaseline(userId);

    // Compute metrics over recentEvents (e.g. last 24h)
    let recentDownloads = 0;
    let recentModifications = 0;
    const recentResources = new Set();
    const recentIps = new Set();
    let offHoursCount = 0;

    for (const evt of recentEvents) {
      if (evt.event_type === 'FILE_DOWNLOAD') recentDownloads++;
      if (evt.event_type === 'RECORD_MODIFY') recentModifications++;
      if (evt.resource_id) recentResources.add(evt.resource_id);
      if (evt.ip_address) recentIps.add(evt.ip_address);

      const hour = new Date(evt.timestamp).getHours();
      if (hour < baseline.work_hours_start || hour >= baseline.work_hours_end) {
        offHoursCount++;
      }
    }

    // Calculate Z-Scores: (x - mean) / std
    const zScore = (val, mean, std) => {
      const s = Math.max(0.5, std);
      return parseFloat(((val - mean) / s).toFixed(2));
    };

    const downloadZ = zScore(recentDownloads, baseline.avg_daily_downloads, baseline.std_daily_downloads);
    const modZ = zScore(recentModifications, baseline.avg_daily_modifications, baseline.std_daily_modifications);
    const resZ = zScore(recentResources.size, baseline.avg_unique_resources_accessed, baseline.std_unique_resources_accessed);

    const deviations = [];
    let anomalyScore = 0;

    if (downloadZ > 2.0) {
      const weight = Math.min(40, downloadZ * 8);
      anomalyScore += weight;
      deviations.push({
        metric: 'Daily Downloads',
        baselineAvg: baseline.avg_daily_downloads,
        baselineStd: baseline.std_daily_downloads,
        observedValue: recentDownloads,
        zScore: downloadZ,
        severity: downloadZ > 3.5 ? 'CRITICAL' : 'HIGH',
        explanation: `Observed ${recentDownloads} file downloads vs baseline mean ${baseline.avg_daily_downloads} (+${downloadZ}σ deviation).`
      });
    }

    if (modZ > 2.0) {
      const weight = Math.min(30, modZ * 6);
      anomalyScore += weight;
      deviations.push({
        metric: 'Record Modifications',
        baselineAvg: baseline.avg_daily_modifications,
        baselineStd: baseline.std_daily_modifications,
        observedValue: recentModifications,
        zScore: modZ,
        severity: modZ > 3.5 ? 'CRITICAL' : 'HIGH',
        explanation: `Observed ${recentModifications} modifications vs baseline mean ${baseline.avg_daily_modifications} (+${modZ}σ deviation).`
      });
    }

    if (resZ > 2.0) {
      const weight = Math.min(25, resZ * 5);
      anomalyScore += weight;
      deviations.push({
        metric: 'Unique Resources Probed',
        baselineAvg: baseline.avg_unique_resources_accessed,
        baselineStd: baseline.std_unique_resources_accessed,
        observedValue: recentResources.size,
        zScore: resZ,
        severity: resZ > 3.0 ? 'HIGH' : 'MEDIUM',
        explanation: `Accessed ${recentResources.size} unique confidential resources vs baseline mean ${baseline.avg_unique_resources_accessed} (+${resZ}σ deviation).`
      });
    }

    // IP Anomaly Check
    const atypicalIps = Array.from(recentIps).filter(ip => !baseline.typical_ips.includes(ip));
    if (atypicalIps.length > 0) {
      anomalyScore += 15;
      deviations.push({
        metric: 'Network Location',
        baselineAvg: baseline.typical_ips.join(', '),
        observedValue: atypicalIps.join(', '),
        zScore: 2.5,
        severity: 'MEDIUM',
        explanation: `Activity detected from atypical IP address (${atypicalIps.join(', ')}) not present in user profile baseline.`
      });
    }

    // Off-Hours Check
    if (offHoursCount > 0) {
      const weight = Math.min(20, offHoursCount * 5);
      anomalyScore += weight;
      deviations.push({
        metric: 'Off-Hours Operations',
        baselineAvg: `${baseline.work_hours_start}:00 - ${baseline.work_hours_end}:00`,
        observedValue: `${offHoursCount} off-hours actions`,
        zScore: 2.0,
        severity: 'MEDIUM',
        explanation: `Recorded ${offHoursCount} operational requests outside established standard shift (${baseline.work_hours_start}:00 - ${baseline.work_hours_end}:00).`
      });
    }

    return {
      userId,
      baseline,
      recentDownloads,
      recentModifications,
      uniqueResourcesCount: recentResources.size,
      offHoursCount,
      deviations,
      baselineAnomalyScore: Math.min(100, Math.round(anomalyScore)),
      isAnomalous: deviations.length > 0
    };
  }
}

module.exports = BaselineEngine;
