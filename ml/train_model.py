import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
from preprocessing import UrbanPulsePreprocessor, PRIORITY_MAPPING, REVERSE_PRIORITY_MAPPING

def train_and_evaluate(dataset_path=None, models_dir=None):
    if dataset_path is None:
        dataset_path = os.path.join(os.path.dirname(__file__), "dataset", "synthetic_micro_issues.csv")
    if models_dir is None:
        models_dir = os.path.join(os.path.dirname(__file__), "models")
        
    os.makedirs(models_dir, exist_ok=True)
    
    print(f"Loading dataset from {dataset_path}...")
    df = pd.read_csv(dataset_path)
    
    # Preprocessing
    preprocessor = UrbanPulsePreprocessor()
    X = preprocessor.fit_transform(df)
    y = df["priority_level"].map(PRIORITY_MAPPING).values
    
    # Train / Test Split 80/20
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    print(f"Training samples: {len(X_train)} | Testing samples: {len(X_test)}")
    
    # Train Random Forest Classifier
    rf_model = RandomForestClassifier(
        n_estimators=120,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        class_weight="balanced"
    )
    rf_model.fit(X_train, y_train)
    
    # Predictions on test set
    y_pred = rf_model.predict(X_test)
    
    # Compute genuine metrics
    acc = float(accuracy_score(y_test, y_pred))
    prec_weighted = float(precision_score(y_test, y_pred, average="weighted"))
    rec_weighted = float(recall_score(y_test, y_pred, average="weighted"))
    f1_weighted = float(f1_score(y_test, y_pred, average="weighted"))
    
    prec_macro = float(precision_score(y_test, y_pred, average="macro"))
    rec_macro = float(recall_score(y_test, y_pred, average="macro"))
    f1_macro = float(f1_score(y_test, y_pred, average="macro"))
    
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    # Per-class metrics
    class_labels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    prec_per_class = precision_score(y_test, y_pred, average=None).tolist()
    rec_per_class = recall_score(y_test, y_pred, average=None).tolist()
    f1_per_class = f1_score(y_test, y_pred, average=None).tolist()
    
    per_class_metrics = {}
    for i, label in enumerate(class_labels):
        per_class_metrics[label] = {
            "precision": round(float(prec_per_class[i]), 4),
            "recall": round(float(rec_per_class[i]), 4),
            "f1_score": round(float(f1_per_class[i]), 4),
            "support": int(np.sum(y_test == i))
        }
        
    # Feature Importances
    feature_names = preprocessor.feature_names
    raw_importances = rf_model.feature_importances_
    feature_importances = []
    for name, imp in sorted(zip(feature_names, raw_importances), key=lambda x: x[1], reverse=True):
        feature_importances.append({
            "feature": name,
            "importance": round(float(imp), 4),
            "percentage": round(float(imp * 100), 2)
        })
        
    metrics_data = {
        "model_name": "Random Forest Classifier",
        "dataset_name": "Synthetic Prototype Dataset — For Development and Demonstration",
        "total_samples": len(df),
        "training_samples": len(X_train),
        "testing_samples": len(X_test),
        "accuracy": round(acc, 4),
        "precision": round(prec_weighted, 4),
        "recall": round(rec_weighted, 4),
        "f1_score": round(f1_weighted, 4),
        "precision_macro": round(prec_macro, 4),
        "recall_macro": round(rec_macro, 4),
        "f1_macro": round(f1_macro, 4),
        "confusion_matrix": cm,
        "class_labels": class_labels,
        "per_class_metrics": per_class_metrics,
        "feature_importances": feature_importances,
        "hyperparameters": {
            "n_estimators": 120,
            "max_depth": 12,
            "min_samples_split": 4,
            "min_samples_leaf": 2,
            "random_state": 42
        }
    }
    
    # Save artifacts
    model_file = os.path.join(models_dir, "random_forest_model.joblib")
    preproc_file = os.path.join(models_dir, "preprocessor.joblib")
    metrics_file = os.path.join(models_dir, "metrics.json")
    
    joblib.dump(rf_model, model_file)
    joblib.dump(preprocessor, preproc_file)
    with open(metrics_file, "w") as f:
        json.dump(metrics_data, f, indent=2)
        
    print("\n================ ML TRAINING & EVALUATION REPORT ================")
    print(f"Model: {metrics_data['model_name']}")
    print(f"Accuracy:  {metrics_data['accuracy'] * 100:.2f}%")
    print(f"Precision: {metrics_data['precision'] * 100:.2f}% (Weighted)")
    print(f"Recall:    {metrics_data['recall'] * 100:.2f}% (Weighted)")
    print(f"F1-Score:  {metrics_data['f1_score'] * 100:.2f}% (Weighted)")
    print("\nConfusion Matrix:")
    print("      Predicted -> [LOW, MEDIUM, HIGH, CRITICAL]")
    for i, row in enumerate(cm):
        print(f"Actual {class_labels[i]:8s}: {row}")
    print("\nTop 5 Important Features:")
    for item in feature_importances[:5]:
        print(f" - {item['feature']}: {item['percentage']}%")
    print("=================================================================\n")
    print(f"Saved artifacts to {models_dir}")
    return metrics_data

if __name__ == "__main__":
    train_and_evaluate()
