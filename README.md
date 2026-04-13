# 👗 Virtual Try-On Application

A full-stack AI-powered web application that allows users to virtually try on clothes by uploading their image and selecting garments. The system uses deep learning models like **VITON / ALIAS** to generate realistic try-on results.

---

## 🚀 Features

* 📸 Upload user image
* 👕 Select clothing item
* 🤖 AI-based virtual try-on using deep learning
* ⚡ Real-time processing via Flask backend
* 🎨 Modern and responsive UI (React)
* 📂 Organized dataset handling (pose, mask, parse)
* 🖼️ Generated output preview

---

## 🛠️ Tech Stack

### 🌐 Frontend

* React.js
* CSS (Custom UI with gradients & modern styling)
* Axios (API communication)

### 🔙 Backend

* Flask (Python)
* REST API Integration

### 🧠 Machine Learning

* VITON / ALIAS Model
* PyTorch
* OpenCV
* Image Processing Techniques

---

## 📂 Project Structure

```
virtual-tryon/
│
├── frontend/               # React application
│   ├── src/
│   ├── public/
│
├── backend/                # Flask backend
│   ├── app.py
│   ├── uploads/
│   ├── static/results/
│
├── model/                  # ML model & scripts
│   ├── test.py
│   ├── datasets/
│
├── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/virtual-tryon.git
cd virtual-tryon
```

---

### 2️⃣ Setup Frontend

```bash
cd frontend
npm install
npm start
```

👉 Runs on: `http://localhost:3000`

---

### 3️⃣ Setup Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

👉 Runs on: `http://localhost:5000`

---

### 4️⃣ Setup Machine Learning Model

Make sure:

* Dataset is placed correctly (test images, pose, mask, parse)
* Pretrained checkpoints are available

Run:

```bash
cd model
python test.py
```

---

## 🔄 Workflow

1. User uploads an image
2. Selects a clothing item
3. Backend sends data to ML model
4. Model processes:

   * Pose
   * Segmentation
   * Cloth warping
5. Final try-on image is generated
6. Result displayed on UI

---

## 📸 Screenshots
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/db228d64-f5ed-449c-a162-cd757739ad0e" />

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/b92eec38-5f1a-412f-84e3-f7655d5f8f8f" />

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/c879a2ef-d9b3-410e-bdd7-7901a560bee1" />

---

## 🧪 Model Details

* Uses **VITON / ALIAS architecture**
* Handles:

  * Cloth warping (GMM)
  * Segmentation (Parse maps)
  * Image synthesis

---

## 🧠 Future Enhancements

* 🧾 Try-on History Feature
* ☁️ Cloud Deployment (AWS / GCP)
* 🎯 Better model accuracy & speed
* 🛍️ Multiple clothing categories

---

## 🐞 Known Issues

* Model processing may take time on CPU
* Requires proper dataset alignment
* High GPU recommended for faster results

---

## 🤝 Contributing

Contributions are welcome!

Steps:

1. Fork the repository
2. Create your feature branch

   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes

   ```bash
   git commit -m "Added feature"
   ```
4. Push to branch

   ```bash
   git push origin feature-name
   ```
5. Open a Pull Request

---

## 📜 License

This project is for educational and research purposes.
