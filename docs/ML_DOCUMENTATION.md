# UrbanPulse — Machine Learning Pipeline & Methodology Documentation

---

## 1. Problem Formulation

Municipal micro-issues (potholes, pipeline leaks, garbage, drain blocks) exhibit non-linear escalation behaviors governed by spatial clustering, unaddressed duration, traffic stress, and ambient weather.

UrbanPulse frames escalation prediction as a **Multi-Class Supervised Classification & Risk Calibration Problem**:
- **Target Variable**: `priority_level` $\in \{ \text{LOW}, \text{MEDIUM}, \text{HIGH}, \text{CRITICAL} \}$
- **Continuous Metric**: `escalation_probability` $\in [0\%, 100\%]$ derived from calibrated class posterior probabilities.

---

## 2. Dataset Architecture

- **Dataset Label**: `Synthetic Prototype Dataset — For Development and Demonstration`
- **Total Records**: 1,500 structured observations.
- **Partitioning**: 80% Training (1,200 records) / 20% Testing (300 records) with stratified sampling.

### Feature Specification:
| Feature Name | Data Type | Value Range / Categories | Description |
| :--- | :--- | :--- | :--- |
| `issue_type` | Categorical | Pothole, Water Leakage, Garbage, etc. | Infrastructure domain category |
| `current_severity` | Numerical | 1 to 5 | Initial physical severity scale |
| `days_unresolved` | Numerical | 0 to 30 days | Time elapsed without municipal intervention |
| `nearby_reports` | Numerical | 0 to 25 | Spatial cluster density within ~2km radius |
| `frequency_last_7_days`| Numerical | 1 to 20 | Recurrence frequency in immediate sector |
| `frequency_change_percentage` | Numerical | -40.0% to +150.0% | Week-over-week frequency surge |
| `traffic_level` | Categorical | Low, Medium, High, Very High | Vehicular corridor density |
| `population_density` | Categorical | Low, Medium, High, Very High | Zonal pedestrian density |
| `location_risk_score` | Numerical | 1 to 10 | Sector vulnerability baseline |
| `historical_escalations`| Numerical| 0 to 10 | Past documented failures at location |
| `weather_factor` | Categorical | Clear, Moderate Rain, Heavy Rain, Storm | Adverse environmental compounder |

---

## 3. Preprocessing & Encoding Pipeline

1. **Categorical Features**: Encoded using `LabelEncoder` (`issue_type`, `traffic_level`, `population_density`, `weather_factor`).
2. **Numerical Features**: Scaled using `StandardScaler` to normalize mean and unit variance.
3. **Pipeline Artifacts**: Saved as `ml/models/preprocessor.joblib`.

---

## 4. Machine Learning Algorithm: Random Forest Classifier

### Why Random Forest?
- **Non-linear interactions**: Naturally captures complex compounding rules (e.g. Drainage + Heavy Rain + High Duration).
- **Resistance to Overfitting**: Bootstrap aggregating (bagging) over 120 decision trees.
- **Explainability**: Direct Gini-impurity feature importance computation.
- **Calibrated Class Probabilities**: Enables smooth conversion from discrete tree votes to continuous `escalation_probability` percentage.

### Hyperparameters:
```python
RandomForestClassifier(
    n_estimators=120,
    max_depth=12,
    min_samples_split=4,
    min_samples_leaf=2,
    random_state=42,
    class_weight="balanced"
)
```

---

## 5. Actual Empirical Evaluation Metrics

Evaluated on 300 held-out test samples:

- **Overall Accuracy**: **62.33%**
- **Weighted Precision**: **61.63%**
- **Weighted Recall**: **62.33%**
- **Weighted F1-Score**: **61.64%**

### 4x4 Confusion Matrix (Test Set):
```
Actual \ Predicted       LOW      MEDIUM        HIGH    CRITICAL
LOW                       69          15           0           0
MEDIUM                    24          57          19           2
HIGH                       0          21          30          21
CRITICAL                   0           1          10          31
```

### Feature Importance Rankings:
1. `days_unresolved` (**15.69%**)
2. `current_severity` (**14.23%**)
3. `frequency_change_percentage` (**12.61%**)
4. `nearby_reports` (**10.96%**)
5. `frequency_last_7_days` (**9.44%**)
6. `historical_escalations` (**8.89%**)
7. `location_risk_score` (**8.22%**)
8. `weather_factor` (**5.49%**)
9. `issue_type` (**5.33%**)
10. `traffic_level` (**5.11%**)
11. `population_density` (**4.04%**)

---

## 6. Escalation Probability & Action Formula

The continuous escalation risk is computed from the tree posterior probabilities:

$$\text{Risk}_{\text{raw}} = \sum_{c \in \{\text{LOW}, \text{MED}, \text{HIGH}, \text{CRIT}\}} P(c) \cdot W_c$$

Where $W = [0.08, 0.38, 0.78, 1.00]$.
A severity offset is applied: $\text{Risk} = \text{clip}(\text{Risk}_{\text{raw}} + (\text{Severity} - 3) \times 3.5, 5\%, 98.5\%)$.