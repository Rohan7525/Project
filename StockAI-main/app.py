from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import yfinance as yf
import pandas as pd
import numpy as np

# Initialize app
app = Flask(__name__)
CORS(app)

# ===== LOAD MODELS =====
model_5d = pickle.load(open("rf_5d.pkl", "rb"))
model_20d = pickle.load(open("rf_20d.pkl", "rb"))
model_120d = pickle.load(open("rf_120d.pkl", "rb"))
scaler = pickle.load(open("scaler.pkl", "rb"))

# ===== FEATURE GENERATION =====
def get_features(stock):
    df = yf.download(stock, period="1y", interval="1d")

    if df.empty:
        return None

    # Handle multi-index columns (sometimes happens in yfinance)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    df = df.reset_index()

    df['close'] = df['Close']
    df['volume'] = df['Volume']

    df['return'] = df['close'].pct_change()
    df['ma50'] = df['close'].rolling(50).mean()
    df['ma200'] = df['close'].rolling(200).mean()

    df['rsi'] = 100 - (100 / (1 + df['close'].pct_change().rolling(14).mean()))
    df['macd'] = df['close'].ewm(span=12).mean() - df['close'].ewm(span=26).mean()

    df['volatility'] = df['return'].rolling(10).std()
    df['momentum'] = df['close'] / df['close'].shift(10) - 1

    df['return_lag1'] = df['return'].shift(1)
    df['rsi_lag1'] = df['rsi'].shift(1)

    df.dropna(inplace=True)

    if df.empty:
        return None

    latest = df.iloc[-1]

    features = [
        'return_lag1', 'rsi', 'rsi_lag1',
        'ma50', 'ma200', 'macd',
        'volatility', 'momentum',
        'volume'
    ]

    X = latest[features].values.reshape(1, -1)
    return scaler.transform(X)

# ===== PREDICT =====
def predict_model(model, X):
    pred = model.predict(X)[0]
    prob = model.predict_proba(X)[0]

    confidence = float(max(prob))
    action = "BUY" if pred == 1 else "SELL"

    return action, round(confidence * 100, 2)

# ===== FINAL DECISION =====
def final_decision(a5, a20, a120):
    actions = [a5, a20, a120]

    if actions.count("BUY") >= 2:
        return "BUY"
    elif actions.count("SELL") >= 2:
        return "SELL"
    else:
        return "UNCERTAIN"

# ===== API =====
@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    stock = data.get("stock", "").upper()

    if not stock:
        return jsonify({"error": "Stock symbol is required"}), 400

    try:
        X = get_features(stock)

        if X is None:
            return jsonify({"error": "Invalid stock or insufficient data"}), 400

        a5, c5 = predict_model(model_5d, X)
        a20, c20 = predict_model(model_20d, X)
        a120, c120 = predict_model(model_120d, X)

        final = final_decision(a5, a20, a120)

        return jsonify({
            "stock": stock,
            "predictions": {
                "1W": {"action": a5, "confidence": c5},
                "1M": {"action": a20, "confidence": c20},
                "6M": {"action": a120, "confidence": c120}
            },
            "final": final
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===== RUN SERVER =====
if __name__ == "__main__":
    app.run(debug=True)