/* =============================================================================
   script.js - AI Model Selection Assistant (website)

   Part 1  MODEL_REFERENCE : copy of data/model_reference.csv
   Part 2  Vocabulary and scoring rules (same as R/functions.R)
   Part 3  Decision logic: pure functions with no page code (same as R)
   Part 4  Page code: shows the steps, cards and tables

   The decision logic is a JavaScript version of the R functions, so the
   GitHub Pages site works entirely in the browser (no server needed).
   No machine-learning model is trained or evaluated here.
   ============================================================================= */

"use strict";

/* ---------- PART 1: model reference data (mirrors data/model_reference.csv) ---------- */
const MODEL_REFERENCE = [
  {"model_id": "linear_regression", "model_name": "Linear Regression", "task_types": "regression", "data_direct": "numerical", "data_prep": "categorical;mixed", "size_small": "good", "size_medium": "good", "size_large": "good", "interpretability": "High", "speed": "Fast", "complexity": "Low", "performance_potential": "Low", "handles_nonlinear": "No", "baseline_friendly": "Yes", "main_strengths": "Very easy to understand and explain|Fast to train and predict|Makes a good simple baseline for predicting numbers", "main_considerations": "Assumes a mostly straight-line relationship|Sensitive to extreme values (outliers)|Categories must be converted to numbers first", "typical_use": "Predicting house prices or sales from a few numeric features", "prep_note": "Convert categories to numbers (for example one-hot encoding) before using this model."},
  {"model_id": "logistic_regression", "model_name": "Logistic Regression", "task_types": "classification;binary_classification", "data_direct": "numerical", "data_prep": "categorical;mixed;text", "size_small": "good", "size_medium": "good", "size_large": "good", "interpretability": "High", "speed": "Fast", "complexity": "Low", "performance_potential": "Medium", "handles_nonlinear": "No", "baseline_friendly": "Yes", "main_strengths": "Easy to interpret through feature weights|Fast to train and predict|Gives class probabilities and is a strong simple baseline", "main_considerations": "Decision boundary is a straight line unless features are engineered|May underperform when relationships are strongly non-linear|Inputs usually need scaling and encoding", "typical_use": "Predicting customer churn or spam from numeric features", "prep_note": "Encode categories as numbers; for text, convert words to numeric features such as word counts or TF-IDF."},
  {"model_id": "decision_tree", "model_name": "Decision Tree", "task_types": "classification;binary_classification;regression", "data_direct": "numerical;categorical;mixed", "data_prep": "", "size_small": "good", "size_medium": "good", "size_large": "ok", "interpretability": "High", "speed": "Fast", "complexity": "Low", "performance_potential": "Medium", "handles_nonlinear": "Yes", "baseline_friendly": "No", "main_strengths": "Easy to read as if-then rules|Can capture non-linear relationships|Handles mixed numeric and categorical data without scaling", "main_considerations": "Can overfit if the tree grows too deep|Small changes in the data can produce a different tree|May need depth or pruning limits", "typical_use": "Rule-based decisions such as loan approval or customer types", "prep_note": ""},
  {"model_id": "knn", "model_name": "K-Nearest Neighbors (KNN)", "task_types": "classification;binary_classification;regression", "data_direct": "numerical", "data_prep": "categorical;mixed", "size_small": "good", "size_medium": "ok", "size_large": "caution", "interpretability": "Medium", "speed": "Medium", "complexity": "Low", "performance_potential": "Medium", "handles_nonlinear": "Yes", "baseline_friendly": "Yes", "main_strengths": "Simple idea: look at the most similar records|No separate training step|Can follow non-linear patterns", "main_considerations": "Prediction becomes slow on large datasets|Needs feature scaling|Results depend on the choice of K and the distance measure", "typical_use": "Small datasets where similar records tend to have similar outcomes", "prep_note": "Scale numeric features and convert categories to numbers so that distances are meaningful."},
  {"model_id": "random_forest", "model_name": "Random Forest", "task_types": "classification;binary_classification;regression", "data_direct": "numerical;categorical;mixed", "data_prep": "", "size_small": "ok", "size_medium": "good", "size_large": "ok", "interpretability": "Low", "speed": "Medium", "complexity": "Medium", "performance_potential": "High", "handles_nonlinear": "Yes", "baseline_friendly": "No", "main_strengths": "Often strong predictive performance|Handles non-linear relationships and mixed data|Less prone to overfitting than a single tree", "main_considerations": "Harder to interpret than a single tree|Slower and larger than simple models|Needs enough data to build varied trees", "typical_use": "General-purpose prediction on tabular data", "prep_note": ""},
  {"model_id": "naive_bayes", "model_name": "Naive Bayes", "task_types": "classification;binary_classification", "data_direct": "numerical;categorical;text", "data_prep": "mixed", "size_small": "good", "size_medium": "good", "size_large": "good", "interpretability": "Medium", "speed": "Fast", "complexity": "Low", "performance_potential": "Medium", "handles_nonlinear": "No", "baseline_friendly": "Yes", "main_strengths": "Very fast and works with little data|Common starting point for text classification|Easy to implement", "main_considerations": "Assumes features are independent of each other|Probability estimates can be unreliable|Numeric features may need a distribution assumption", "typical_use": "Spam filtering and document classification", "prep_note": "Mixed data usually needs numeric features grouped into bins or categories first."},
  {"model_id": "kmeans", "model_name": "K-Means Clustering", "task_types": "clustering", "data_direct": "numerical", "data_prep": "mixed;text", "size_small": "ok", "size_medium": "good", "size_large": "good", "interpretability": "Medium", "speed": "Fast", "complexity": "Low", "performance_potential": "Medium", "handles_nonlinear": "No", "baseline_friendly": "Yes", "main_strengths": "Simple and fast|Easy to explain: records join the nearest cluster centre|Scales well to larger datasets", "main_considerations": "The number of clusters K must be chosen in advance|Prefers round, similar-sized clusters|Sensitive to feature scale and outliers", "typical_use": "Customer segmentation", "prep_note": "Convert to numeric features and scale them; for text, convert documents to numeric vectors first."},
  {"model_id": "hierarchical_clustering", "model_name": "Hierarchical Clustering", "task_types": "clustering", "data_direct": "numerical", "data_prep": "categorical;mixed", "size_small": "good", "size_medium": "ok", "size_large": "caution", "interpretability": "Medium", "speed": "Slow", "complexity": "Medium", "performance_potential": "Medium", "handles_nonlinear": "Partly", "baseline_friendly": "No", "main_strengths": "Produces a dendrogram that shows how groups merge|No need to fix the number of clusters in advance|Works with different distance measures", "main_considerations": "Slow and memory-heavy on large datasets|Merges cannot be undone|The linkage method affects the result", "typical_use": "Grouping a small set of items such as species or documents", "prep_note": "Choose a distance measure that suits your data and scale numeric features."},
  {"model_id": "isolation_forest", "model_name": "Isolation Forest", "task_types": "anomaly_detection", "data_direct": "numerical", "data_prep": "categorical;mixed", "size_small": "caution", "size_medium": "good", "size_large": "good", "interpretability": "Low", "speed": "Fast", "complexity": "Medium", "performance_potential": "Medium", "handles_nonlinear": "Yes", "baseline_friendly": "No", "main_strengths": "Designed specifically for finding unusual records|Fast on large datasets|Does not need labelled anomalies", "main_considerations": "Individual results are harder to explain|You must decide how many records count as unusual|Needs enough data to be meaningful", "typical_use": "Fraud screening or sensor fault detection", "prep_note": "Convert categories to numbers before using this model."},
  {"model_id": "zscore_outlier", "model_name": "Z-Score Outlier Detection", "task_types": "anomaly_detection", "data_direct": "numerical", "data_prep": "", "size_small": "ok", "size_medium": "good", "size_large": "good", "interpretability": "High", "speed": "Fast", "complexity": "Low", "performance_potential": "Low", "handles_nonlinear": "No", "baseline_friendly": "Yes", "main_strengths": "Very simple and fully explainable|Fast, with no training step|Good first check for numeric outliers", "main_considerations": "Assumes roughly bell-shaped data|Outliers can distort the average and spread|Looks at one feature at a time", "typical_use": "Spotting unusual values in a single measurement such as daily sales", "prep_note": ""}
];

/* ---------- PART 2: vocabulary and scoring rules ---------- */

const TASK_NAMES = {
  classification: "classification",
  binary_classification: "binary classification",
  regression: "regression",
  clustering: "clustering",
  anomaly_detection: "anomaly detection"
};

const TASK_LABELS = {
  classification: "Classification (predict a category)",
  binary_classification: "Binary classification (predict Yes/No)",
  regression: "Regression (predict a number)",
  clustering: "Clustering (group similar records)",
  anomaly_detection: "Anomaly detection (find unusual records)"
};

const DATA_NAMES = {
  numerical: "numerical", categorical: "categorical", mixed: "mixed", text: "text", image: "image"
};

const DATA_LABELS = {
  numerical: "Numerical",
  categorical: "Categorical",
  mixed: "Mixed (numbers and categories)",
  text: "Text",
  image: "Image"
};

const SIZE_LABELS = { small: "Small", medium: "Medium", large: "Large" };

const PRIORITY_LABELS = {
  easy: "Easy to understand",
  fast: "Fast training/prediction",
  interpretable: "Interpretability",
  performance: "Good performance",
  nonlinear: "Works with non-linear relationships",
  baseline: "Simple baseline model"
};

/* Plain-language help texts used only by the page (not by the scoring logic) */
const TASK_HELP = {
  classification: "Put each record into one of several groups, e.g. the type of a flower.",
  binary_classification: "A classification with only two answers, e.g. will a customer leave: yes or no.",
  regression: "Predict a number, e.g. the price of a house.",
  clustering: "Find groups of similar records when no groups are given in advance.",
  anomaly_detection: "Find records that look very different from the rest."
};
const DATA_HELP = {
  numerical: "Mostly numbers, e.g. age, price, temperature.",
  categorical: "Mostly labels, e.g. colour, city, yes/no.",
  mixed: "A table with both numbers and labels.",
  text: "Sentences or documents, e.g. emails or reviews.",
  image: "Photos or pictures."
};
const SIZE_HELP = {
  small: "A spreadsheet-sized dataset (roughly under 1,000 rows).",
  medium: "Roughly 1,000 to 100,000 rows.",
  large: "More than about 100,000 rows."
};
const PRIORITY_HELP = {
  easy: "The idea behind the model is simple to learn.",
  fast: "The model trains and predicts quickly.",
  interpretable: "You can explain why the model gave an answer.",
  performance: "The model has high potential for good predictions.",
  nonlinear: "The model can follow curved or complex patterns.",
  baseline: "A simple first model to compare other models against."
};

/* Keywords used to suggest a task type from the user's sentence */
const TASK_KEYWORDS = {
  binary_classification: ["whether", "yes or no", "yes/no", "true or false", "pass or fail", "churn",
    "leave", "spam", "will buy", "approve", "default"],
  classification: ["category", "categories", "type of", "which class", "classify", "label", "species",
    "kind of", "sentiment", "which one"],
  regression: ["price", "how much", "how many", "amount", "salary", "temperature", "forecast",
    "predict a number", "sales", "revenue", "cost", "value of", "estimate"],
  clustering: ["group", "segment", "cluster", "similar", "segmentation"],
  anomaly_detection: ["unusual", "anomaly", "anomalies", "outlier", "abnormal", "rare", "suspicious",
    "odd", "fraud"]
};

/* Scoring: every criterion is worth at most POINTS_MAX points.
   match score (%) = points earned / points possible * 100.
   It describes fit with the STATED requirements. It is not an accuracy value. */
const POINTS_MAX = 20;
const DATA_POINTS = { direct: 20, prep: 10 };
const SIZE_POINTS = { good: 20, ok: 10, caution: 0 };

const PRIORITY_RULES = {
  easy:          { column: "complexity",            scale: { Low: 20, Medium: 10, High: 0 } },
  fast:          { column: "speed",                 scale: { Fast: 20, Medium: 10, Slow: 0 } },
  interpretable: { column: "interpretability",      scale: { High: 20, Medium: 10, Low: 0 } },
  performance:   { column: "performance_potential", scale: { High: 20, Medium: 10, Low: 0 } },
  nonlinear:     { column: "handles_nonlinear",     scale: { Yes: 20, Partly: 10, No: 0 } },
  baseline:      { column: "baseline_friendly",     scale: { Yes: 20, No: 0 } }
};

const PRIORITY_TEXT = {
  easy: {
    full: "Easy to understand: low complexity level",
    half: "Moderately easy to understand: medium complexity level",
    zero: "Easy to understand: this model has a high complexity level" },
  fast: {
    full: "Fast training and prediction: rated fast",
    half: "Reasonable speed: rated medium",
    zero: "Fast training/prediction: this model is rated slow" },
  interpretable: {
    full: "Highly interpretable results",
    half: "Moderately interpretable results",
    zero: "Interpretability: results are harder to explain (rated low)" },
  performance: {
    full: "High predictive potential on suitable data",
    half: "Medium predictive potential",
    zero: "Performance: lower predictive potential than flexible models (rated low)" },
  nonlinear: {
    full: "Can capture non-linear relationships",
    half: "Can partly capture non-linear relationships",
    zero: "Non-linear relationships: mainly captures simple or straight-line patterns" },
  baseline: {
    full: "Suitable as a simple baseline model",
    half: "",
    zero: "Baseline: not usually the first simple baseline choice" }
};

const REMINDER_TEXT =
  "Reminder: this is guidance only. Train and evaluate the candidate models on your real " +
  "dataset (for example with cross-validation) before making a final modelling decision.";

/* ---------- PART 3: decision logic (mirrors R/functions.R) ---------- */

/* "a;b|c" -> ["a","b","c"]; empty text -> [] */
function splitField(x) {
  if (x === null || x === undefined || x === "") return [];
  return String(x).split(/[;|]/).map(function (s) { return s.trim(); });
}

function isBlank(x) {
  return x === null || x === undefined || String(x).trim() === "";
}

function joinNames(list) {
  return list.length === 0 ? "none" : list.join(", ");
}

function canonicalPriorities(priorities) {
  return Object.keys(PRIORITY_RULES).filter(function (k) { return (priorities || []).indexOf(k) !== -1; });
}

/* Understand the problem: suggest a task type from a sentence */
function suggestTask(text) {
  if (isBlank(text)) {
    return { status: "empty", tasks: [], matched: [], message: "Please describe your problem first." };
  }
  const lower = String(text).toLowerCase();
  const hits = {};
  const matched = {};
  Object.keys(TASK_KEYWORDS).forEach(function (task) {
    matched[task] = TASK_KEYWORDS[task].filter(function (word) { return lower.indexOf(word) !== -1; });
    hits[task] = matched[task].length;
  });
  const best = Math.max.apply(null, Object.keys(hits).map(function (k) { return hits[k]; }));
  if (best === 0) {
    return { status: "none", tasks: [], matched: [],
      message: "No task type could be suggested from this description. Please choose a task type yourself." };
  }
  const top = Object.keys(hits).filter(function (k) { return hits[k] === best; });
  if (top.length > 1) {
    return { status: "ambiguous", tasks: top, matched: [],
      message: "This description could fit more than one task type (" +
        top.map(function (t) { return TASK_NAMES[t]; }).join(", ") + "). Please choose one yourself." };
  }
  return { status: "suggested", tasks: top, matched: matched[top[0]],
    message: "Suggested task type: " + TASK_LABELS[top[0]] + ". Matched words: " +
      matched[top[0]].join(", ") + "." };
}

/* Check the inputs. Priorities are optional but must be known values. */
function validateInput(task, dataType, size, priorities) {
  const errors = [];
  if (isBlank(task)) errors.push("Please select a task type.");
  else if (!(task in TASK_LABELS)) errors.push("Task type '" + task + "' is not recognised.");

  if (isBlank(dataType)) errors.push("Please select a data type.");
  else if (!(dataType in DATA_LABELS)) errors.push("Data type '" + dataType + "' is not recognised.");

  if (isBlank(size)) errors.push("Please select a dataset size.");
  else if (!(size in SIZE_LABELS)) errors.push("Dataset size '" + size + "' is not recognised.");

  (priorities || []).forEach(function (p) {
    if (!(p in PRIORITY_LABELS)) errors.push("Priority '" + p + "' is not recognised.");
  });
  return { valid: errors.length === 0, errors: errors };
}

function supportsTask(model, task) {
  return splitField(model.task_types).indexOf(task) !== -1;
}

/* "direct", "prep" (needs preparation) or "none" */
function getDataFit(model, dataType) {
  if (splitField(model.data_direct).indexOf(dataType) !== -1) return "direct";
  if (splitField(model.data_prep).indexOf(dataType) !== -1) return "prep";
  return "none";
}

function findCandidates(ref, task, dataType) {
  const found = [];
  ref.forEach(function (model) {
    if (!supportsTask(model, task)) return;
    const fit = getDataFit(model, dataType);
    if (fit === "none") return;
    found.push({ model: model, fit: fit });
  });
  return found;
}

/* Explains the filtering steps (the "analysis" step) */
function analysisTrace(ref, task, dataType, nPriorities) {
  const withTask = [], direct = [], prep = [], excluded = [];
  ref.forEach(function (model) {
    if (!supportsTask(model, task)) return;
    withTask.push(model.model_name);
    const fit = getDataFit(model, dataType);
    if (fit === "direct") direct.push(model.model_name);
    else if (fit === "prep") prep.push(model.model_name);
    else excluded.push(model.model_name);
  });
  const kept = direct.length + prep.length;
  const maxPoints = 2 * POINTS_MAX + POINTS_MAX * nPriorities;
  return [
    "Step 1 - Task filter: " + withTask.length + " model(s) support " + TASK_NAMES[task] + ": " +
      joinNames(withTask) + ".",
    "Step 2 - Data check: " + kept + " of " + withTask.length + " model(s) can use " +
      DATA_NAMES[dataType] + " data. Directly: " + joinNames(direct) + ". After preparation: " +
      joinNames(prep) + ". Not suitable: " + joinNames(excluded) + ".",
    "Step 3 - Scoring: each remaining model earns points for data fit (max " + POINTS_MAX +
      "), dataset size fit (max " + POINTS_MAX + ") and each selected priority (max " + POINTS_MAX +
      " each). Maximum points for this analysis: " + maxPoints + "."
  ];
}

/* Match points and explanation for ONE candidate */
function evaluateModel(model, fit, task, dataType, size, priorities) {
  priorities = canonicalPriorities(priorities);

  let points = DATA_POINTS[fit];
  const sizeRating = model["size_" + size];
  points += SIZE_POINTS[sizeRating];

  const reasons = ["Suitable for " + TASK_NAMES[task]];
  if (fit === "direct") reasons.push("Works directly with " + DATA_NAMES[dataType] + " data");
  if (fit === "prep") reasons.push("Can work with " + DATA_NAMES[dataType] + " data after preparation");
  if (sizeRating === "good") reasons.push("Suits a " + size + " dataset");
  if (sizeRating === "ok") reasons.push("Usable with a " + size + " dataset");

  const considerations = splitField(model.main_considerations);
  if (fit === "prep") considerations.push("Data preparation needed: " + model.prep_note);
  if (sizeRating === "caution") considerations.push("Dataset size: may be a poor fit for a " + size + " dataset");
  if (sizeRating === "ok") considerations.push("Dataset size: usable for a " + size + " dataset, but with some limits");

  const priorityNotes = [];
  priorities.forEach(function (key) {
    const rule = PRIORITY_RULES[key];
    const earned = rule.scale[model[rule.column]];
    points += earned;
    if (earned === POINTS_MAX) reasons.push(PRIORITY_TEXT[key].full);
    else if (earned > 0) reasons.push(PRIORITY_TEXT[key].half);
    else priorityNotes.push(PRIORITY_TEXT[key].zero);
  });
  priorityNotes.forEach(function (n) { considerations.push(n); });

  const possible = 2 * POINTS_MAX + POINTS_MAX * priorities.length;
  const score = Math.floor(points / possible * 100 + 0.5);

  return {
    model_id: model.model_id, model_name: model.model_name, data_fit: fit,
    points: points, possible: possible, score: score,
    reasons: reasons, strengths: splitField(model.main_strengths),
    considerations: considerations, info: model
  };
}

/* Evaluate all candidates; highest score first, ties ordered by model_id */
function rankModels(candidates, task, dataType, size, priorities) {
  const results = candidates.map(function (c) {
    return evaluateModel(c.model, c.fit, task, dataType, size, priorities);
  });
  results.sort(function (a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return a.model_id < b.model_id ? -1 : (a.model_id > b.model_id ? 1 : 0);
  });
  return results;
}

/* Side-by-side comparison; at least two different models are required */
function compareModels(results, ids) {
  const unique = ids.filter(function (id, i) { return ids.indexOf(id) === i; });
  if (unique.length < 2) {
    return { valid: false, table: null, error: "Please select at least two models to compare." };
  }
  const available = results.map(function (r) { return r.model_id; });
  for (let i = 0; i < unique.length; i++) {
    if (available.indexOf(unique[i]) === -1) {
      return { valid: false, table: null, error: "Model '" + unique[i] + "' is not in the candidate list." };
    }
  }
  const table = results.filter(function (r) { return unique.indexOf(r.model_id) !== -1; })
    .map(function (r) {
      return {
        Model: r.model_name,
        Task: splitField(r.info.task_types).map(function (t) { return TASK_NAMES[t]; }).join(", "),
        MainStrength: r.strengths[0],
        MainConsideration: splitField(r.info.main_considerations)[0],
        Interpretability: r.info.interpretability,
        Speed: r.info.speed,
        TypicalUse: r.info.typical_use,
        MatchScore: r.score + "%"
      };
    });
  return { valid: true, error: "", table: table };
}

function noCandidateMessage(task, dataType) {
  const base = "No model in the reference library supports " + TASK_NAMES[task] + " with " +
    DATA_NAMES[dataType] + " data.";
  let tip;
  if (dataType === "image") {
    tip = " Tip: convert your image data into numerical features (for example extracted measurements) " +
      "and select 'Numerical'. Deep learning is commonly used on raw images but is outside this reference library.";
  } else if (dataType === "text") {
    tip = " Tip: convert your text data into numerical features (for example word counts) and select 'Numerical'.";
  } else {
    tip = " Tip: try a different data type or task type.";
  }
  return base + tip;
}

/* Final guidance as a list of text lines (same text as the R version) */
function buildSummary(task, dataType, size, priorities, results, message) {
  priorities = canonicalPriorities(priorities);
  const priorityText = priorities.length === 0 ? "None selected" :
    priorities.map(function (p) { return PRIORITY_LABELS[p]; }).join(", ");
  let lines = [
    "AI MODEL SELECTION ASSISTANT - GUIDANCE SUMMARY", "",
    "Your requirements",
    "- Task: " + TASK_LABELS[task],
    "- Data type: " + DATA_LABELS[dataType],
    "- Dataset size: " + SIZE_LABELS[size],
    "- Priorities: " + priorityText, ""
  ];
  if (results.length === 0) {
    lines = lines.concat(["No suitable approach was found in the reference library.", message || "", ""]);
  } else {
    lines.push("Potentially suitable approaches (ordered by rule-based match score, not by accuracy)");
    results.forEach(function (r, i) {
      const how = r.data_fit === "direct" ? "works directly with this data type" :
        "needs data preparation for this data type";
      lines.push((i + 1) + ". " + r.model_name + " - match score " + r.score + "% (" + how + ")");
    });
    lines.push("", "Trade-offs to keep in mind");
    results.slice(0, 3).forEach(function (r) {
      lines.push("- " + r.model_name + ": " + r.considerations[0]);
    });
    lines.push("");
  }
  lines.push(REMINDER_TEXT);
  return lines;
}

/* The complete pipeline: validate -> filter -> score -> rank -> summarise */
function runAssistant(ref, task, dataType, size, priorities) {
  priorities = priorities || [];
  const check = validateInput(task, dataType, size, priorities);
  if (!check.valid) {
    return { valid: false, errors: check.errors, trace: [], results: [],
      message: check.errors.join(" "), summary: [] };
  }
  const trace = analysisTrace(ref, task, dataType, canonicalPriorities(priorities).length);
  const results = rankModels(findCandidates(ref, task, dataType), task, dataType, size, priorities);
  let message = "";
  if (results.length === 0) message = noCandidateMessage(task, dataType);
  else if (results.length === 1) {
    message = "Only one model in the reference library fits these requirements, so a comparison is not available.";
  }
  return { valid: true, errors: [], trace: trace, results: results, message: message,
    summary: buildSummary(task, dataType, size, priorities, results, message) };
}

/* Allow the logic to be tested from Node.js (ignored in the browser) */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { MODEL_REFERENCE, runAssistant, compareModels, suggestTask, validateInput,
    splitField, TASK_LABELS, DATA_LABELS, SIZE_LABELS, PRIORITY_LABELS };
}

/* ---------- PART 4: page code (runs only in a browser) ---------- */

(function () {
  if (typeof document === "undefined") return;

  const VIEWS = ["home", "setup", "preferences", "analysis", "results", "compare", "final"];
  const STEP_OF_VIEW = { setup: 1, preferences: 2, analysis: 3, results: 4, compare: 5, final: 6 };

  const state = { task: "", dataType: "", size: "", priorities: [], run: null };

  /* Small helper: create an element with attributes and children */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else if (k === "class") node.className = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { node.appendChild(c); });
    return node;
  }
  function byId(id) { return document.getElementById(id); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function list(items, cls) {
    return el("ul", cls ? { class: cls } : {}, items.map(function (t) { return el("li", { text: t }); }));
  }
  function showMessage(id, text, kind) {
    const box = byId(id);
    box.textContent = text;
    box.className = "message " + (kind || "error");
    box.hidden = text === "";
  }

  /* ----- navigation between steps ----- */
  function showView(name) {
    VIEWS.forEach(function (v) { byId("view-" + v).hidden = v !== name; });
    const step = STEP_OF_VIEW[name] || 0;
    document.querySelectorAll("#steps li").forEach(function (li, i) {
      li.classList.toggle("current", i + 1 === step);
      li.classList.toggle("done", i + 1 < step);
      if (i + 1 === step) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    byId("steps").hidden = name === "home";
    const heading = byId("view-" + name).querySelector("h2");
    if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus(); }
    window.scrollTo(0, 0);
  }

  /* ----- option groups (radio buttons / checkboxes built from the vocabulary) ----- */
  function buildOptions(containerId, name, type, labels, helps) {
    const box = byId(containerId);
    Object.keys(labels).forEach(function (key) {
      const input = el("input", { type: type, name: name, value: key, id: name + "-" + key });
      const text = el("span", {}, [el("strong", { text: labels[key] }), el("small", { text: helps[key] })]);
      box.appendChild(el("label", { class: "option", "for": name + "-" + key }, [input, text]));
    });
  }
  function checkedValues(name) {
    return Array.prototype.map.call(document.querySelectorAll('input[name="' + name + '"]:checked'),
      function (i) { return i.value; });
  }
  function setChecked(name, value) {
    const input = document.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (input) input.checked = true;
  }

  /* ----- step 1: problem setup ----- */
  function onSuggest() {
    const out = suggestTask(byId("problem-text").value);
    showMessage("suggest-message", out.message, out.status === "suggested" ? "info" : "warn");
    if (out.status === "suggested") setChecked("task", out.tasks[0]);
  }

  function onSetupNext() {
    state.task = checkedValues("task")[0] || "";
    state.dataType = checkedValues("dataType")[0] || "";
    state.size = checkedValues("size")[0] || "";
    const check = validateInput(state.task, state.dataType, state.size, []);
    if (!check.valid) {
      showMessage("setup-message", check.errors.join(" "), "error");
      return;
    }
    showMessage("setup-message", "", "error");
    showView("preferences");
  }

  /* ----- step 2 -> 3: analyse ----- */
  function onAnalyse() {
    state.priorities = checkedValues("priority");
    state.run = runAssistant(MODEL_REFERENCE, state.task, state.dataType, state.size, state.priorities);
    if (!state.run.valid) {
      showMessage("preferences-message", state.run.message, "error");
      return;
    }
    showMessage("preferences-message", "", "error");
    renderAnalysis();
    showView("analysis");
  }

  function renderAnalysis() {
    const run = state.run;
    const pr = canonicalPriorities(state.priorities).map(function (p) { return PRIORITY_LABELS[p]; });
    const box = byId("analysis-body");
    clear(box);
    box.appendChild(el("h3", { text: "Your requirements" }));
    box.appendChild(list([
      "Task: " + TASK_LABELS[state.task],
      "Data type: " + DATA_LABELS[state.dataType],
      "Dataset size: " + SIZE_LABELS[state.size],
      "Priorities: " + (pr.length ? pr.join(", ") : "None selected (models are matched on data and size only)")
    ]));
    box.appendChild(el("h3", { text: "How the candidates were identified" }));
    box.appendChild(list(run.trace, "trace"));
    const n = run.results.length;
    byId("analysis-message").className = "message " + (n === 0 ? "error" : "info");
    byId("analysis-message").hidden = false;
    byId("analysis-message").textContent = n === 0 ? run.message :
      n + " potentially suitable model(s) found." + (run.message ? " " + run.message : "");
    byId("analysis-next").hidden = n === 0;
  }

  /* ----- step 4: result cards ----- */
  function badge(label, value, extraClass) {
    return el("span", { class: "badge" + (extraClass ? " " + extraClass : ""), text: label + ": " + value });
  }

  function renderResults() {
    const box = byId("results-body");
    clear(box);
    state.run.results.forEach(function (r, i) {
      const bar = el("div", { class: "bar", role: "img", "aria-label": "Match score " + r.score + " percent" },
        [el("div", { class: "bar-fill", style: "width:" + r.score + "%" })]);
      
      const scoreClass = r.score >= 80 ? "score-badge high" : (r.score >= 60 ? "score-badge mid" : "score-badge low");
      const head = el("div", { class: "card-head" }, [
        el("h3", { text: (i + 1) + ". " + r.model_name }),
        el("div", { class: scoreClass, text: r.score + "% match" })
      ]);
      const badges = el("div", { class: "badges" }, [
        badge("Interpretability", r.info.interpretability),
        badge("Speed", r.info.speed),
        badge("Complexity", r.info.complexity),
        badge("Data fit", r.data_fit === "direct" ? "direct" : "needs preparation",
              r.data_fit === "direct" ? "direct" : "prep")
      ]);
      const card = el("article", { class: "card" }, [
        head, bar,
        el("p", { class: "points", text: r.points + " of " + r.possible + " match points. Typical use: " + r.info.typical_use + "." }),
        badges,
        el("div", { class: "columns" }, [
          el("div", {}, [el("h4", { text: "Why it may fit" }), list(r.reasons)]),
          el("div", {}, [el("h4", { text: "Strengths" }), list(r.strengths)]),
          el("div", {}, [el("h4", { text: "Considerations" }), list(r.considerations)])
        ])
      ]);
      box.appendChild(card);
    });
    const canCompare = state.run.results.length >= 2;
    byId("to-compare").disabled = !canCompare;
    byId("results-message").hidden = canCompare;
    byId("results-message").className = "message warn";
    byId("results-message").textContent = canCompare ? "" : state.run.message;
  }

  /* ----- step 5: comparison ----- */
  function renderCompareChoices() {
    const box = byId("compare-choices");
    clear(box);
    state.run.results.forEach(function (r, idx) {
      const input = el("input", { type: "checkbox", name: "compare", value: r.model_id, id: "compare-" + r.model_id });
      if (idx < 2) input.checked = true; // Pre-select top 2 models for convenience
      box.appendChild(el("label", { class: "option", "for": "compare-" + r.model_id },
        [input, el("span", {}, [el("strong", { text: r.model_name }), el("small", { text: r.score + "% match" })])]));
    });
    clear(byId("compare-table"));
    showMessage("compare-message", "", "error");
    if (state.run.results.length >= 2) {
      onCompare();
    }
  }

  function onCompare() {
    const out = compareModels(state.run.results, checkedValues("compare"));
    const holder = byId("compare-table");
    clear(holder);
    if (!out.valid) { showMessage("compare-message", out.error, "error"); return; }
    showMessage("compare-message", "", "error");
    const rows = [
      ["Model", "Model"], ["Task", "Task"], ["Main strength", "MainStrength"],
      ["Main consideration", "MainConsideration"], ["Interpretability", "Interpretability"],
      ["Speed", "Speed"], ["Typical use", "TypicalUse"], ["Match score", "MatchScore"]
    ];
    const table = el("table", { class: "compare" });
    rows.forEach(function (row) {
      const tr = el("tr");
      tr.appendChild(el("th", { scope: row[0] === "Model" ? "col" : "row", text: row[0] === "Model" ? "" : row[0] }));
      out.table.forEach(function (m) {
        tr.appendChild(el(row[0] === "Model" ? "th" : "td", { scope: "col", text: m[row[1]] }));
      });
      table.appendChild(tr);
    });
    holder.appendChild(table);
    holder.appendChild(el("p", { class: "note",
      text: "No single model is the winner: the best choice depends on your real data and how the models perform on it." }));
  }

  /* ----- step 6: final guidance ----- */
  function renderFinal() {
    const box = byId("final-body");
    clear(box);
    const run = state.run;
    const lines = run.summary;
    const heads = ["Your requirements", "Trade-offs to keep in mind"];
    let current = null;
    lines.slice(1).forEach(function (line) {
      if (line === "") { current = null; return; }
      const isHead = heads.indexOf(line) !== -1 || line.indexOf("Potentially suitable") === 0;
      if (isHead) { box.appendChild(el("h3", { text: line })); current = el("ul"); box.appendChild(current); return; }
      if (line.indexOf("Reminder:") === 0) { box.appendChild(el("p", { class: "message info", text: line })); return; }
      if (current === null) { box.appendChild(el("p", { text: line })); return; }
      current.appendChild(el("li", { text: line.replace(/^- /, "") }));
    });
  }

  function copySummary() {
    if (!state.run || !state.run.summary) return;
    const text = state.run.summary.join("\n");
    const btn = byId("copy-summary");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        if (btn) {
          const orig = btn.textContent;
          btn.textContent = "Copied to Clipboard! ✓";
          setTimeout(function () { btn.textContent = orig; }, 2200);
        }
      });
    }
  }

  /* Helper to load preset scenarios */
  function applyPreset(task, dataType, size, priorities) {
    setChecked("task", task);
    setChecked("dataType", dataType);
    setChecked("size", size);
    document.querySelectorAll('input[name="priority"]').forEach(function (cb) {
      cb.checked = priorities.indexOf(cb.value) !== -1;
    });
    state.task = task;
    state.dataType = dataType;
    state.size = size;
    state.priorities = priorities;
    state.run = runAssistant(MODEL_REFERENCE, task, dataType, size, priorities);
    renderAnalysis();
    renderResults();
    showView("results");
  }

  function restart() {
    document.querySelectorAll("input[type=radio], input[type=checkbox]").forEach(function (i) { i.checked = false; });
    byId("problem-text").value = "";
    ["suggest-message", "setup-message", "preferences-message", "compare-message"].forEach(function (id) {
      showMessage(id, "", "error");
    });
    state.task = state.dataType = state.size = ""; state.priorities = []; state.run = null;
    showView("home");
  }

  /* ----- start-up ----- */
  function init() {
    buildOptions("task-options", "task", "radio", TASK_LABELS, TASK_HELP);
    buildOptions("data-options", "dataType", "radio", DATA_LABELS, DATA_HELP);
    buildOptions("size-options", "size", "radio", SIZE_LABELS, SIZE_HELP);
    buildOptions("priority-options", "priority", "checkbox", PRIORITY_LABELS, PRIORITY_HELP);

    byId("start").addEventListener("click", function () { showView("setup"); });
    byId("suggest").addEventListener("click", onSuggest);
    byId("setup-next").addEventListener("click", onSetupNext);
    byId("preferences-back").addEventListener("click", function () { showView("setup"); });
    byId("analyse").addEventListener("click", onAnalyse);
    byId("analysis-back").addEventListener("click", function () { showView("preferences"); });
    byId("analysis-next").addEventListener("click", function () { renderResults(); showView("results"); });
    byId("results-back").addEventListener("click", function () { showView("analysis"); });
    byId("to-compare").addEventListener("click", function () { renderCompareChoices(); showView("compare"); });
    byId("results-final").addEventListener("click", function () { renderFinal(); showView("final"); });
    byId("compare-back").addEventListener("click", function () { showView("results"); });
    byId("compare-run").addEventListener("click", onCompare);
    byId("compare-final").addEventListener("click", function () { renderFinal(); showView("final"); });
    byId("final-back").addEventListener("click", function () { showView("results"); });
    byId("print").addEventListener("click", function () { window.print(); });
    const copyBtn = byId("copy-summary");
    if (copyBtn) copyBtn.addEventListener("click", copySummary);
    byId("restart").addEventListener("click", restart);
    byId("home-link").addEventListener("click", function (e) { e.preventDefault(); restart(); });

    // Quick Presets
    const pChurn = byId("preset-churn");
    if (pChurn) pChurn.addEventListener("click", function () {
      applyPreset("binary_classification", "mixed", "large", ["performance", "nonlinear"]);
    });
    const pHouse = byId("preset-house");
    if (pHouse) pHouse.addEventListener("click", function () {
      applyPreset("regression", "numerical", "medium", ["easy", "interpretable"]);
    });
    const pCluster = byId("preset-cluster");
    if (pCluster) pCluster.addEventListener("click", function () {
      applyPreset("clustering", "numerical", "medium", ["easy"]);
    });
    const pFraud = byId("preset-fraud");
    if (pFraud) pFraud.addEventListener("click", function () {
      applyPreset("anomaly_detection", "numerical", "large", ["fast"]);
    });

    // Sample question chips in Setup
    document.querySelectorAll(".chip-btn").forEach(function (chip) {
      chip.addEventListener("click", function () {
        const text = chip.getAttribute("data-query");
        if (text) {
          byId("problem-text").value = text;
          onSuggest();
        }
      });
    });

    showView("home");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
