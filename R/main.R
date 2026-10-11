# =============================================================================
# main.R - demonstration of the AI Model Selection Assistant (R component)
#
# Run from the project folder:
#     Rscript R/main.R                                  (built-in demonstration)
#     Rscript R/main.R regression numerical small easy,interpretable
#                                                       (your own requirements)
#
# Arguments (all optional, in this order):
#     task       classification | binary_classification | regression |
#                clustering | anomaly_detection
#     data_type  numerical | categorical | mixed | text | image
#     size       small | medium | large
#     priorities comma-separated list of: easy, fast, interpretable,
#                performance, nonlinear, baseline
# =============================================================================

# ---- locate and load the reusable functions ----
args_all <- commandArgs(trailingOnly = FALSE)
file_arg <- sub("^--file=", "", args_all[grep("^--file=", args_all)])
script_dir <- if (length(file_arg) > 0) dirname(file_arg[1]) else "R"
functions_path <- file.path(script_dir, "functions.R")
if (!file.exists(functions_path)) functions_path <- file.path("R", "functions.R")
source(functions_path)

# ---- load the structured model reference data ----
ref <- load_model_reference(resolve_path("data/model_reference.csv"))

# Small helper that prints one complete analysis in a readable way
show_analysis <- function(title, task, data_type, size, priorities = character(0)) {
  cat("\n", strrep("=", 70), "\n", title, "\n", strrep("=", 70), "\n", sep = "")
  out <- run_assistant(ref, task, data_type, size, priorities)

  if (!out$valid) {
    cat("INPUT PROBLEM:\n")
    for (e in out$errors) cat(" -", e, "\n")
    return(invisible(out))
  }

  cat("\nAnalysis steps:\n")
  for (line in out$trace) cat(" ", line, "\n")

  if (length(out$results) == 0) {
    cat("\n", out$message, "\n", sep = "")
    return(invisible(out))
  }

  cat("\nRanked candidates (rule-based match score):\n")
  for (i in seq_along(out$results)) {
    r <- out$results[[i]]
    cat(sprintf(" %d. %-28s %3d%%  (%d of %d points)\n",
                i, r$model_name, r$score, r$points, r$possible))
  }
  cat("\nTop candidate explanation - ", out$results[[1]]$model_name, "\n", sep = "")
  cat("  Why it may fit:\n")
  for (x in out$results[[1]]$reasons) cat("   +", x, "\n")
  cat("  Considerations:\n")
  for (x in out$results[[1]]$considerations) cat("   -", x, "\n")
  if (out$message != "") cat("\nNote:", out$message, "\n")
  invisible(out)
}

# ---- Mode 1: requirements given on the command line ----
user_args <- commandArgs(trailingOnly = TRUE)
if (length(user_args) >= 1) {
  task <- user_args[1]
  data_type <- if (length(user_args) >= 2) user_args[2] else NA
  size <- if (length(user_args) >= 3) user_args[3] else NA
  priorities <- if (length(user_args) >= 4) strsplit(user_args[4], ",")[[1]] else character(0)
  out <- show_analysis("Analysis for your requirements", task, data_type, size, priorities)
  if (isTRUE(out$valid) && length(out$results) > 0) {
    cat("\n", paste(out$summary, collapse = "\n"), "\n", sep = "")
  }
  quit(save = "no")
}

# ---- Mode 2: built-in demonstration ----
cat("AI MODEL SELECTION ASSISTANT - R demonstration\n")
cat("Reference library:", nrow(ref), "model families loaded from data/model_reference.csv\n")
cat("Models:", paste(ref$model_name, collapse = "; "), "\n")

# Part 1: understand the problem from a sentence
cat("\n--- Part 1: suggesting a task type from a sentence ---\n")
examples <- c("I want to predict whether a customer will leave.",
              "I want to predict house prices.",
              "I want to group similar customers.")
for (s in examples) {
  cat("Input :", s, "\n")
  cat("Output:", suggest_task(s)$message, "\n")
}

# Part 2: three complete analyses
show_analysis("Example A - predicting house prices (regression, numerical, medium)",
              "regression", "numerical", "medium", c("easy", "interpretable"))

show_analysis("Example B - customer churn (binary classification, mixed, large)",
              "binary_classification", "mixed", "large", c("performance", "nonlinear"))

show_analysis("Example C - short text messages (classification, text, small)",
              "classification", "text", "small", c("fast", "baseline"))

# Part 3: comparing models
cat("\n--- Part 3: comparing models for Example A ---\n")
out <- run_assistant(ref, "regression", "numerical", "medium", c("easy", "interpretable"))
cmp <- compare_models(out$results, c("linear_regression", "decision_tree", "random_forest"))
if (cmp$valid) {
  for (i in seq_len(nrow(cmp$table))) {
    row <- cmp$table[i, ]
    cat(sprintf("\n%s (match %s)\n  Main strength     : %s\n  Main consideration: %s\n  Interpretability  : %s | Speed: %s\n  Typical use       : %s\n",
                row$Model, row$MatchScore, row$MainStrength, row$MainConsideration,
                row$Interpretability, row$Speed, row$TypicalUse))
  }
}

# Part 4: final guidance summary
cat("\n--- Part 4: final guidance summary for Example A ---\n")
cat(paste(out$summary, collapse = "\n"), "\n")

# Part 5: graceful handling of problems
show_analysis("Problem 1 - incomplete input (nothing selected)", NA, NA, NA)
show_analysis("Problem 2 - no suitable model (image data, classification)",
              "classification", "image", "medium")
cat("\n--- Problem 3: comparing fewer than two models ---\n")
cmp <- compare_models(out$results, "linear_regression")
cat(cmp$error, "\n")
