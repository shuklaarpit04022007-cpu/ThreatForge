from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import os

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "Backend is running 🚀"

def analyze_message(message):
    message_lower = message.lower()

    score = 0
    reasons = []

    keywords = [
        "urgent", "verify", "account", "password",
        "click", "login", "bank", "otp",
        "suspended", "limited time", "security alert"
    ]

    for word in keywords:
        if word in message_lower:
            score += 10
            reasons.append(f"Contains '{word}'")

    if re.search(r"http[s]?://", message_lower):
        score += 20
        reasons.append("Contains a link")

    if "!" in message:
        score += 5
        reasons.append("Uses urgency (!)")

    if "immediately" in message_lower or "now" in message_lower:
        score += 10
        reasons.append("Creates urgency")

    if "@" in message and "." in message:
        score += 5
        reasons.append("Contains email-like pattern")

    verdict = "Phishing" if score >= 40 else "Safe"

    return {
        "verdict": verdict,
        "score": min(score, 100),
        "reason": ", ".join(reasons) if reasons else "No strong phishing signals"
    }

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    message = data.get("message", "")

    if not message:
        return jsonify({
            "verdict": "Error",
            "score": 0,
            "reason": "Empty message"
        })

    return jsonify(analyze_message(message))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)