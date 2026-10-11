# Test Cases

This document lists the test cases for the AI Model Selection Assistant and the results that were **actually obtained**.

**How the results were produced (build session):**

- *Logic tests (TC-01 to TC-26, TC-C, TC-S):* every case was run through the R implementation (`R/functions.R`, R 4.3.3) and through the JavaScript implementation (`web/script.js`, Node.js). The two outputs were compared automatically, including every explanation sentence and the full guidance summary, and were identical. Rankings were also recalculated by a separate, independently written Python script from `data/model_reference.csv`; that script agreed on every ranking and score.
- *Interface tests (TC-U):* the real `web/index.html` + `style.css` + `script.js` were loaded in a simulated browser (jsdom) and operated by clicking buttons and filling in options.
- *Manual tests (TC-M):* these could **not** be performed in the build session (no real browser or GitHub account was available) and are marked **Pending - manual**. Please run them and fill in the result column yourself.

Scoring rule used for the hand calculations: data fit direct 20 / needs preparation 10; dataset-size fit good 20 / ok 10 / caution 0; each selected priority 20 / 10 / 0 according to the reference table; match score = points / possible points x 100, rounded to the nearest whole number.

## A. Model selection logic (R and website)

| ID | Category | Input | Expected behavior | Actual result | Status |
|----|----------|-------|-------------------|---------------|--------|
| TC-01 | Classification | Task: classification; Data: mixed; Size: medium; Priorities: none | Only the 5 classification models. Decision Tree and Random Forest work directly with mixed data (full data points); Logistic Regression, Naive Bayes and KNN need data preparation (lower score). No priorities, so only data and size count. | Decision Tree 100%, Random Forest 100%, Logistic Regression 75%, Naive Bayes 75%, K-Nearest Neighbors (KNN) 50% | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-02 | Regression | Task: regression; Data: numerical; Size: small; Priorities: Easy to understand, Interpretability | Only the 4 regression models. Hand calculation (max 80 points): Linear Regression 80, Decision Tree 80, KNN 70, Random Forest 40, i.e. 100%, 100%, 88%, 50%. Equal scores are ordered by model id. | Decision Tree 100%, Linear Regression 100%, K-Nearest Neighbors (KNN) 88%, Random Forest 50% | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-03 | Binary classification | Task: binary_classification; Data: numerical; Size: medium; Priorities: Interpretability, Simple baseline | The 5 classification models. Hand calculation (max 80): Logistic Regression 80 (100%), Naive Bayes 70 (88%), Decision Tree 60 and KNN 60 (75%), Random Forest 40 (50%). | Logistic Regression 100%, Naive Bayes 88%, Decision Tree 75%, K-Nearest Neighbors (KNN) 75%, Random Forest 50% | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-04 | Clustering | Task: clustering; Data: numerical; Size: medium; Priorities: Easy to understand | Only the 2 clustering models. Hand calculation (max 60): K-Means 60 (100%), Hierarchical 40 (67%). | K-Means Clustering 100%, Hierarchical Clustering 67% | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-05 | Anomaly detection | Task: anomaly_detection; Data: numerical; Size: large; Priorities: Fast training/prediction | Only the 2 anomaly-detection models. Both fit numerical, large data and are fast: 60 of 60 (100%) each; tie ordered by model id. | Isolation Forest 100%, Z-Score Outlier Detection 100% | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-06 | Data types: text | Task: classification; Data: text; Size: medium; Priorities: Fast training/prediction, Simple baseline | Only models that support text: Naive Bayes (direct) and Logistic Regression (needs preparation). Decision Tree, KNN and Random Forest are excluded. Hand calculation (max 80): Naive Bayes 80 (100%), Logistic Regression 70 (88%). | Naive Bayes 100%, Logistic Regression 88% | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-07 | Data types: categorical | Task: regression; Data: categorical; Size: medium; Priorities: Good performance | Four regression models stay (Linear Regression and KNN need preparation). Hand calculation (max 60): Random Forest 60 (100%), Decision Tree 50 (83%), KNN 30 (50%), Linear Regression 30 (50%). | Random Forest 100%, Decision Tree 83%, K-Nearest Neighbors (KNN) 50%, Linear Regression 50% | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-08 | Data types: mixed | Task: regression; Data: mixed; Size: large; Priorities: Good performance, Non-linear relationships | Four regression models stay. Hand calculation (max 80): Random Forest 70 (88%), Decision Tree 60 (75%), KNN 40 (50%), Linear Regression 30 (38%). | Random Forest 88%, Decision Tree 75%, K-Nearest Neighbors (KNN) 50%, Linear Regression 38% | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-09 | Priorities | Task: classification; Data: numerical; Size: large; Priorities: Good performance, Non-linear relationships | Priorities: performance and non-linear. Hand calculation (max 80): Random Forest 70 (88%), Decision Tree 60 (75%), KNN 50, Logistic Regression 50 and Naive Bayes 50 (63% each). | Random Forest 88%, Decision Tree 75%, K-Nearest Neighbors (KNN) 63%, Logistic Regression 63%, Naive Bayes 63% | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-10 | Priorities | Task: classification; Data: numerical; Size: large; Priorities: Easy to understand, Interpretability | Same data as TC-09 but different priorities. Ranking must change: Random Forest, first in TC-09, must now rank last; Logistic Regression must rank first (100%). | Logistic Regression 100%, Decision Tree 88%, Naive Bayes 88%, K-Nearest Neighbors (KNN) 63%, Random Forest 50% | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-11 | No candidate | Task: classification; Data: image; Size: medium; Priorities: none | No model supports image data. Show the "No model in the reference library..." message with a tip about extracting numerical features. No crash. | No candidates. Message: "No model in the reference library supports classification with image data." + tip | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-12 | No candidate | Task: regression; Data: text; Size: small; Priorities: none | No regression model supports text data. Show the no-candidate message with a tip about word counts. No crash. | No candidates. Message: "No model in the reference library supports regression with text data." + tip | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-13 | Limited candidate | Task: clustering; Data: categorical; Size: small; Priorities: none | K-Means is excluded for categorical data, so only Hierarchical Clustering remains (needs preparation): 30 of 40 (75%). A note says only one model fits and comparison is not available. | Hierarchical Clustering 75%. Message: "Only one model in the reference library fits these requirements, so a comparison is not available." | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-14 | Limited candidate | Task: anomaly_detection; Data: categorical; Size: medium; Priorities: Fast training/prediction | Only Isolation Forest supports categorical data for anomaly detection (needs preparation): 50 of 60 (83%). Note says comparison is not available. | Isolation Forest 83%. Message: "Only one model in the reference library fits these requirements, so a comparison is not available." | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-15 | Priorities: none | Task: classification; Data: numerical; Size: small; Priorities: none | No priorities selected: ranking uses data fit and size fit only (max 40 points). Random Forest is "ok" for small data, so it scores 30 of 40 (75%); the other four score 100%. | Decision Tree 100%, K-Nearest Neighbors (KNN) 100%, Logistic Regression 100%, Naive Bayes 100%, Random Forest 75% | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-16 | Binary classification | Task: binary_classification; Data: text; Size: small; Priorities: Interpretability | Text data: Logistic Regression and Naive Bayes only. Both 50 of 60 (83%); tie ordered by model id (Logistic Regression first). | Logistic Regression 83%, Naive Bayes 83% | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-17 | Limited candidate | Task: clustering; Data: text; Size: large; Priorities: Fast training/prediction | Only K-Means supports text clustering (after preparation): 50 of 60 (83%). Comparison not available. | K-Means Clustering 83%. Message: "Only one model in the reference library fits these requirements, so a comparison is not available." | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-18 | No candidate | Task: anomaly_detection; Data: image; Size: small; Priorities: none | No anomaly-detection model supports image data. No-candidate message shown. | No candidates. Message: "No model in the reference library supports anomaly detection with image data." + tip | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-19 | Priorities | Task: regression; Data: numerical; Size: large; Priorities: Easy to understand, Fast training/prediction, Interpretability, Good performance, Non-linear relationships, Simple baseline | All six priorities selected (max 160 points). Four regression models; hand calculation: Decision Tree 120 (75%), Linear Regression 120 (75%), KNN 110 (69%), Random Forest 90 (56%). | Decision Tree 75%, Linear Regression 75%, K-Nearest Neighbors (KNN) 69%, Random Forest 56% | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-20 | Binary classification | Task: binary_classification; Data: mixed; Size: large; Priorities: Good performance, Non-linear relationships | Mixed data, large dataset, performance and non-linear priorities. Random Forest ranks first (88%); Decision Tree second (75%); the three models needing preparation score 50%. | Random Forest 88%, Decision Tree 75%, K-Nearest Neighbors (KNN) 50%, Logistic Regression 50%, Naive Bayes 50% | Passed (R, JavaScript and an independent Python check gave identical results) |

## B. Invalid or incomplete input

| ID | Category | Input | Expected behavior | Actual result | Status |
|----|----------|-------|-------------------|---------------|--------|
| TC-21 | Invalid input | Task: (empty); Data: (empty); Size: (empty); Priorities: none | No analysis is run. Three messages: "Please select a task type.", "Please select a data type.", "Please select a dataset size." | Please select a task type. / Please select a data type. / Please select a dataset size. | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-22 | Invalid input | Task: (empty); Data: numerical; Size: small; Priorities: none | Message "Please select a task type." only. | Please select a task type. | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-23 | Invalid input | Task: regression; Data: (empty); Size: small; Priorities: none | Message "Please select a data type." only. | Please select a data type. | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-24 | Invalid input | Task: regression; Data: numerical; Size: (empty); Priorities: none | Message "Please select a dataset size." only. | Please select a dataset size. | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-25 | Invalid input | Task: foo; Data: numerical; Size: small; Priorities: none | Message "Task type 'foo' is not recognised." | Task type 'foo' is not recognised. | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-26 | Invalid input | Task: regression; Data: numerical; Size: small; Priorities: speed | Message "Priority 'speed' is not recognised." (valid code is "fast"). | Priority 'speed' is not recognised. | Passed (R, JavaScript and an independent Python check gave identical results) |

## C. Model comparison

Candidate list used: Classification, Numerical, Medium, priority "Easy to understand" (5 candidates).

| ID | Category | Input (models selected) | Expected behavior | Actual result | Status |
|----|----------|-------------------------|-------------------|---------------|--------|
| TC-C1 | Comparison | Decision Tree, Random Forest | Side-by-side table with 2 columns of the selected models (task, main strength, main consideration, interpretability, speed, typical use, match score). | Table produced with the two models. | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-C2 | Comparison | Decision Tree only | Message "Please select at least two models to compare." No table. | Message shown, no table. | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-C3 | Comparison | nothing selected | Same message as TC-C2. | Message shown, no table. | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-C4 | Comparison | Decision Tree selected twice | Duplicates count once, so the same "at least two" message appears. | Message shown, no table. | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-C5 | Comparison | Decision Tree, Z-Score Outlier Detection (not a candidate for this problem) | Message "Model 'zscore_outlier' is not in the candidate list." | Message shown, no table. | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-C6 | Comparison | KNN, Naive Bayes, Decision Tree | Table with the three models, listed in ranking order. | Table produced with 3 models (Decision Tree, KNN and Naive Bayes in ranking order). | Passed (R, JavaScript and an independent Python check gave identical results) |

## D. Understanding the problem (task suggestion from a sentence)

| ID | Category | Input sentence | Expected behavior | Actual result | Status |
|----|----------|----------------|-------------------|---------------|--------|
| TC-S1 | Problem understanding | I want to predict whether a customer will leave. | Suggests binary classification (words "whether", "leave"). | Suggested task type: Binary classification (predict Yes/No). Matched words: whether, leave. | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-S2 | Problem understanding | I want to predict house prices. | Suggests regression (word "price"). | Suggested task type: Regression (predict a number). Matched words: price. | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-S3 | Problem understanding | I want to group similar customers. | Suggests clustering. | Suggested task type: Clustering (group similar records). Matched words: group, similar. | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-S4 | Problem understanding | Find unusual transactions in my bank data | Suggests anomaly detection. | Suggested task type: Anomaly detection (find unusual records). Matched words: unusual. | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-S5 | Problem understanding | I want to classify flowers by species | Suggests classification. | Suggested task type: Classification (predict a category). Matched words: classify, species. | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-S6 | Problem understanding | Help me with my project | No suggestion; user is asked to choose. | No task type could be suggested from this description. Please choose a task type yourself. | Passed (R, JavaScript and an independent Python check gave identical results) |
| TC-S7 | Problem understanding | (empty or spaces only) | Message asking the user to describe the problem. | Please describe your problem first. | Passed (R, JavaScript and an independent Python check gave identical results) |

## E. Website interface (simulated browser)

| ID | Test | Expected behavior | Actual result | Status |
|----|------|-------------------|---------------|--------|
| TC-U1 | Open index.html | Home view shown; no script errors. | Home view shown; no script errors. | Passed (simulated browser) |
| TC-U2 | Click "Start Analysis" | Problem setup view with 5 task, 5 data-type and 3 size options. | As expected. | Passed (simulated browser) |
| TC-U3 | Click "Next" with nothing selected | Stays on setup; error text lists the three missing choices. | Stayed on setup; message: "Please select a task type. Please select a data type. Please select a dataset size." | Passed (simulated browser) |
| TC-U4 | Type "I want to predict whether a customer will leave", click "Suggest a task type" | Binary classification option becomes selected. | Option selected; suggestion message shown. | Passed (simulated browser) |
| TC-U5 | Select Regression + Numerical + Medium, Next, tick Easy + Interpretability, Analyze | Analysis view with 3 analysis steps and "4 potentially suitable model(s) found." | As expected. | Passed (simulated browser) |
| TC-U6 | Show model options | 4 cards; first is Decision Tree at 100%; each card has "Why it may fit", "Strengths", "Considerations". | As expected. | Passed (simulated browser) |
| TC-U7 | Comparison with 0 and 1 model ticked | Error message "at least two"; no table. | As expected. | Passed (simulated browser) |
| TC-U8 | Comparison with 3 models ticked | Table with 8 rows and 3 model columns plus a note that no single model is the winner. | Table 8 rows x 4 columns (1 label column + 3 models); note present. | Passed (simulated browser) |
| TC-U9 | Final guidance | Shows requirements, approaches, trade-offs and the reminder to evaluate on real data. | All four parts present; task shown as "Regression (predict a number)". | Passed (simulated browser) |
| TC-U10 | Start over | Returns to home; all options cleared. | As expected. | Passed (simulated browser) |
| TC-U11 | Classification + Image + Small, Analyze | Analysis view shows the no-candidate error; "Show model options" button hidden. | As expected. | Passed (simulated browser) |
| TC-U12 | Clustering + Categorical, then open results | Compare button disabled; message "Only one model...". | As expected. | Passed (simulated browser) |

## F. R component run

| ID | Test | Expected behavior | Actual result | Status |
|----|------|-------------------|---------------|--------|
| TC-R1 | `Rscript R/main.R` from the project folder | Runs the 5-part demonstration without errors and prints ranked candidates, a comparison, the guidance summary and the problem examples. | Ran without errors (R 4.3.3). | Passed (build session) |
| TC-R2 | `Rscript main.R classification numerical small` from inside the `R/` folder | Works from the R/ folder too. | Ran without errors; 5 candidates listed. | Passed (build session) |
| TC-R3 | `Rscript R/main.R regression numerical small easy,interpretable` | Prints analysis steps, ranking and the guidance summary. | Ran as expected (Decision Tree 100%, Linear Regression 100%, KNN 88%, Random Forest 50%). | Passed (build session) |
| TC-R4 | `Rscript R/main.R foo` | Prints the input problems; no crash. | Printed 3 messages; no crash. | Passed (build session) |

## G. Manual tests (still to be done by you)

| ID | Test | Expected behavior | Actual result | Status |
|----|------|-------------------|---------------|--------|
| TC-M1 | Open `web/index.html` by double-clicking it in Chrome or Edge | Page opens; all steps work; no error in the browser console (F12). | (to be filled in) | **Pending - manual** |
| TC-M2 | Repeat the full flow of TC-U5 to TC-U9 in the browser | Same results as the simulated test. | (to be filled in) | **Pending - manual** |
| TC-M3 | Narrow the browser window to phone width (or use the device toolbar, F12) | Layout stays readable; the comparison table scrolls sideways inside its own area instead of breaking the page. | (to be filled in) | **Pending - manual** |
| TC-M4 | Navigate with the keyboard only (Tab, Space, Enter) | All options and buttons can be reached and used. | (to be filled in) | **Pending - manual** |
| TC-M5 | Click "Print or save as PDF" on the final page | Print preview shows the guidance without buttons. | (to be filled in) | **Pending - manual** |
| TC-M6 | Run `Rscript R/main.R` on your own computer | Same output as TC-R1. | (to be filled in) | **Pending - manual** |
| TC-M7 | Open the deployed GitHub Pages address | The site loads and works like the local copy. | (to be filled in) | **Pending - manual** |
