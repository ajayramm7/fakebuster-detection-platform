export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
export const ASSET_BASE = API_URL.replace(/\/api\/?$/, "");

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export async function fetchHealth() {
  const response = await fetch(`${API_URL}/health`);
  return parseResponse(response);
}

export async function fetchHistory() {
  const response = await fetch(`${API_URL}/predictions?limit=20`);
  return parseResponse(response);
}

export async function predictText(payload) {
  const response = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
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

  const response = await fetch(`${API_URL}/predict/batch`, {
    method: "POST",
    body: form
  });
  return parseResponse(response);
}

export async function submitFeedback(payload) {
  const response = await fetch(`${API_URL}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
}
