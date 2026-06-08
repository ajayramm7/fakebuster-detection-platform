# FakeBuster: Advanced Fake News & Spam Detection Platform

![Platform Overview](https://img.shields.io/badge/Platform-MERN%20%2B%20Python%20ML-blue.svg)
![Status](https://img.shields.io/badge/Status-Active-success.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

FakeBuster is a robust, full-stack application designed to automatically detect fake news and spam content using trained Machine Learning models. Built with a scalable microservices architecture, it features a seamless MERN (MongoDB, Express, React, Node.js) stack coupled with a high-performance Python ML microservice.

## 🌟 Key Features

* **Real-time Detection:** Single fake-news and spam prediction with lightning-fast API responses.
* **Batch Processing:** CSV batch prediction for analyzing large datasets at once, with downloadable prediction CSVs.
* **Deep Insights:** Detailed risk scores, risk levels, signal words, and short explanations for every prediction.
* **Safety Tips:** Actionable safety tips generated for real-world usefulness.
* **Prediction History:** Full MongoDB-ready persistence for tracking and auditing previous analyses.
* **Feedback Loop:** Interactive feedback capture to support continuous future model improvements.

## 🏗️ Architecture

FakeBuster utilizes a modern, decoupled architecture:

```text
React (Dashboard) -> Express API -> Python ML Service -> Scikit-Learn Models
                          |
                          v
        MongoDB (Prediction History & Feedback)
```

### Components

1. **`client/`**: React + Vite dashboard offering a modern, responsive user interface.
2. **`server/`**: Node.js + Express API acting as the central gateway and handling MongoDB persistence.
3. **`ml-service/`**: Python Flask microservice that efficiently loads and serves the pre-trained `scikit-learn` (`.pkl`) models.
4. **`models/`**: Stores the machine learning models and vectorizers.

## 🚀 Getting Started

### Prerequisites

* Node.js (v16+)
* Python 3.8+
* MongoDB (Local or Atlas)

### Local Setup

1. **Clone the repository & navigate to the project directory:**
   ```bash
   git clone <your-github-repo-url>
   cd fakebuster-detection-platform
   ```

2. **Set up the Python Machine Learning Environment:**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   python -m pip install -r ml-service\requirements.txt
   ```

3. **Install Node.js Dependencies:**
   ```powershell
   npm install
   npm run install:all
   ```

4. **Configure Environment Variables:**
   Copy the example environment files and adjust if necessary (e.g., adding your MongoDB URI).
   ```powershell
   Copy-Item server\.env.example server\.env
   Copy-Item client\.env.example client\.env
   ```
   *Note: If `MONGO_URI` is left empty in `server\.env`, the API will use an in-memory store for demonstration purposes.*

### Running the Application

Start all services simultaneously with a single command from the root directory:

```powershell
npm run dev
```

**Services will be available at:**
* **React Client:** `http://127.0.0.1:5173`
* **Express API:** `http://localhost:5051/api`
* **ML Service:** `http://127.0.0.1:5055`

*Tip: The first startup may take slightly longer as Vite prepares dependencies. Subsequent starts will be much faster.*

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License

This project is open-sourced under the MIT License.
