# FakeBuster ML Service

This service loads the existing scikit-learn `.pkl` models from the project root and exposes prediction endpoints for the MERN backend.

## Run

```powershell
cd D:\FakeNews_Spam_Project\fakebuster-mern
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r ml-service\requirements.txt
.\venv\Scripts\python.exe ml-service\app.py
```

The service runs on `http://127.0.0.1:5055`.

Keep this terminal open while using the MERN app.

If you see `InconsistentVersionWarning` from scikit-learn, the service is still running. The saved `.pkl` models were trained with scikit-learn `1.6.1`, while the current environment may use another version. For a class project demo, you can continue. For the cleanest production setup, recreate the virtual environment with Python 3.12 and install the same scikit-learn version used during training.

Quick health check in another PowerShell window:

```powershell
Invoke-RestMethod http://127.0.0.1:5055/health
```

## Endpoints

- `GET /health`
- `POST /predict`
- `POST /predict-batch`
