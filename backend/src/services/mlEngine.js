const config = require('../config');

/**
 * Pure JavaScript Isolation Forest Implementation
 * Explainable, robust, and zero external dependency
 */
class IsolationTreeNode {
  constructor(size) {
    this.size = size;
    this.splitFeature = null;
    this.splitValue = null;
    this.minVal = null;
    this.maxVal = null;
    this.left = null;
    this.right = null;
  }
}

class IsolationTree {
  constructor(maxDepth) {
    this.maxDepth = maxDepth;
    this.root = null;
  }

  fit(data, currentDepth = 0) {
    const numRows = data.length;
    const node = new IsolationTreeNode(numRows);

    if (currentDepth >= this.maxDepth || numRows <= 1) {
      return node;
    }

    const numFeatures = data[0].length;
    const featureIdx = Math.floor(Math.random() * numFeatures);

    const featureValues = data.map(row => row[featureIdx]);
    const minVal = Math.min(...featureValues);
    const maxVal = Math.max(...featureValues);

    node.minVal = minVal;
    node.maxVal = maxVal;

    if (minVal === maxVal) {
      return node;
    }

    const splitVal = minVal + Math.random() * (maxVal - minVal);
    const leftData = data.filter(row => row[featureIdx] < splitVal);
    const rightData = data.filter(row => row[featureIdx] >= splitVal);

    if (leftData.length === 0 || rightData.length === 0) {
      return node;
    }

    node.splitFeature = featureIdx;
    node.splitValue = splitVal;
    node.left = this.fit(leftData, currentDepth + 1);
    node.right = this.fit(rightData, currentDepth + 1);

    return node;
  }

  pathLength(point, node, currentDepth = 0) {
    if (!node.left || !node.right || node.size <= 1) {
      return currentDepth + IsolationTree.c(node.size);
    }

    const feature = node.splitFeature;

    // Boundary Isolation: If point is strictly beyond the training distribution bounds of this node,
    // it isolates immediately.
    if (node.minVal !== null && node.maxVal !== null) {
      if (point[feature] < node.minVal || point[feature] > node.maxVal) {
        return currentDepth + 1;
      }
    }

    if (point[feature] < node.splitValue) {
      return this.pathLength(point, node.left, currentDepth + 1);
    } else {
      return this.pathLength(point, node.right, currentDepth + 1);
    }
  }

  // Harmonic average path length approximation constant c(n)
  static c(n) {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    const eulerGamma = 0.5772156649;
    return 2 * (Math.log(n - 1) + eulerGamma) - (2 * (n - 1) / n);
  }
}

class IsolationForest {
  constructor(numTrees = 60, subSampleSize = 128) {
    this.numTrees = numTrees;
    this.subSampleSize = subSampleSize;
    this.trees = [];
    this.trainedSize = 0;
  }

  fit(trainingData) {
    this.trees = [];
    this.trainedSize = trainingData.length;
    const maxDepth = Math.ceil(Math.log2(Math.max(2, this.subSampleSize)));

    for (let i = 0; i < this.numTrees; i++) {
      const sample = [];
      const sampleSize = Math.min(this.subSampleSize, trainingData.length);
      for (let j = 0; j < sampleSize; j++) {
        const randIdx = Math.floor(Math.random() * trainingData.length);
        sample.push(trainingData[randIdx]);
      }
      const tree = new IsolationTree(maxDepth);
      tree.root = tree.fit(sample);
      this.trees.push(tree);
    }
  }

  scorePoint(point) {
    if (this.trees.length === 0) return 0.5;
    let totalPathLength = 0;
    for (const tree of this.trees) {
      totalPathLength += tree.pathLength(point, tree.root);
    }
    const avgPathLength = totalPathLength / this.trees.length;
    const cN = IsolationTree.c(this.subSampleSize);
    if (cN === 0) return 0.5;

    // Anomaly score formula: s(x, n) = 2^(-E(h(x)) / c(n))
    const score = Math.pow(2, -avgPathLength / cN);
    return Math.max(0, Math.min(1, parseFloat(score.toFixed(4))));
  }
}

// Global in-memory trained Isolation Forest instance with baseline feature distributions
let trainedModel = null;

class MLEngine {
  /**
   * Initializes or gets the trained Isolation Forest model
   */
  static getModel() {
    if (!trainedModel) {
      trainedModel = new IsolationForest(60, 128);
      // Train on typical normal behavior distribution
      const normalTrainingSet = [];
      for (let i = 0; i < 300; i++) {
        // [logins_1h, downloads_15m, denied_15m, unique_resources_1h, time_offset, download_ratio, modifications_15m]
        const sample = [
          Math.floor(Math.random() * 2) + 1,       // 1-2 logins
          Math.floor(Math.random() * 5),           // 0-4 downloads
          0,                                       // 0 denied
          Math.floor(Math.random() * 6) + 2,       // 2-7 resources
          Math.abs(13 - (9 + Math.floor(Math.random() * 8))), // standard workday hours
          0.8 + Math.random() * 0.5,               // download ratio ~ 1.0
          Math.floor(Math.random() * 8)            // 0-7 modifications
        ];
        normalTrainingSet.push(sample);
      }
      trainedModel.fit(normalTrainingSet);
    }
    return trainedModel;
  }

  /**
   * Extracts feature vector from recent user events and baseline
   */
  static extractFeatureVector(currentEvent, recentEvents = [], baseline = {}) {
    const now = new Date(currentEvent.timestamp || Date.now()).getTime();
    const fifteenMinAgo = now - 15 * 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    const events1h = recentEvents.filter(e => new Date(e.timestamp).getTime() >= oneHourAgo);
    const events15m = recentEvents.filter(e => new Date(e.timestamp).getTime() >= fifteenMinAgo);

    const logins1h = events1h.filter(e => e.event_type === 'LOGIN').length + (currentEvent.event_type === 'LOGIN' ? 1 : 0);
    const downloads15m = events15m.filter(e => e.event_type === 'FILE_DOWNLOAD').length + (currentEvent.event_type === 'FILE_DOWNLOAD' ? 1 : 0);
    const denied15m = events15m.filter(e => e.event_type === 'ACCESS_DENIED' || e.status === 'FAILURE').length + (currentEvent.status === 'FAILURE' ? 1 : 0);

    const resourceSet = new Set(events1h.map(e => e.resource_id));
    if (currentEvent.resource_id) resourceSet.add(currentEvent.resource_id);
    const uniqueResources1h = resourceSet.size;

    const eventHour = new Date(currentEvent.timestamp || Date.now()).getHours();
    const timeOffset = Math.abs(13 - eventHour);

    const baselineDailyDownloads = (baseline && baseline.avg_daily_downloads) ? baseline.avg_daily_downloads : 5.0;
    const downloadRatio = downloads15m / Math.max(1, baselineDailyDownloads);

    const modifications15m = events15m.filter(e => e.event_type === 'RECORD_MODIFY').length + (currentEvent.event_type === 'RECORD_MODIFY' ? 1 : 0);

    return [
      logins1h,
      downloads15m,
      denied15m,
      uniqueResources1h,
      timeOffset,
      parseFloat(downloadRatio.toFixed(2)),
      modifications15m
    ];
  }

  /**
   * Predicts anomaly score using built-in Isolation Forest or Python ML microservice
   */
  static async predictAnomaly(currentEvent, recentEvents = [], baseline = {}) {
    const featureVector = this.extractFeatureVector(currentEvent, recentEvents, baseline);

    if (config.mlEngineMode === 'python_service') {
      try {
        const response = await fetch(`${config.pythonMlServiceUrl}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feature_vector: featureVector, event: currentEvent })
        });
        if (response.ok) {
          const result = await response.json();
          return {
            anomalyScore: result.anomaly_score,
            isAnomaly: result.is_anomaly,
            model: 'scikit-learn IsolationForest (Python Microservice)',
            features: featureVector
          };
        }
      } catch (err) {
        console.warn('Python ML service unreachable, falling back to embedded Isolation Forest:', err.message);
      }
    }

    const model = this.getModel();
    const anomalyScore = model.scorePoint(featureVector);
    const isAnomaly = anomalyScore >= 0.60;

    return {
      anomalyScore,
      isAnomaly,
      model: 'Isolation Forest (Embedded UBA Engine)',
      features: {
        logins_1h: featureVector[0],
        downloads_15m: featureVector[1],
        denied_15m: featureVector[2],
        unique_resources_1h: featureVector[3],
        time_offset_from_peak: featureVector[4],
        download_ratio_to_baseline: featureVector[5],
        modifications_15m: featureVector[6]
      }
    };
  }
}

module.exports = MLEngine;
