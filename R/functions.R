# =============================================================================
# functions.R - reusable functions for the AI Model Selection Assistant
#
# This file contains the rule-based decision logic of the project.
# It does NOT train or evaluate any machine-learning model. It only compares
# the user's requirements with the structured table in data/model_reference.csv
# and explains which model families MAY be suitable, and why.
#
# The website (web/script.js) reproduces exactly the same rules in JavaScript
# so that the GitHub Pages version works fully inside the browser.
# =============================================================================


# -----------------------------------------------------------------------------
# SECTION 1: Lookup tables (the vocabulary of the assistant)
# -----------------------------------------------------------------------------

# Internal task codes -> names used inside sentences
TASK_NAMES <- c(
  classification        = "classification",
  binary_classification = "binary classification",
  regression            = "regression",
  clustering            = "clustering",
  anomaly_detection     = "anomaly detection"
)

# Internal task codes -> labels shown to the user (simple language first)
TASK_LABELS <- c(
  classification        = "Classification (predict a category)",
  binary_classification = "Binary classification (predict Yes/No)",
  regression            = "Regression (predict a number)",
  clustering            = "Clustering (group similar records)",
  anomaly_detection     = "Anomaly detection (find unusual records)"
)

DATA_NAMES <- c(
  numerical   = "numerical",
  categorical = "categorical",
  mixed       = "mixed",
  text        = "text",
  image       = "image"
)

DATA_LABELS <- c(
  numerical   = "Numerical",
  categorical = "Categorical",
  mixed       = "Mixed (numbers and categories)",
  text        = "Text",
  image       = "Image"
)

SIZE_LABELS <- c(small = "Small", medium = "Medium", large = "Large")

PRIORITY_LABELS <- c(
  easy          = "Easy to understand",
  fast          = "Fast training/prediction",
  interpretable = "Interpretability",
  performance   = "Good performance",
  nonlinear     = "Works with non-linear relationships",
  baseline      = "Simple baseline model"
)

# Keywords used to suggest a task type from a sentence typed by the user
TASK_KEYWORDS <- list(
  binary_classification = c("whether", "yes or no", "yes/no", "true or false",
                            "pass or fail", "churn", "leave", "spam", "will buy",
                            "approve", "default"),
  classification        = c("category", "categories", "type of", "which class",
                            "classify", "label", "species", "kind of",
                            "sentiment", "which one"),
  regression            = c("price", "how much", "how many", "amount", "salary",
                            "temperature", "forecast", "predict a number",
                            "sales", "revenue", "cost", "value of", "estimate"),
  clustering            = c("group", "segment", "cluster", "similar",
                            "segmentation"),
  anomaly_detection     = c("unusual", "anomaly", "anomalies", "outlier",
                            "abnormal", "rare", "suspicious", "odd", "fraud")
)

# -----------------------------------------------------------------------------
# SECTION 2: Scoring rules (transparent "match points")
# -----------------------------------------------------------------------------
# Every criterion is worth at most POINTS_MAX points.
#   - data fit        : direct = 20, needs preparation = 10
#   - dataset size fit: good = 20, ok = 10, caution = 0
#   - each priority the user selected: 20 / 10 / 0 depending on the rating
#                       stored in the reference table
# match score (%) = points earned / points possible * 100
# The match score says how well a model fits the STATED requirements.
# It is NOT an accuracy value and no model has been trained.

POINTS_MAX  <- 20
DATA_POINTS <- c(direct = 20, prep = 10)
SIZE_POINTS <- c(good = 20, ok = 10, caution = 0)

PRIORITY_RULES <- list(
  easy          = list(column = "complexity",
                       scale = c(Low = 20, Medium = 10, High = 0)),
  fast          = list(column = "speed",
                       scale = c(Fast = 20, Medium = 10, Slow = 0)),
  interpretable = list(column = "interpretability",
                       scale = c(High = 20, Medium = 10, Low = 0)),
  performance   = list(column = "performance_potential",
                       scale = c(High = 20, Medium = 10, Low = 0)),
  nonlinear     = list(column = "handles_nonlinear",
                       scale = c(Yes = 20, Partly = 10, No = 0)),
  baseline      = list(column = "baseline_friendly",
                       scale = c(Yes = 20, No = 0))
)

# Sentences used to explain each priority (full points / half points / zero)
PRIORITY_TEXT <- list(
  easy = list(
    full = "Easy to understand: low complexity level",
    half = "Moderately easy to understand: medium complexity level",
    zero = "Easy to understand: this model has a high complexity level"),
  fast = list(
    full = "Fast training and prediction: rated fast",
    half = "Reasonable speed: rated medium",
    zero = "Fast training/prediction: this model is rated slow"),
  interpretable = list(
    full = "Highly interpretable results",
    half = "Moderately interpretable results",
    zero = "Interpretability: results are harder to explain (rated low)"),
  performance = list(
    full = "High predictive potential on suitable data",
    half = "Medium predictive potential",
    zero = "Performance: lower predictive potential than flexible models (rated low)"),
  nonlinear = list(
    full = "Can capture non-linear relationships",
    half = "Can partly capture non-linear relationships",
    zero = "Non-linear relationships: mainly captures simple or straight-line patterns"),
  baseline = list(
    full = "Suitable as a simple baseline model",
    half = "",
    zero = "Baseline: not usually the first simple baseline choice")
)

REMINDER_TEXT <- paste0(
  "Reminder: this is guidance only. Train and evaluate the candidate models ",
  "on your real dataset (for example with cross-validation) before making a ",
  "final modelling decision.")


# -----------------------------------------------------------------------------
# SECTION 3: Small helper functions
# -----------------------------------------------------------------------------

# Turn "a;b;c" or "a|b|c" into c("a", "b", "c"). Empty text gives character(0).
split_field <- function(x) {
  if (is.null(x) || length(x) == 0 || is.na(x[1]) || x[1] == "") {
    return(character(0))
  }
  trimws(strsplit(x[1], "[;|]")[[1]])
}

# TRUE when a value is missing, NA or only spaces
is_blank <- function(x) {
  is.null(x) || length(x) == 0 || is.na(x[1]) || trimws(x[1]) == ""
}

# Join several names into one readable text, or "none" when the vector is empty
join_names <- function(x) {
  if (length(x) == 0) "none" else paste(x, collapse = ", ")
}

# Keep the selected priorities in one fixed order (the order of PRIORITY_RULES)
canonical_priorities <- function(priorities) {
  names(PRIORITY_RULES)[names(PRIORITY_RULES) %in% priorities]
}

# Find a file in either the project root or the R/ folder (so the scripts work
# whichever folder they are started from)
resolve_path <- function(relative_path) {
  candidates <- c(relative_path, file.path("..", relative_path))
  for (p in candidates) {
    if (file.exists(p)) return(p)
  }
  stop("File not found: ", relative_path,
       ". Run the script from the project folder.")
}


# -----------------------------------------------------------------------------
# SECTION 4: Loading the reference data
# -----------------------------------------------------------------------------

# Read data/model_reference.csv. All columns are read as text on purpose,
# because every column is either a label or a list of labels.
load_model_reference <- function(path = "data/model_reference.csv") {
  read.csv(path, stringsAsFactors = FALSE, colClasses = "character")
}


# -----------------------------------------------------------------------------
# SECTION 5: Understanding the problem (task suggestion from free text)
# -----------------------------------------------------------------------------

# Looks for keywords in the user's sentence and suggests a task type.
# Returns a list with: status ("suggested", "ambiguous", "none", "empty"),
# tasks (matching task codes), matched (keywords found) and message.
suggest_task <- function(text) {
  if (is_blank(text)) {
    return(list(status = "empty", tasks = character(0), matched = character(0),
                message = "Please describe your problem first."))
  }
  lower <- tolower(text)
  hits <- c()
  matched <- list()
  for (task in names(TASK_KEYWORDS)) {
    found <- c()
    for (word in TASK_KEYWORDS[[task]]) {
      if (grepl(word, lower, fixed = TRUE)) found <- c(found, word)
    }
    hits[task] <- length(found)
    matched[[task]] <- found
  }
  best <- max(hits)
  if (best == 0) {
    return(list(status = "none", tasks = character(0), matched = character(0),
                message = paste0("No task type could be suggested from this ",
                                 "description. Please choose a task type yourself.")))
  }
  top_tasks <- names(hits)[hits == best]
  if (length(top_tasks) > 1) {
    return(list(status = "ambiguous", tasks = top_tasks, matched = character(0),
                message = paste0("This description could fit more than one task type (",
                                 paste(TASK_NAMES[top_tasks], collapse = ", "),
                                 "). Please choose one yourself.")))
  }
  list(status = "suggested", tasks = top_tasks, matched = matched[[top_tasks]],
       message = paste0("Suggested task type: ", TASK_LABELS[[top_tasks]],
                        ". Matched words: ", paste(matched[[top_tasks]], collapse = ", "), "."))
}


# -----------------------------------------------------------------------------
# SECTION 6: Input validation
# -----------------------------------------------------------------------------

# Checks the four inputs. Returns list(valid = TRUE/FALSE, errors = messages).
# Priorities are optional, but every priority that is given must be known.
validate_input <- function(task, data_type, size, priorities = character(0)) {
  errors <- character(0)

  if (is_blank(task)) {
    errors <- c(errors, "Please select a task type.")
  } else if (!(task %in% names(TASK_LABELS))) {
    errors <- c(errors, paste0("Task type '", task, "' is not recognised."))
  }

  if (is_blank(data_type)) {
    errors <- c(errors, "Please select a data type.")
  } else if (!(data_type %in% names(DATA_LABELS))) {
    errors <- c(errors, paste0("Data type '", data_type, "' is not recognised."))
  }

  if (is_blank(size)) {
    errors <- c(errors, "Please select a dataset size.")
  } else if (!(size %in% names(SIZE_LABELS))) {
    errors <- c(errors, paste0("Dataset size '", size, "' is not recognised."))
  }

  for (p in priorities) {
    if (!(p %in% names(PRIORITY_LABELS))) {
      errors <- c(errors, paste0("Priority '", p, "' is not recognised."))
    }
  }

  list(valid = length(errors) == 0, errors = errors)
}


# -----------------------------------------------------------------------------
# SECTION 7: Finding candidate models
# -----------------------------------------------------------------------------

# Does this model (one row of the reference table) support the task?
supports_task <- function(model_row, task) {
  task %in% split_field(model_row$task_types)
}

# How well does the model handle the data type?
#   "direct" = commonly used on this data type with routine preparation
#   "prep"   = possible, but needs extra data preparation
#   "none"   = not suitable (the model is left out)
get_data_fit <- function(model_row, data_type) {
  if (data_type %in% split_field(model_row$data_direct)) return("direct")
  if (data_type %in% split_field(model_row$data_prep)) return("prep")
  "none"
}

# Filter the reference table: keep models that support the task AND the data
# type. A new column "data_fit" is added to the result.
find_candidates <- function(ref, task, data_type) {
  keep <- integer(0)
  fits <- character(0)
  for (i in seq_len(nrow(ref))) {
    row <- ref[i, ]
    if (!supports_task(row, task)) next
    fit <- get_data_fit(row, data_type)
    if (fit == "none") next
    keep <- c(keep, i)
    fits <- c(fits, fit)
  }
  candidates <- ref[keep, , drop = FALSE]
  candidates$data_fit <- fits
  candidates
}

# Explains the filtering steps in plain sentences (the "analysis" step)
analysis_trace <- function(ref, task, data_type, n_priorities) {
  with_task <- character(0)
  direct <- character(0)
  prep <- character(0)
  excluded <- character(0)
  for (i in seq_len(nrow(ref))) {
    row <- ref[i, ]
    if (!supports_task(row, task)) next
    with_task <- c(with_task, row$model_name)
    fit <- get_data_fit(row, data_type)
    if (fit == "direct") direct <- c(direct, row$model_name)
    else if (fit == "prep") prep <- c(prep, row$model_name)
    else excluded <- c(excluded, row$model_name)
  }
  kept <- length(direct) + length(prep)
  max_points <- 2 * POINTS_MAX + POINTS_MAX * n_priorities
  c(
    paste0("Step 1 - Task filter: ", length(with_task), " model(s) support ",
           TASK_NAMES[[task]], ": ", join_names(with_task), "."),
    paste0("Step 2 - Data check: ", kept, " of ", length(with_task),
           " model(s) can use ", DATA_NAMES[[data_type]], " data. Directly: ",
           join_names(direct), ". After preparation: ", join_names(prep),
           ". Not suitable: ", join_names(excluded), "."),
    paste0("Step 3 - Scoring: each remaining model earns points for data fit (max ",
           POINTS_MAX, "), dataset size fit (max ", POINTS_MAX,
           ") and each selected priority (max ", POINTS_MAX,
           " each). Maximum points for this analysis: ", max_points, ".")
  )
}


# -----------------------------------------------------------------------------
# SECTION 8: Scoring and explaining one model
# -----------------------------------------------------------------------------

# Calculates the match points of ONE candidate and builds the explanation
# (reasons, strengths, considerations). `fit` is "direct" or "prep".
evaluate_model <- function(row, fit, task, size, priorities) {
  priorities <- canonical_priorities(priorities)

  # --- data fit and size fit points ---
  points <- DATA_POINTS[[fit]]
  size_rating <- row[[paste0("size_", size)]]
  points <- points + SIZE_POINTS[[size_rating]]

  # --- reasons ("why it may fit") ---
  reasons <- paste0("Suitable for ", TASK_NAMES[[task]])
  if (fit == "direct") {
    reasons <- c(reasons, paste0("Works directly with ", DATA_NAMES[[row$data_type_used]], " data"))
  }
  if (fit == "prep") {
    reasons <- c(reasons, paste0("Can work with ", DATA_NAMES[[row$data_type_used]],
                                 " data after preparation"))
  }
  if (size_rating == "good") {
    reasons <- c(reasons, paste0("Suits a ", size, " dataset"))
  }
  if (size_rating == "ok") {
    reasons <- c(reasons, paste0("Usable with a ", size, " dataset"))
  }

  # --- considerations ---
  considerations <- split_field(row$main_considerations)
  if (fit == "prep") {
    considerations <- c(considerations, paste0("Data preparation needed: ", row$prep_note))
  }
  if (size_rating == "caution") {
    considerations <- c(considerations,
                        paste0("Dataset size: may be a poor fit for a ", size, " dataset"))
  }
  if (size_rating == "ok") {
    considerations <- c(considerations,
                        paste0("Dataset size: usable for a ", size,
                               " dataset, but with some limits"))
  }

  # --- priorities: loop over the selected ones ---
  priority_notes <- character(0)
  for (key in priorities) {
    rule <- PRIORITY_RULES[[key]]
    value <- row[[rule$column]]
    earned <- rule$scale[[value]]
    points <- points + earned
    if (earned == POINTS_MAX) {
      reasons <- c(reasons, PRIORITY_TEXT[[key]]$full)
    } else if (earned > 0) {
      reasons <- c(reasons, PRIORITY_TEXT[[key]]$half)
    } else {
      priority_notes <- c(priority_notes, PRIORITY_TEXT[[key]]$zero)
    }
  }
  considerations <- c(considerations, priority_notes)

  possible <- 2 * POINTS_MAX + POINTS_MAX * length(priorities)
  score <- floor(points / possible * 100 + 0.5)

  list(
    model_id = row$model_id,
    model_name = row$model_name,
    data_fit = fit,
    points = points,
    possible = possible,
    score = score,
    reasons = reasons,
    strengths = split_field(row$main_strengths),
    considerations = considerations,
    info = row
  )
}

# Evaluate every candidate and sort: highest score first; equal scores are
# ordered by model_id so that the order is always the same.
rank_models <- function(candidates, task, data_type, size, priorities) {
  results <- list()
  for (i in seq_len(nrow(candidates))) {
    row <- candidates[i, ]
    row$data_type_used <- data_type
    results[[i]] <- evaluate_model(row, row$data_fit, task, size, priorities)
  }
  if (length(results) == 0) return(results)
  scores <- sapply(results, function(r) r$score)
  ids <- sapply(results, function(r) r$model_id)
  results[order(-scores, ids, method = "radix")]
}


# -----------------------------------------------------------------------------
# SECTION 9: Comparing models
# -----------------------------------------------------------------------------

# Build a side-by-side table for the chosen model ids. At least two different
# models are needed. Returns list(valid, error, table).
compare_models <- function(results, ids) {
  ids <- unique(ids)
  if (length(ids) < 2) {
    return(list(valid = FALSE, table = NULL,
                error = "Please select at least two models to compare."))
  }
  available <- sapply(results, function(r) r$model_id)
  for (id in ids) {
    if (!(id %in% available)) {
      return(list(valid = FALSE, table = NULL,
                  error = paste0("Model '", id, "' is not in the candidate list.")))
    }
  }
  table <- data.frame(Model = character(0), Task = character(0),
                      MainStrength = character(0), MainConsideration = character(0),
                      Interpretability = character(0), Speed = character(0),
                      TypicalUse = character(0), MatchScore = character(0),
                      stringsAsFactors = FALSE)
  for (r in results) {
    if (!(r$model_id %in% ids)) next
    tasks <- TASK_NAMES[split_field(r$info$task_types)]
    table[nrow(table) + 1, ] <- c(
      r$model_name,
      paste(tasks, collapse = ", "),
      r$strengths[1],
      split_field(r$info$main_considerations)[1],
      r$info$interpretability,
      r$info$speed,
      r$info$typical_use,
      paste0(r$score, "%")
    )
  }
  list(valid = TRUE, error = "", table = table)
}


# -----------------------------------------------------------------------------
# SECTION 10: Guidance summary and the complete pipeline
# -----------------------------------------------------------------------------

# Message shown when no model fits the task + data type combination
no_candidate_message <- function(task, data_type) {
  base <- paste0("No model in the reference library supports ", TASK_NAMES[[task]],
                 " with ", DATA_NAMES[[data_type]], " data.")
  if (data_type == "image") {
    tip <- paste0(" Tip: convert your image data into numerical features (for example ",
                  "extracted measurements) and select 'Numerical'. Deep learning is ",
                  "commonly used on raw images but is outside this reference library.")
  } else if (data_type == "text") {
    tip <- paste0(" Tip: convert your text data into numerical features (for example ",
                  "word counts) and select 'Numerical'.")
  } else {
    tip <- " Tip: try a different data type or task type."
  }
  paste0(base, tip)
}

# Build the final guidance as a vector of text lines
build_summary <- function(task, data_type, size, priorities, results, message = "") {
  priorities <- canonical_priorities(priorities)
  priority_text <- if (length(priorities) == 0) "None selected" else
    paste(PRIORITY_LABELS[priorities], collapse = ", ")

  lines <- c(
    "AI MODEL SELECTION ASSISTANT - GUIDANCE SUMMARY",
    "",
    "Your requirements",
    paste0("- Task: ", TASK_LABELS[[task]]),
    paste0("- Data type: ", DATA_LABELS[[data_type]]),
    paste0("- Dataset size: ", SIZE_LABELS[[size]]),
    paste0("- Priorities: ", priority_text),
    ""
  )

  if (length(results) == 0) {
    lines <- c(lines, "No suitable approach was found in the reference library.", message, "")
  } else {
    lines <- c(lines, "Potentially suitable approaches (ordered by rule-based match score, not by accuracy)")
    for (i in seq_along(results)) {
      r <- results[[i]]
      how <- if (r$data_fit == "direct") "works directly with this data type"
             else "needs data preparation for this data type"
      lines <- c(lines, paste0(i, ". ", r$model_name, " - match score ", r$score,
                               "% (", how, ")"))
    }
    lines <- c(lines, "", "Trade-offs to keep in mind")
    for (r in results[seq_len(min(3, length(results)))]) {
      lines <- c(lines, paste0("- ", r$model_name, ": ", r$considerations[1]))
    }
    lines <- c(lines, "")
  }
  c(lines, REMINDER_TEXT)
}

# The complete pipeline: validate -> filter -> score -> rank -> summarise.
# Returns a list that contains everything the interface needs.
run_assistant <- function(ref, task, data_type, size, priorities = character(0)) {
  check <- validate_input(task, data_type, size, priorities)
  if (!check$valid) {
    return(list(valid = FALSE, errors = check$errors, trace = character(0),
                results = list(), message = paste(check$errors, collapse = " "),
                summary = character(0)))
  }

  trace <- analysis_trace(ref, task, data_type, length(canonical_priorities(priorities)))
  candidates <- find_candidates(ref, task, data_type)
  results <- rank_models(candidates, task, data_type, size, priorities)

  message <- ""
  if (length(results) == 0) {
    message <- no_candidate_message(task, data_type)
  } else if (length(results) == 1) {
    message <- paste0("Only one model in the reference library fits these ",
                      "requirements, so a comparison is not available.")
  }

  list(valid = TRUE, errors = character(0), trace = trace, results = results,
       message = message,
       summary = build_summary(task, data_type, size, priorities, results, message))
}
