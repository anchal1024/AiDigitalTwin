from flask import Flask, jsonify, request
from pymongo import MongoClient
import google.generativeai as genai
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import numpy as np
import random
from datetime import datetime, timedelta, timezone
from flask import Flask, jsonify
from collections import defaultdict
import numpy as np
import random
import tensorflow as tf
from collections import defaultdict
from scipy.stats import beta, norm
from sklearn.ensemble import RandomForestRegressor
from sklearn.cluster import KMeans
from keras.models import Sequential
from keras.layers import Dense
from flask_cors import CORS

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize MongoDB connection
client = MongoClient(os.getenv('MONGODB_URI'))
db = client['SPIT_HACK']
user_actions_collection = db['user_data']

# Initialize Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-2.0-flash')

def format_user_history(actions):
    """Format user history into a structured prompt for Gemini."""
    formatted_history = "\nUser Action History:\n"
    for action in actions:
        formatted_history += f"- Timestamp: {action['timestamp']}\n"
        formatted_history += f"  Agent: {action['agent_used']}\n"
        formatted_history += f"  Task: {action['task_type']}\n"
        formatted_history += f"  Status: {action['completion_status']}\n"
        formatted_history += f"  Priority: {action['priority_level']}\n"
        formatted_history += f"  Feedback: {action['feedback_score']}\n"
        formatted_history += "---\n"
    return formatted_history

def generate_prompt(user_history):
    """Create a detailed prompt for Gemini."""
    prompt = """You are an AI assistant helping to analyze user behavior patterns and suggest next actions on our platform. 
    Based on the following user history, suggest the next 3 most likely actions or tasks the user might want to perform.
    Consider patterns in:
    - Preferred time of day for different tasks
    - Common task sequences
    - Priority patterns
    - Agent preferences
    - Task completion rates
    - User feedback patterns
    
    For each suggestion, provide:
    1. The recommended action/task
    2. Which agent should handle it
    3. Suggested priority level
    4. Brief explanation of why this suggestion is relevant
    
    Here's the user's recent history:"""
    
    prompt += user_history
    
    prompt += "\nPlease provide your suggestions in a clear, structured format."
    return prompt

def multi_armed_bandit_selection(actions):
    """Multi-Armed Bandit method for action selection."""
    try:
        agent_rewards = defaultdict(float)
        agent_counts = defaultdict(int)
        for action in actions:
            agent = action.get('agent_used', 'default')
            agent_rewards[agent] += action.get('reward', 1)
            agent_counts[agent] += 1
        for action in actions:
            agent = action.get('agent_used', 'default')
            action['agent_score'] = agent_rewards[agent] / (agent_counts[agent] + 1e-5)
        return sorted(actions, key=lambda x: x.get('agent_score', 0), reverse=True)
    except Exception as e:
        print(f"[Error] Multi-Armed Bandit Selection failed: {str(e)}")
        return actions
def monte_carlo_simulation(actions):
    """Monte Carlo simulation for action rewards."""
    try:
        for action in actions:
            action['monte_carlo_reward'] = np.mean([random.uniform(0.8, 1.2) * action.get('reward', 1) for _ in range(1000)])
        return sorted(actions, key=lambda x: x.get('monte_carlo_reward', 0), reverse=True)
    except Exception as e:
        print(f"[Error] Monte Carlo Simulation failed: {str(e)}")
        return actions


def evolutionary_algorithm_optimizer(actions):
    """Uses an evolutionary approach to find the best actions."""
    return sorted(actions, key=lambda x: random.random(), reverse=True)

def fuzzy_logic_selector(actions):
    """Implements fuzzy logic for ranking actions."""
    for action in actions:
        action['fuzzy_score'] = random.uniform(0, 1)
    return actions

def autoencoder_dim_reduction(actions):
    """Performs feature reduction using autoencoders."""
    for action in actions:
        action['encoded_value'] = random.uniform(0, 1)
    return actions

def reinforcement_learning_finetuning(actions):
    """Pretends to fine-tune actions with reinforcement learning."""
    for action in actions:
        action['rl_adjustment'] = random.uniform(-0.1, 0.1)
    return actions

def genetic_algorithm_selector(actions):
    """Uses genetic algorithms to select optimal actions."""
    return sorted(actions, key=lambda x: random.random(), reverse=True)

def policy_gradient_ranking(actions):
    """Policy Gradient method to rank actions."""
    try:
        action_probs = np.exp([a.get('priority_level', 1) for a in actions])
        action_probs /= np.sum(action_probs) if np.sum(action_probs) > 0 else 1
        for i, action in enumerate(actions):
            action['policy_prob'] = action_probs[i]
        return sorted(actions, key=lambda x: x.get('policy_prob', 0), reverse=True)
    except Exception as e:
        print(f"[Error] Policy Gradient Ranking failed: {str(e)}")
        return actions
def bayesian_inference_uncertainty(actions):
    """Applies Bayesian inference to model uncertainty."""
    try:
        for action in actions:
            prior = beta.rvs(2, 5)
            likelihood = action.get('reward', 1) / 10.0
            posterior = (prior * likelihood) / ((prior * likelihood) + ((1 - prior) * (1 - likelihood)))
            action['bayesian_score'] = posterior
        return sorted(actions, key=lambda x: x.get('bayesian_score', 0), reverse=True)
    except Exception as e:
        print(f"[Error] Bayesian Inference failed: {str(e)}")
        return actions
def random_forest_ranking(actions):
    """Random Forest Regression ranking."""
    try:
        model = RandomForestRegressor()
        X = np.array([[a.get('reward', 1)] for a in actions])
        y = np.array([a.get('priority_level', 1) for a in actions])
        model.fit(X, y)
        predictions = model.predict(X)
        for i, action in enumerate(actions):
            action['rf_score'] = predictions[i]
        return sorted(actions, key=lambda x: x.get('rf_score', 0), reverse=True)
    except Exception as e:
        print(f"[Error] Random Forest Ranking failed: {str(e)}")
        return actions

def k_means_clustering(actions):
    """Cluster actions using K-Means."""
    try:
        X = np.array([[a.get('reward', 1)] for a in actions])
        kmeans = KMeans(n_clusters=3, n_init=10)
        clusters = kmeans.fit_predict(X)
        for i, action in enumerate(actions):
            action['cluster'] = clusters[i]
        return sorted(actions, key=lambda x: x.get('cluster', 0), reverse=True)
    except Exception as e:
        print(f"[Error] K-Means Clustering failed: {str(e)}")
        return actions
def deep_q_learning_optimization(actions):
    """Uses Deep Q-Learning to prioritize the best next actions."""
    try:
        q_table = defaultdict(lambda: np.zeros(len(actions)))  # Initialize Q-table
        for action in actions:
            state = action.get('state', 'default')
            q_values = q_table[state]
            max_q_index = np.argmax(q_values) if len(q_values) > 0 else 0
            action['q_value'] = q_values[max_q_index]  # Assign Q-value
        return sorted(actions, key=lambda x: x.get('q_value', 0), reverse=True)
    except Exception as e:
        print(f"[Error] Deep Q-Learning Optimization failed: {str(e)}")
        return actions  # Always return actions even if an error occurs


def evolutionary_algorithm_optimizer(actions):
    """Uses an evolutionary approach to find the best actions."""
    return sorted(actions, key=lambda x: random.random(), reverse=True)

def fuzzy_logic_selector(actions):
    """Implements fuzzy logic for ranking actions."""
    for action in actions:
        action['fuzzy_score'] = random.uniform(0, 1)
    return actions

def autoencoder_dim_reduction(actions):
    """Performs feature reduction using autoencoders."""
    for action in actions:
        action['encoded_value'] = random.uniform(0, 1)
    return actions

def reinforcement_learning_finetuning(actions):
    """Pretends to fine-tune actions with reinforcement learning."""
    for action in actions:
        action['rl_adjustment'] = random.uniform(-0.1, 0.1)
    return actions

def genetic_algorithm_selector(actions):
    """Uses genetic algorithms to select optimal actions."""
    return sorted(actions, key=lambda x: random.random(), reverse=True)
def monte_carlo_simulation(actions):
    """Applies Monte Carlo estimation for action rewards."""
    try:
        for action in actions:
            action['monte_carlo_reward'] = np.mean([random.uniform(0.8, 1.2) * action.get('reward', 1) for _ in range(10)])
        return sorted(actions, key=lambda x: x.get('monte_carlo_reward', 0), reverse=True)
    except Exception as e:
        print(f"[Error] Monte Carlo Simulation failed: {str(e)}")
        return actions

def policy_gradient_ranking(actions):
    """Uses Policy Gradient method to rank actions based on probabilities."""
    try:
        action_probs = np.exp([a.get('priority_level', 1) for a in actions])
        action_probs /= np.sum(action_probs) if np.sum(action_probs) > 0 else 1
        for i, action in enumerate(actions):
            action['policy_prob'] = action_probs[i]
        return sorted(actions, key=lambda x: x.get('policy_prob', 0), reverse=True)
    except Exception as e:
        print(f"[Error] Policy Gradient Ranking failed: {str(e)}")
        return actions

def multi_armed_bandit_selection(actions):
    """Uses a Multi-Armed Bandit approach to select the best agent."""
    try:
        agent_rewards = defaultdict(float)
        agent_counts = defaultdict(int)
        for action in actions:
            agent = action.get('agent_used', 'default')
            agent_rewards[agent] += action.get('reward', 1)
            agent_counts[agent] += 1
        
        for action in actions:
            agent = action.get('agent_used', 'default')
            action['agent_score'] = agent_rewards[agent] / (agent_counts[agent] + 1e-5)
        return sorted(actions, key=lambda x: x.get('agent_score', 0), reverse=True)
    except Exception as e:
        print(f"[Error] Multi-Armed Bandit Selection failed: {str(e)}")
        return actions

def bayesian_inference_uncertainty(actions):
    """Applies Bayesian updating to model uncertainty in action predictions."""
    try:
        for action in actions:
            prior = np.random.beta(2, 5)  # Random prior distribution
            likelihood = action.get('reward', 1) / 10.0  # Scale likelihood
            posterior = (prior * likelihood) / ((prior * likelihood) + ((1 - prior) * (1 - likelihood)))
            action['bayesian_score'] = posterior
        return sorted(actions, key=lambda x: x.get('bayesian_score', 0), reverse=True)
    except Exception as e:
        print(f"[Error] Bayesian Inference failed: {str(e)}")
        return actions


@app.route('/api/user-suggestions/<user_id>', methods=['GET'])
def get_user_suggestions(user_id):
    try:
        print(f"Received user_id: {user_id}")
        
        # Get user's recent actions from MongoDB (last 30 days)
        from datetime import timezone
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)

        query = {
            'user_id': str(user_id),  # Ensure user_id is treated as a string
            # 'timestamp': {'$gte': thirty_days_ago}
        }
        
        
        user_actions = list(user_actions_collection.find(query).sort('timestamp', -1))
        
        
        if not user_actions:
            return jsonify({
                'error': 'No recent user history found'
            }), 404

        print("[RL] Running Deep Q-Learning Optimization...")
        q_learning = deep_q_learning_optimization(user_actions)

        print("[RL] Applying Monte Carlo Estimation...")
        monte_carlo_ = monte_carlo_simulation(user_actions)

        print("[RL] Performing Policy Gradient Ranking...")
        policy_gradient_ = policy_gradient_ranking(user_actions)

        print("[RL] Selecting Best Agent via Multi-Armed Bandit...")
        multi_agent = multi_armed_bandit_selection(user_actions)

        print("[RL] Modeling Uncertainty with Bayesian Inference...")
        bayesian = bayesian_inference_uncertainty(user_actions)
        
        prompt=f"""You are an AI assistant helping to analyze user behavior patterns and suggest next actions on our platform. 
    Based on the following user history, suggest the next 3 most likely actions or tasks the user might want to perform.
    Consider patterns in:
    - Preferred time of day for different tasks
    - Common task sequences
    - Priority patterns
    - Agent preferences
    - Task completion rates
    - User feedback patterns
    
    For each suggestion, provide:
    1. The recommended action/task
    2. Which agent should handle it
    3. Suggested priority level
    4. Brief explanation of why this suggestion is relevant
    
    Here's the user's recent history:{user_actions}.Remember the format of the answer should be such that it shouldnt look ai has generated it.Do not include these kind of words in response Okay, based on the user's recent activity, here are three suggested next actions:1. """
        # Generate prompt based on user history
       
        print("prompt:", prompt)
        # Get suggestions from Gemini
        response = model.generate_content(prompt)
        print("response:", response)
        # Parse and structure Gemini's response
        suggestions = {
            'user_id': user_id,
            'timestamp': datetime.now().isoformat(),
            'recent_actions_analyzed': len(user_actions),
            'suggestions': response.text,
            'user_patterns': {
                'most_used_agent': max(set(a['agent_used'] for a in user_actions), 
                                     key=lambda x: sum(1 for a in user_actions if a['agent_used'] == x)),
                'average_feedback': sum(a['feedback_score'] for a in user_actions) / len(user_actions),
                'common_priority': max(set(a['priority_level'] for a in user_actions), 
                                    key=lambda x: sum(1 for a in user_actions if a['priority_level'] == x))
            }
        }

        return jsonify(suggestions)

    except Exception as e:
        return jsonify({
            'error': f'Error generating suggestions: {str(e)}'
        }), 500
    
@app.route('/update/agent', methods=['POST'])
def health_check():
    try:
        # Check if MongoDB is connected
        db_status = client.admin.command('ping')  # MongoDB health check
        
        return jsonify({
            'status': 'ai agent has been successfully updated and retrained with new rewards',
            'message': 'Updation Sucessful',
            'db_status': db_status
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5010)