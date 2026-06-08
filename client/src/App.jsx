import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  HelpCircle,
  History,
  Loader2,
  MailWarning,
  Newspaper,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Upload
} from "lucide-react";

import {
  API_URL,
  fetchHealth,
  fetchHistory,
  predictBatch,
  predictText,
  submitFeedback
} from "./services.js";

const TASKS = {
  fake_news: {
    label: "Fake News",
    icon: Newspaper,
    placeholder: "Paste a headline, article paragraph, or claim...",
    sample: "Breaking: secret cure discovered overnight by unknown doctors"
  },
  spam: {
    label: "Spam",
    icon: MailWarning,
    placeholder: "Paste an email, SMS, or chat message...",
    sample: "Congratulations, you won a free prize. Click now to claim."
  }
};

const tabs = [
  { id: "single", label: "Single", icon: Search },
  { id: "batch", label: "CSV", icon: FileSpreadsheet },
  { id: "history", label: "History", icon: History }
];

function riskTone(level) {
  if (level === "high") return "danger";
  if (level === "medium") return "warning";
  if (level === "low") return "success";
  return "neutral";
}

function taskLabel(task) {
  return TASKS[task]?.label || "Fake News";
}

function formatDate(value) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function ServiceBadge({ label, online }) {
  return (
    <span className={`service-badge ${online ? "online" : "offline"}`}>
      <span aria-hidden="true" />
      {label}
    </span>
  );
}

function ResultPanel({ result, onFeedback, feedbackLoading, loading }) {
  if (!result && !loading) return null;

  if (loading) {
    return (
      <section className="result-panel">
        <div className="skeleton" style={{ height: "32px", marginBottom: "16px" }} />
        <div className="skeleton" style={{ height: "20px", marginBottom: "24px", width: "80%" }} />
        <div className="skeleton" style={{ height: "60px", marginBottom: "16px" }} />
        <div className="skeleton" style={{ height: "20px", marginBottom: "8px" }} />
        <div className="skeleton" style={{ height: "20px", width: "60%" }} />
      </section>
    );
  }

  const tone = riskTone(result.riskLevel);
  const score = result.riskScore ?? 0;

  return (
    <section className={`result-panel ${tone}`}>
      <div className="result-heading">
        <div>
          <p className="eyebrow">Prediction</p>
          <h2>{result.label}</h2>
        </div>
        <span className="risk-badge">{result.riskLevel}</span>
      </div>

      <div className="score-row">
        <div className="score-value">{result.riskScore ?? "N/A"}%</div>
        <div className="score-track" aria-label="Risk score">
          <span style={{ width: `${Math.min(100, Math.max(0, score))}%`, transition: "width 0.6s ease" }} />
        </div>
      </div>

      <p className="result-copy">{result.explanation}</p>

      {!!result.signals?.length && (
        <div className="signals">
          {result.signals.map((signal) => (
            <span key={signal}>{signal}</span>
          ))}
        </div>
      )}

      <div className="safety-line">
        <ShieldCheck size={18} />
        <span>{result.safetyTip}</span>
      </div>

      <div className="feedback-row">
        <span>Feedback</span>
        <button type="button" onClick={() => onFeedback("correct")} disabled={feedbackLoading}>
          <ThumbsUp size={16} />
          Correct
        </button>
        <button type="button" onClick={() => onFeedback("wrong")} disabled={feedbackLoading}>
          <ThumbsDown size={16} />
          Wrong
        </button>
        <button type="button" onClick={() => onFeedback("unsure")} disabled={feedbackLoading}>
          <HelpCircle size={16} />
          Unsure
        </button>
      </div>
    </section>
  );
}

function BatchPreview({ batch }) {
  if (!batch?.preview?.length) return null;

  const columns = Object.keys(batch.preview[0]);

  return (
    <section className="table-panel">
      <div className="table-toolbar">
        <div>
          <p className="eyebrow">Batch Summary</p>
          <h2>{batch.summary.rows} rows analyzed</h2>
        </div>
        <a className="icon-button primary" href={`${API_URL}/downloads/${batch.download.id}`}>
          <Download size={18} />
          Download
        </a>
      </div>

      <div className="summary-strip">
        <span>Text column: {batch.summary.textColumn}</span>
        <span>High risk: {batch.summary.highRiskCount}</span>
        <span>{batch.download.fileName}</span>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batch.preview.map((row, index) => (
              <tr key={`${row.prediction || "row"}-${index}`}>
                {columns.map((column) => (
                  <td key={column}>{row[column]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function HistoryList({ items, onReanalyze }) {
  if (!items.length) {
    return (
      <section className="empty-panel">
        <History size={28} />
        <p>No prediction history yet.</p>
      </section>
    );
  }

  return (
    <section className="history-list">
      {items.map((item) => (
        <article 
          className="history-item" 
          key={item.id}
          onClick={() => onReanalyze?.(item)}
          title="Click to reanalyze"
        >
          <div className="history-main">
            <span className={`risk-dot ${riskTone(item.riskLevel)}`} />
            <div>
              <h3>{item.label}</h3>
              <p>
                {taskLabel(item.task)} · {item.source === "batch" ? item.fileName : item.inputText}
              </p>
            </div>
          </div>
          <div className="history-meta">
            <span>{item.riskScore ?? 0}%</span>
            <time>{formatDate(item.createdAt)}</time>
          </div>
        </article>
      ))}
    </section>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("single");
  const [task, setTask] = useState("fake_news");
  const [text, setText] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [threshold, setThreshold] = useState("");
  const [result, setResult] = useState(null);
  const [batch, setBatch] = useState(null);
  const [history, setHistory] = useState([]);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [textColumn, setTextColumn] = useState("");

  const ActiveTaskIcon = TASKS[task].icon;

  const metrics = useMemo(() => {
    const highRisk = history.filter((item) => item.riskLevel === "high").length;
    const batchRows = history
      .filter((item) => item.source === "batch")
      .reduce((total, item) => total + (item.rowCount || 0), 0);
    const feedback = history.filter((item) => item.feedback).length;
    return [
      { label: "Analyses", value: history.length, icon: Activity },
      { label: "High Risk", value: highRisk, icon: AlertTriangle },
      { label: "Batch Rows", value: batchRows, icon: FileSpreadsheet },
      { label: "Feedback", value: feedback, icon: Database }
    ];
  }, [history]);

  async function refresh() {
    const [healthData, historyData] = await Promise.all([fetchHealth(), fetchHistory()]);
    setHealth(healthData);
    setHistory(historyData.items || []);
  }

  useEffect(() => {
    refresh().catch((refreshError) => setError(refreshError.message));
  }, []);

  async function handlePredict(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await predictText({ task, text, threshold });
      setResult(data.result);
      await refresh();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBatch(event) {
    event.preventDefault();
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }

    setError("");
    setBatchLoading(true);

    try {
      const data = await predictBatch({ task, file, textColumn, threshold });
      setBatch(data);
      await refresh();
    } catch (batchError) {
      setError(batchError.message);
    } finally {
      setBatchLoading(false);
    }
  }

  async function handleFeedback(rating) {
    if (!result?.id) return;
    setFeedbackLoading(true);
    try {
      await submitFeedback({ predictionId: result.id, rating });
      await refresh();
    } catch (feedbackError) {
      setError(feedbackError.message);
    } finally {
      setFeedbackLoading(false);
    }
  }

  function useSample() {
    setText(TASKS[task].sample);
    setResult(null);
  }

  function handleReanalyze(historyItem) {
    if (historyItem.source === "single") {
      setTask(historyItem.task);
      setText(historyItem.inputText);
      setActiveTab("single");
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <img src="/banner.png" alt="FakeBuster" />
          <div>
            <h1>FakeBuster</h1>
            <p>Detection workspace</p>
          </div>
        </div>
        <div className="status-cluster">
          <ServiceBadge label="API" online={health?.api === "online"} />
          <ServiceBadge label="ML" online={health?.ml?.status === "ok"} />
          <button className="icon-button ghost" type="button" onClick={() => refresh()}>
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="control-band">
          <div className="task-switcher" role="tablist" aria-label="Detection task">
            {Object.entries(TASKS).map(([key, meta]) => {
              const Icon = meta.icon;
              return (
                <button
                  className={task === key ? "active" : ""}
                  key={key}
                  type="button"
                  onClick={() => {
                    setTask(key);
                    setResult(null);
                  }}
                >
                  <Icon size={18} />
                  {meta.label}
                </button>
              );
            })}
          </div>

          <label className="threshold-control">
            <span>Risk threshold</span>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Default"
              value={threshold}
              onChange={(event) => setThreshold(event.target.value)}
            />
          </label>
        </section>

        <section className="metrics-grid">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div className="metric" key={metric.label}>
                <Icon size={20} />
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            );
          })}
        </section>

        <nav className="tabs" aria-label="Workspace sections">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                type="button"
                className={activeTab === tab.id ? "active" : ""}
                onClick={() => setActiveTab(tab.id)}
                key={tab.id}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {error && (
          <div className="error-banner">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {activeTab === "single" && (
          <section className="tool-grid">
            <form className="text-panel" onSubmit={handlePredict}>
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Single Analysis</p>
                  <h2>
                    <ActiveTaskIcon size={22} />
                    {TASKS[task].label}
                  </h2>
                </div>
                <button className="icon-button ghost" type="button" onClick={useSample}>
                  <CheckCircle2 size={17} />
                  Sample
                </button>
              </div>

              <div className="text-input-wrapper">
                <textarea
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value);
                    setCharCount(event.target.value.length);
                  }}
                  placeholder={TASKS[task].placeholder}
                  rows={10}
                />
                <span className="char-count">{charCount} chars</span>
              </div>

              <div className="form-actions">
                <button className="icon-button secondary" type="button" onClick={() => {
                  setText("");
                  setCharCount(0);
                }}>
                  <RefreshCw size={18} />
                  Clear
                </button>
                <button className="icon-button primary" type="submit" disabled={loading || !text.trim()}>
                  {loading ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
                  Analyze
                </button>
              </div>
            </form>

            <ResultPanel
              result={result}
              onFeedback={handleFeedback}
              feedbackLoading={feedbackLoading}
              loading={loading}
            />
          </section>
        )}

        {activeTab === "batch" && (
          <section className="batch-grid">
            <form className="upload-panel" onSubmit={handleBatch}>
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">CSV Analysis</p>
                  <h2>
                    <FileSpreadsheet size={22} />
                    Batch Prediction
                  </h2>
                </div>
              </div>

              <label className="file-drop" htmlFor="csvFile">
                <Upload size={24} />
                <span>{file ? file.name : "Choose CSV file"}</span>
              </label>
              <input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />

              <label className="field-label">
                <span>Text column</span>
                <input
                  type="text"
                  value={textColumn}
                  placeholder="Auto-detect"
                  onChange={(event) => setTextColumn(event.target.value)}
                />
              </label>

              <div className="form-actions">
                <button className="icon-button secondary" type="button" onClick={() => setFile(null)}>
                  <RefreshCw size={18} />
                  Clear
                </button>
                <button className="icon-button primary" type="submit" disabled={batchLoading || !file}>
                  {batchLoading ? <Loader2 className="spin" size={18} /> : <Upload size={18} />}
                  Analyze CSV
                </button>
              </div>
            </form>

            <BatchPreview batch={batch} />
          </section>
        )}

        {activeTab === "history" && <HistoryList items={history} onReanalyze={handleReanalyze} />}
      </main>
    </div>
  );
}
