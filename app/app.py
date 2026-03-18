from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import subprocess
import shutil
import sys
import time
from werkzeug.utils import secure_filename
from pymongo import MongoClient
import bcrypt
from flask_mail import Mail, Message
app = Flask(__name__)
CORS(app)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = "vaghdevipappala@gmail.com"
app.config['MAIL_PASSWORD'] = "qpfj ghxh pmbb vmdg"

mail = Mail(app)


MONGO_URI = "mongodb+srv://admin:admin123@cluster0.ovje4uh.mongodb.net/virtual_tryon"

client = MongoClient(MONGO_URI)
db = client["virtual_tryon"]

users = db["users"]
history = db["history"]

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

UPLOAD_FOLDER = os.path.join(BASE_DIR, "dataset", "test", "image")
CLOTH_FOLDER = os.path.join(BASE_DIR, "dataset", "test", "cloth")
RESULT_FOLDER = os.path.join(BASE_DIR, "app", "static", "results")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CLOTH_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)
@app.route("/signup", methods=["POST"])
def signup():

    data = request.json
    email = data["email"]
    password = data["password"]

    existing_user = users.find_one({"email": email})

    if existing_user:
        return jsonify({"message": "User already exists"}), 400

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    users.insert_one({
        "email": email,
        "password": hashed
    })

    return jsonify({"message": "User created"})


@app.route("/login", methods=["POST"])
def login():

    data = request.json
    email = data["email"]
    password = data["password"]

    user = users.find_one({"email": email})

    if user and bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({
            "message": "Login successful",
            "email": email
        })
    else:
        return jsonify({"message": "Invalid credentials"}), 401


@app.route("/forgot-password", methods=["POST"])
def forgot_password():

    data = request.json
    email = data.get("email", "").strip()

    print("Email received:", email)

    user = users.find_one({"email": email})

    if not user:
        return jsonify({"message": "Email not found"}), 404

    try:
        msg = Message(
            "Password Reset - Virtual TryOn",
            sender="vaghdevipappala@gmail.com",
            recipients=[email]
        )

        msg.body = f"""
Hello,

You requested a password reset.

Click the link below to reset your password:

http://localhost:3000/reset-password

If you did not request this, please ignore this email.

Regards,
Virtual Try-On Team
"""

        mail.send(msg)

        return jsonify({"message": "Reset email sent"})

    except Exception as e:
        print("Mail error:", e)
        return jsonify({"message": "Email sending failed"}), 500

@app.route("/reset-password", methods=["POST"])
def reset_password():

    data = request.json

    email = data.get("email")
    new_password = data.get("password")

    if not email or not new_password:
        return jsonify({"message": "Missing data"}), 400

    user = users.find_one({"email": email})

    if not user:
        return jsonify({"message": "User not found"}), 404

    hashed = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt())

    users.update_one(
        {"email": email},
        {"$set": {"password": hashed}}
    )

    return jsonify({"message": "Password updated successfully"})


@app.route("/history", methods=["GET"])
def get_history():

    data = list(history.find({}, {"_id": 0}))

    return jsonify(data)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/tryon", methods=["POST"])
def tryon():
    print("TRYON API HIT")

    person = request.files.get("person")
    cloth = request.files.get("cloth")

    if not person or not cloth:
        return jsonify({"error": "person or cloth file missing"}), 400

    person_name = secure_filename(person.filename)
    cloth_name = secure_filename(cloth.filename)

    person_path = os.path.join(UPLOAD_FOLDER, person_name)
    cloth_path = os.path.join(CLOTH_FOLDER, cloth_name)

    person.save(person_path)
    cloth.save(cloth_path)

    pairs_path = os.path.join(BASE_DIR, "dataset", "test_pairs.txt")

    with open(pairs_path, "w") as f:
        f.write(f"{person_name} {cloth_name}\n")

    result_dir = os.path.join(BASE_DIR, "results", "demo")
    shutil.rmtree(result_dir, ignore_errors=True)
    os.makedirs(result_dir, exist_ok=True)

    process = subprocess.run(
    [
        sys.executable,
        os.path.join(BASE_DIR, "viton", "test.py"),
        "--name", "demo",
        "--dataset_dir", os.path.join(BASE_DIR, "dataset"),
        "--checkpoint_dir", os.path.join(BASE_DIR, "viton", "checkpoints"),
        "--load_height", "1024",
        "--load_width", "768"
    ],
    capture_output=True,
    text=True
)


    result_folder = os.path.join(BASE_DIR, "results", "demo")

    person_id = person_name.split("_")[0]
    cloth_base = cloth_name.replace(".jpg", "")

    result_name = f"{person_id}_{cloth_base}.jpg"

    src = os.path.join(result_folder, result_name)
    dst = os.path.join(RESULT_FOLDER, "output.jpg")

    if os.path.exists(src):
        shutil.copy(src, dst)

    result_url = f"http://localhost:5000/static/results/output.jpg?t={time.time()}"

    history.insert_one({
        "person": person_name,
        "cloth": cloth_name,
        "result": result_url,
        "time": time.time()
    })

    return jsonify({"result": result_url})




if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)