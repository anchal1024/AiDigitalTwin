import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report
from xgboost import XGBClassifier
from sklearn.model_selection import GridSearchCV
from imblearn.over_sampling import SMOTE

def generate_data(num_records=1000):
    # Define more realistic relationships between features
    agents = ["Executive Assistant", "Task Management", "Calendar Agent"]
    task_types = {
        "Executive Assistant": ["Schedule Meeting", "Send Email", "Generate Summary"],
        "Task Management": ["Assign Task", "Track Progress", "Send Reminder"],
        "Calendar Agent": ["Update Event", "Resolve Conflict", "Send Confirmation"]
    }
    
    data = []
    start_time = datetime(2025, 2, 1, 8, 0, 0)
    
    # Create consistent user behaviors
    user_preferences = {}
    for i in range(1, 51):
        user_id = f"U{i:03d}"
        user_preferences[user_id] = {
            'preferred_agent': random.choice(agents),
            'preferred_language': random.choice(["English", "Spanish", "French", "German", "Chinese"]),
            'typical_priority': random.choice(["Low", "Medium", "High"])
        }
    
    for i in range(num_records):
        user_id = f"U{random.randint(1, 50):03d}"
        preferences = user_preferences[user_id]
        
        # Make agent selection biased towards user preference
        if random.random() < 0.8:  # 80% chance to use preferred agent
            agent = preferences['preferred_agent']
        else:
            agent = random.choice(agents)
            
        # Select task based on agent
        task = random.choice(task_types[agent])
        
        # Generate timestamp with realistic patterns
        hour = random.choices(
            range(24),
            weights=[1]*6 + [4]*8 + [3]*4 + [2]*6,  # Higher weights during work hours
            k=1
        )[0]
        
        timestamp = start_time + timedelta(
            days=random.randint(0, 30),
            hours=hour,
            minutes=random.randint(0, 59)
        )
        
        # Create correlations between features
        priority = preferences['typical_priority']
        if priority == "High":
            response_time = random.randint(1, 5)  # Faster response for high priority
        else:
            response_time = random.randint(3, 10)
            
        # Duration based on task type
        if "Meeting" in task or "Summary" in task:
            duration = random.randint(300, 600)
        else:
            duration = random.randint(60, 300)
            
        # Status influenced by duration and priority
        if duration > 400 and priority == "High":
            status_weights = [0.7, 0.2, 0.1]  # More likely to be completed
        else:
            status_weights = [0.6, 0.3, 0.1]
        status = random.choices(
            ["Completed", "In Progress", "Failed"],
            weights=status_weights,
            k=1
        )[0]
        
        # Feedback correlated with status
        if status == "Completed":
            feedback = round(random.uniform(4.0, 5.0), 1)
        elif status == "In Progress":
            feedback = round(random.uniform(3.5, 4.5), 1)
        else:
            feedback = round(random.uniform(3.0, 4.0), 1)
        
        data.append([
            user_id,
            f"S{100 + i}",
            timestamp,
            hour,
            timestamp.weekday(),
            agent,
            task,
            duration,
            status,
            priority,
            response_time,
            feedback,
            preferences['preferred_language'],
            round(random.uniform(-1.0, 1.0), 2),
            "Yes" if priority == "High" else random.choice(["Yes", "No"])
        ])
    
    return pd.DataFrame(data, columns=[
        "user_id", "session_id", "timestamp", "hour_of_day", "day_of_week",
        "agent_used", "task_type", "interaction_duration", "completion_status",
        "priority_level", "response_time", "feedback_score", "language",
        "sentiment_score", "follow_up_required"
    ])

def prepare_features(data, target="task_type"):
    # Create feature engineering pipeline
    df = data.copy()
    
    # Add time-based features
    df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
    df['is_work_hours'] = df['hour_of_day'].apply(lambda x: 1 if 9 <= x <= 17 else 0)
    
    # Create interaction features
    df['efficiency_score'] = df['interaction_duration'] / df['response_time']
    
    # Encode categorical features
    label_encoders = {}
    categorical_features = [
        "agent_used", "completion_status", "priority_level",
        "language", "follow_up_required"
    ]
    
    # First encode the target variable
    target_encoder = LabelEncoder()
    y = target_encoder.fit_transform(df[target])
    label_encoders['target'] = target_encoder
    
    # Then encode other categorical features
    for column in categorical_features:
        le = LabelEncoder()
        df[column] = le.fit_transform(df[column])
        label_encoders[column] = le
    
    # Scale numerical features
    scaler = StandardScaler()
    numerical_features = [
        'hour_of_day', 'day_of_week', 'interaction_duration',
        'response_time', 'feedback_score', 'sentiment_score',
        'efficiency_score'
    ]
    df[numerical_features] = scaler.fit_transform(df[numerical_features])
    
    # Define features to use
    feature_columns = (
        categorical_features + numerical_features +
        ['is_weekend', 'is_work_hours']
    )
    
    return df[feature_columns], y, label_encoders

def train_model(X, y):
    # Handle class imbalance
    smote = SMOTE(random_state=42)
    X_resampled, y_resampled = smote.fit_resample(X, y)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_resampled, y_resampled, test_size=0.2, random_state=42
    )
    
    # Define broader hyperparameter search
    param_grid = {
        'n_estimators': [100, 200, 300],
        'max_depth': [3, 6, 9, 12],
        'learning_rate': [0.01, 0.05, 0.1],
        'min_child_weight': [1, 3, 5],
        'subsample': [0.8, 0.9, 1.0]
    }
    
    # Perform grid search with cross-validation
    model = XGBClassifier(random_state=42)
    grid_search = GridSearchCV(
        estimator=model,
        param_grid=param_grid,
        cv=5,
        scoring='accuracy',
        n_jobs=-1
    )
    grid_search.fit(X_train, y_train)
    
    # Evaluate model
    best_model = grid_search.best_estimator_
    y_pred = best_model.predict(X_test)
    
    print("Model Performance:")
    print(f"Best parameters: {grid_search.best_params_}")
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.3f}")
    print("\nDetailed Classification Report:")
    print(classification_report(y_test, y_pred))
    
    return best_model, (X_test, y_test)

# Generate and prepare data
print("Generating data...")
data = generate_data(1000)

print("Preparing features...")
X, y, encoders = prepare_features(data)

print("Training model...")
model, (X_test, y_test) = train_model(X, y)

# Save the model and encoders for future use
print("Saving model and encoders...")
import joblib
joblib.dump(model, 'task_prediction_model.joblib')
joblib.dump(encoders, 'feature_encoders.joblib')

# Example prediction function
def predict_task(input_features, model, encoders):
    # Prepare input features similar to training data
    input_df = pd.DataFrame([input_features])
    
    # Encode categorical features
    for col in input_df.columns:
        if col in encoders:
            input_df[col] = encoders[col].transform(input_df[col])
    
    # Make prediction
    pred_encoded = model.predict(input_df)[0]
    prediction = encoders['target'].inverse_transform([pred_encoded])[0]
    
    return prediction

print("Setup complete!")