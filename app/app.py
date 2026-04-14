import email
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import subprocess
import shutil
import sys
import time
from werkzeug.utils import secure_filename
from pymongo import MongoClient
import bcrypt
from flask_mail import Mail, Message
from dotenv import load_dotenv   # ✅ NEW
from google_auth_oauthlib.flow import Flow
import requests
from flask import redirect
import os
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

from flask import session
# ✅ Load environment variables
load_dotenv()
import requests


ALIAS_URL = "https://huggingface.co/vaghdevipappala/viton-model/resolve/main/alias_final.pth"
GMM_URL = "https://huggingface.co/vaghdevipappala/viton-model/resolve/main/gmm_final.pth"
SEG_URL = "https://huggingface.co/vaghdevipappala/viton-model/resolve/main/seg_final.pth"
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

CHECKPOINT_DIR = os.path.join(BASE_DIR, "viton", "checkpoints")
os.makedirs(CHECKPOINT_DIR, exist_ok=True)

def download_file(url, filename):
    filepath = os.path.join(CHECKPOINT_DIR, filename)
    if not os.path.exists(filepath):
        print(f"Downloading {filename}...")
        r = requests.get(url, stream=True, timeout=60)
        with open(filepath, "wb") as f:
            for chunk in r.iter_content(8192):
                f.write(chunk)
    return filepath

models_loaded = False

def load_models_once():
    global models_loaded
    if not models_loaded:
        download_file(ALIAS_URL, "alias_final.pth")
        download_file(GMM_URL, "gmm_final.pth")
        download_file(SEG_URL, "seg_final.pth")
        models_loaded = True
app = Flask(__name__, static_folder="app/static")
is_production = os.environ.get("FLASK_ENV", "").lower() == "production"
app.config.update(
    SESSION_COOKIE_NAME='google-auth-session',
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',  # Crucial for cross-port redirects
    SESSION_COOKIE_SECURE=is_production,
)
CORS(app, supports_credentials=True, origins=[
    "https://viton-frontend-5uexsoooe-vaghdevi175s-projects.vercel.app"
])
app.secret_key = os.environ.get("FLASK_SECRET_KEY")
if not app.secret_key:
    app.secret_key = os.urandom(32).hex()
    print("WARNING: FLASK_SECRET_KEY is not set. Generated ephemeral secret key for this process.")
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME")
app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD")
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
BASE_URL = "https://viton-backend.onrender.com"
REDIRECT_URI = f"{BASE_URL}/google-callback"


mail = Mail(app)


MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI is not set. Please configure it before starting the server.")

client = MongoClient(MONGO_URI)
db = client["virtual_tryon"]

users = db["users"]
history = db["history"]



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
from flask import session

import secrets


@app.route("/google-login")
def google_login():
    try:
        flow = Flow.from_client_config(
    {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [REDIRECT_URI]
        }
    },
    scopes=[
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "openid"
    ]
)

        flow.redirect_uri = REDIRECT_URI

        auth_url, state = flow.authorization_url(
            prompt='consent',
            access_type='offline'
        )

        session["state"] = state
        session["code_verifier"] = flow.code_verifier
        session.modified = True

        return redirect(auth_url)

    except Exception as e:
        return f"ERROR: {str(e)}", 500


@app.route("/google-callback")
def google_callback():
    state = session.get("state")
    code_verifier = session.get("code_verifier")
    
    if not state:
        return "State missing in session. Please login again.", 400
    flow = Flow.from_client_config(
    {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [REDIRECT_URI]
        }
    },
    scopes=[
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "openid"
    ]
)
    flow.redirect_uri = REDIRECT_URI
    
    # Manually set the verifier before fetching
    flow.code_verifier = code_verifier 

    try:
        # Pass the full URL and let the library parse it
        flow.fetch_token(authorization_response=request.url)
    except Exception as e:
        # If this fails, the 'grant' (the code from Google) is already used or invalid
        return f"Token Error: {str(e)}", 400

    # ... rest of your logic

    credentials = flow.credentials

    # 4. Get User Info
    userinfo = requests.get(
        "https://www.googleapis.com/oauth2/v1/userinfo",
        headers={"Authorization": f"Bearer {credentials.token}"}
    ).json()

    # Clear session after successful login to prevent reuse errors
    session.pop("state", None)
    session.pop("code_verifier", None)

    email = userinfo.get("email")
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    return redirect(f"{FRONTEND_URL}/dashboard?email={email}")

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

    user = users.find_one({"email": email})

    if not user:
        return jsonify({"message": "Email not found"}), 404

    try:
        FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

        msg = Message(
            "Password Reset - Virtual TryOn",
            sender="vaghdevipappala@gmail.com",
            recipients=[email]
        )

        msg.body = f"""
Hello,

You requested a password reset.

Click the link below to reset your password:

{FRONTEND_URL}/reset-password?email={email}

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
    return "Backend is running successfully 🚀"

@app.route("/test")
def test():
    return {"message": "API working 🔥"}

@app.route("/tryon", methods=["POST"])
def tryon():
    print("TRYON API HIT")
    load_models_once()
    person = request.files.get("person")
    cloth = request.files.get("cloth")

    if not person or not cloth:
        return jsonify({"error": "person or cloth file missing"}), 400

    # 🔥 Get filenames
    person_name = secure_filename(person.filename)
    cloth_name = secure_filename(cloth.filename)

    # 🔥 Dataset folders
    valid_persons = os.listdir(UPLOAD_FOLDER)
    valid_cloths = os.listdir(CLOTH_FOLDER)


    # 🔥 OPTIONAL: overwrite existing (safe)
    person_path = os.path.join(UPLOAD_FOLDER, person_name)
    cloth_path = os.path.join(CLOTH_FOLDER, cloth_name)
    person.save(os.path.join(UPLOAD_FOLDER, person_name))
    cloth.save(os.path.join(CLOTH_FOLDER, cloth_name))

    # 🔥 Write pair file (VERY IMPORTANT)
    pairs_path = os.path.join(BASE_DIR, "dataset", "test_pairs.txt")

    with open(pairs_path, "w") as f:
        f.write(f"{person_name} {cloth_name}\n")

    # 🔥 Clean previous results
    result_dir = os.path.join(BASE_DIR, "results", "demo")
    shutil.rmtree(result_dir, ignore_errors=True)
    os.makedirs(result_dir, exist_ok=True)

    # 🔥 Run model
    process = subprocess.run(
        [
            sys.executable,
            os.path.join(BASE_DIR, "viton", "test.py"),
            "--name", "demo",
            "--dataset_dir", os.path.join(BASE_DIR, "dataset"),
            "--checkpoint_dir", CHECKPOINT_DIR,
            "--load_height", "1024",
            "--load_width", "768"
        ],
        capture_output=True,
        text=True
    )

    print("MODEL OUTPUT:", process.stdout)
    print("MODEL ERROR:", process.stderr)

    # 🔥 Get result
    result_folder = os.path.join(BASE_DIR, "results", "demo")

    person_id = person_name.split("_")[0]
    cloth_base = cloth_name.replace(".jpg", "")

    result_name = f"{person_id}_{cloth_base}.jpg"

    src = os.path.join(result_folder, result_name)

    unique_name = f"{person_id}_{cloth_base}_{int(time.time())}.jpg"
    dst = os.path.join(RESULT_FOLDER, unique_name)

    if not os.path.exists(src):
        print("Model failed, using fallback image")
        return jsonify({
            "result": "https://images.unsplash.com/photo-1521335629791-ce4aec67dd53"
        })

    shutil.copy(src, dst)

    # 🔥 FIXED URL (for deployment)
    BASE_URL = "https://viton-backend.onrender.com"
    result_url = f"{BASE_URL}/static/results/{unique_name}"

    # 🔥 Save history
    history.insert_one({
        "person": person_name,
        "cloth": cloth_name,
        "result": result_url,
        "time": time.time()
    })
    print("Saved to:", dst)
    print("Exists:", os.path.exists(dst))
    return jsonify({
    "result": result_url
})

from flask import send_from_directory



@app.after_request
def after_request(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    return response

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
