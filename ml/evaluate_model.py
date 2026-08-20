import os
import json

def load_metrics():
    metrics_path = os.path.join(os.path.dirname(__file__), "models", "metrics.json")
    if not os.path.exists(metrics_path):
        from train_model import train_and_evaluate
        return train_and_evaluate()
    with open(metrics_path, "r") as f:
        return json.load(f)

def print_evaluation_summary():
    metrics = load_metrics()
    print("==========================================================")
    print(f"Model: {metrics['model_name']}")
    print(f"Dataset: {metrics['dataset_name']}")
    print(f"Total Samples: {metrics['total_samples']} (Train: {metrics['training_samples']}, Test: {metrics['testing_samples']})")
    print(f"Accuracy:  {metrics['accuracy']*100:.2f}%")
    print(f"Precision: {metrics['precision']*100:.2f}%")
    print(f"Recall:    {metrics['recall']*100:.2f}%")
    print(f"F1-Score:  {metrics['f1_score']*100:.2f}%")
    print("==========================================================")
    print("\nConfusion Matrix:")
    labels = metrics['class_labels']
    cm = metrics['confusion_matrix']
    print(f"{'Actual / Pred':<15}" + "".join([f"{l:>12}" for l in labels]))
    for i, row in enumerate(cm):
        print(f"{labels[i]:<15}" + "".join([f"{val:>12}" for val in row]))
        
    print("\nFeature Importances:")
    for item in metrics['feature_importances']:
        print(f" - {item['feature']:<30}: {item['percentage']}%")

if __name__ == "__main__":
    print_evaluation_summary()
