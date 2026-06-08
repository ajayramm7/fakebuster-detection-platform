import axios from "axios";

const baseURL = process.env.ML_SERVICE_URL || "http://127.0.0.1:5055";

const client = axios.create({
  baseURL,
  timeout: 20000
});

function normalizeMlError(error) {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.code === "ECONNREFUSED") {
    return "ML service is not running. Start it with: python ml-service\\app.py";
  }
  return error.message || "ML service request failed";
}

export async function getMlHealth() {
  try {
    const { data } = await client.get("/health");
    return data;
  } catch (error) {
    return {
      status: "offline",
      error: normalizeMlError(error)
    };
  }
}

export async function predictText({ task, text, threshold }) {
  try {
    const { data } = await client.post("/predict", { task, text, threshold });
    return data;
  } catch (error) {
    throw new Error(normalizeMlError(error));
  }
}

export async function predictBatch({ task, texts, threshold }) {
  try {
    const { data } = await client.post("/predict-batch", { task, texts, threshold });
    return data;
  } catch (error) {
    throw new Error(normalizeMlError(error));
  }
}
