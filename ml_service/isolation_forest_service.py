"""
Isolation Forest Machine Learning Microservice
Explainable Hybrid Framework for Insider Threat Detection
MCA Cybersecurity Major Project
"""

import os
import json
import numpy as np
from flask import Flask, request, jsonify

try:
    from sklearn.ensemble import IsolationForest
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

app = Flask(__name__)

# Global model state
model = None
feature_names = [
    'logins_1h',
    'downloads_15m',
    'denied_15m',
    'unique_resources_1h',
    'time_offset_from_peak',
    'download_ratio_to_baseline',
    'modifications_15m'
]

def init_model():
    global model
    if not SKLEARN_AVAILABLE:
        return
    # Train baseline IsolationForest on benign synthetic samples
    np.random.seed(42)
    normal_samples = np.random.normal(
        loc=[1.5, 3.0, 0.05, 5.0, 2.0, 1.0, 4.0],
        scale=[0.5, 1.5, 0.2, 1.5, 1.0, 0.3, 2.0],
        size=(500, 7)
    )
    # Clip negative values
    normal_samples = np.clip(normal_samples, 0, None)
    
    model = IsolationForest(
        n_estimators=100,
        max_samples=128,
        contamination=0.08,
        random_state=42
    )
    model.fit(normal_samples)
    print("✅ scikit-learn IsolationForest initialized and fitted on 500 baseline samples.")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ONLINE',
        'service': 'Python scikit-learn Isolation Forest ML Service',
        'sklearn_available': SKLEARN_AVAILABLE,
        'model_loaded': model is not None,
        'features': feature_names
    })

@app.route('/predict', methods=['POST'])
def predict():
    if not SKLEARN_AVAILABLE or model is None:
        return jsonify({'error': 'scikit-learn is not available in environment'}), 503

    data = request.get_json(force=True)
    feature_vector = data.get('feature_vector')

    if not feature_vector or len(feature_vector) != 7:
        return jsonify({'error': 'Expected 7-dimensional feature vector'}), 400

    X = np.array([feature_vector], dtype=float)
    # decision_function gives negative scores for outliers, positive for inliers
    raw_score = model.decision_function(X)[0]
    prediction = model.predict(X)[0] # -1 for anomaly, 1 for inlier

    # Calibrate to 0.0 (normal) to 1.0 (anomalous)
    # Typically raw_score is between -0.3 and +0.3
    normalized_anomaly_score = float(np.clip(0.5 - (raw_score * 1.6), 0.0, 1.0))

    return jsonify({
        'raw_decision_score': float(raw_score),
        'anomaly_score': round(normalized_anomaly_score, 4),
        'is_anomaly': bool(prediction == -1 or normalized_anomaly_score >= 0.60),
        'model': 'scikit-learn IsolationForest (v1.4+)',
        'feature_names': feature_names,
        'features_evaluated': feature_vector
    })

@app.route('/train', methods=['POST'])
def train():
    global model
    if not SKLEARN_AVAILABLE:
        return jsonify({'error': 'scikit-learn missing'}), 503

    data = request.get_json(force=True)
    training_data = data.get('training_data', [])
    if len(training_data) < 20:
        return jsonify({'error': 'Minimum 20 training samples required'}), 400

    X = np.array(training_data, dtype=float)
    model = IsolationForest(
        n_estimators=100,
        max_samples=min(256, len(training_data)),
        contamination=0.08,
        random_state=42
    )
    model.fit(X)

    return jsonify({
        'message': f'Model successfully retrained on {len(training_data)} samples.',
        'n_estimators': 100
    })

if __name__ == '__main__':
    init_model()
    port = int(os.environ.get('PORT', 5001))
    print(f"🐍 Python ML Microservice starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
