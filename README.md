# AI Model Selection Assistant

[![R](https://img.shields.io/badge/R-Base%20R%20(4.0%2B)-276DC3?logo=r&logoColor=white)](https://www.r-project.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](#)
[![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%2F%20CSS3-E34F26?logo=html5&logoColor=white)](#)

A rule-based decision support system and interactive web tool that evaluates machine learning task requirements, dataset characteristics, and engineering constraints to recommend and rank candidate ML model families with explainable scoring.

---

## Key Features

- **Automated Task Evaluation**: Detects and aligns with target problem types, including Binary Classification, Multi-class Classification, Regression, Clustering, and Anomaly Detection.
- **Scale and Format Compatibility**: Evaluates numerical, categorical, mixed tabular, text, and image data formats across small (<1k), medium (1k–100k), and large (>100k) row volumes.
- **Explainable Multi-Criteria Scoring**: Ranks 10 classic machine learning model families using a transparent point-based compatibility rubric based on speed, interpretability, complexity, and performance potential.
- **Side-by-Side Trade-off Comparison**: Compares candidate models across interpretability, training speed, data preparation prerequisites, and practical implementation constraints.
- **Dual Runtime Interfaces**: Full functional parity between a zero-dependency browser frontend and a modular Base R command-line/script interface.
- **Zero Heavy Dependencies**: Built strictly using standard Base R and modern Vanilla JavaScript, CSS, and HTML.

---

## Supported Model Families

| Model Family | Primary Tasks | Interpretability | Speed | Complexity | Performance Potential |
|---|---|---|---|---|---|
| **Linear Regression** | Regression | High | Fast | Low | Low |
| **Logistic Regression** | Classification | High | Fast | Low | Medium |
| **Decision Tree** | Classification, Regression | High | Fast | Low | Medium |
| **Random Forest** | Classification, Regression | Low | Medium | Medium | High |
| **K-Nearest Neighbors (KNN)** | Classification, Regression | Medium | Medium | Low | Medium |
| **Naive Bayes** | Classification | Medium | Fast | Low | Medium |
| **K-Means Clustering** | Clustering | Medium | Fast | Low | Medium |
| **Hierarchical Clustering** | Clustering | Medium | Slow | Medium | Medium |
| **Isolation Forest** | Anomaly Detection | Low | Fast | Medium | Medium |
| **Z-Score Outlier Detection** | Anomaly Detection | High | Fast | Low | Low |

---

## Repository Structure

```
ai-model-selection-assistant/
├── index.html            # Main web application entry point
├── web/                  # Web application assets & logic
│   ├── index.html        # Web mirror entry point
│   ├── style.css         # Modern, responsive design system
│   └── script.js         # Browser decision engine & UI logic
├── R/                    # R decision system
│   ├── main.R            # CLI & demonstration entry point
│   └── functions.R       # Pure rule-based evaluation functions
├── data/                 # Model reference catalog
│   └── model_reference.csv
├── docs/                 # Workflow documentation diagrams
├── tests/                # Test cases & specification documentation
│   └── test-cases.md
├── .github/              # Automation workflows
│   └── workflows/
│       └── deploy-pages.yml
├── .gitignore
└── README.md
```

---

## Getting Started

### Option 1: Interactive Web Application (Browser)

1. Open `index.html` directly in any modern web browser (Chrome, Edge, Firefox, Safari).
2. Input your problem description or choose task criteria manually, select data attributes and priorities, and view live ranked recommendations.

### Option 2: Command-Line Interface (Base R)

Run the built-in demonstration suite:

```bash
Rscript R/main.R
```

Or provide custom requirements directly via command-line arguments:

```bash
# Syntax: Rscript R/main.R <task> <data_type> <size> <priorities_csv>
Rscript R/main.R regression numerical small easy,interpretable
Rscript R/main.R binary_classification mixed large performance,nonlinear
```

### Option 3: Scripting in R

```r
source("R/functions.R")

# 1. Load model reference catalog
ref <- load_model_reference("data/model_reference.csv")

# 2. Evaluate requirements
output <- run_assistant(
  ref = ref,
  task = "classification",
  data_type = "mixed",
  size = "medium",
  priorities = c("interpretable", "fast")
)

# 3. Inspect ranked recommendations
for (model in output$results) {
  cat(sprintf("%-28s Score: %d%%\n", model$model_name, model$score))
}
```

---

## License

This project is licensed under the [MIT License](LICENSE).
