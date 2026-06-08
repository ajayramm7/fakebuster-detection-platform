export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5051/api";
export const ASSET_BASE = API_URL.replace(/\/api\/?$/, "");
const DEFAULT_TIMEOUT_MS = 6000;
const HEALTH_TIMEOUT_MS = 2500;

async function request(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return parseResponse(response);
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Check that the API and ML service are running.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export async function fetchHealth() {
  return request(`${API_URL}/health`, {}, HEALTH_TIMEOUT_MS);
}

export async function fetchHistory() {
  return request(`${API_URL}/predictions?limit=20`, {}, HEALTH_TIMEOUT_MS);
}

export async function predictText(payload) {
  return request(`${API_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function predictBatch({ task, file, textColumn, threshold }) {
  const form = new FormData();
  form.append("task", task);
  form.append("file", file);
  if (textColumn) {
    form.append("textColumn", textColumn);
  }
  if (threshold !== "" && threshold != null) {
    form.append("threshold", threshold);
  }

  return request(`${API_URL}/predict/batch`, {
    method: "POST",
    body: form
  }, 20000);
}

export async function submitFeedback(payload) {
  return request(`${API_URL}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}
