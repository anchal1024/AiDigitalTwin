from flask import Blueprint, request, jsonify, Flask
import google.generativeai as genai
from datetime import datetime
import os
import json
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables
load_dotenv()

# Get API key from environment variables - NEVER hardcode API keys
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is not set")

# Initialize Blueprint
executive_agent = Blueprint('executive_agent', __name__)
# Configure Gemini
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-pro')

class EmailAnalyzer:
    def __init__(self, email_content, sender_email=''):
        if not email_content:
            raise ValueError("Email content cannot be empty")
        self.email_content = email_content
        self.sender_email = sender_email
        self.model = model
    
    def analyze_email(self):
        """Perform comprehensive email analysis in a single Gemini call"""
        prompt = f"""
        Analyze this email comprehensively and return ONLY a JSON object with the following structure:
        
        Remember this carefully !!
        If the mail mentions anything about a meeting then include it in the calendar segment and exclude it from the tasks segment.

        {{
            "nlp_analysis": {{
                "key_topics": [],
                "named_entities": {{
                    "people": [],
                    "organizations": [],
                    "locations": []
                }},
                "tone": "",
                "action_items": [],
                "important_dates": []
            }},
            "priority_analysis": {{
                "priority_score": 0,
                "priority_reasons": []
            }},
            "content_segments": {{
                "tasks": [],
                "calendar": [],
                "others": []
            }},
            "spam_analysis": {{
                "spam_score": 0,
                "spam_reasons": []
            }},
            "authority_analysis": {{
                "is_internal": false,
                "authority_level": "",
                "priority_multiplier": 1.0,
                "red_flags": []
            }}
        }}
        
        Fill in the above structure based on analyzing this email content: {self.email_content}
        For the sender email: {self.sender_email}

        Important: Return ONLY the JSON object with no additional text, markdown formatting, or explanation.
        """
        
        response = self.model.generate_content(prompt)
        analysis_results = self._parse_response(response)
        
        # Modified calendar meetings prompt to enforce JSON structure
        calendar_prompt = f"""
        Extract all calendar meetings from this email and return them in this exact JSON format:
        {{
            "meetings": []
        }}
        If no meetings are found, return an empty array.

        Email content: {self.email_content}

        Return ONLY the JSON object.
        """
        
        tasks_prompt = f"""
        Extract all tasks from this email and return them in this exact JSON format:
        {{
            "tasks": []
        }}
        
        For each task include:
        - name: task description
        - due_date: deadline if specified (optional)

        Email content: {self.email_content}

        Return ONLY the JSON object.
        """
        
        calendar_response = self.model.generate_content(calendar_prompt)
        tasks_response = self.model.generate_content(tasks_prompt)
        
        # Parse calendar meetings with better error handling
        calendar_data = self._parse_response(calendar_response)
        if isinstance(calendar_data, dict) and 'meetings' in calendar_data:
            analysis_results['calendar_meetings'] = calendar_data['meetings']
        else:
            analysis_results['calendar_meetings'] = []

        # Parse tasks with better error handling
        tasks_data = self._parse_response(tasks_response)
        if isinstance(tasks_data, dict) and 'tasks' in tasks_data:
            analysis_results['notion_tasks'] = tasks_data['tasks']
        else:
            analysis_results['notion_tasks'] = []
        
        return analysis_results
    
    def _parse_response(self, response):
        """Parse the response from the model and handle errors."""
        try:
            # Get the raw text content from the response
            response_text = response.text
            
            # Remove any potential markdown code block indicators
            cleaned_text = response_text.replace("```json", "").replace("```", "").strip()
            
            # If the cleaned text is empty or indicates no data, return empty structure
            if not cleaned_text or "no calendar meeting" in cleaned_text.lower():
                return {"meetings": []}
            
            # Try to parse the JSON
            return json.loads(cleaned_text)
                
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {str(e)} for text: {response_text}")
            return {"meetings": []}
        except Exception as e:
            print(f"General parsing error: {str(e)}")
            return {"meetings": []}

# Create Flask app instance
app = Flask(__name__)
CORS(app)

@executive_agent.route('/analyze_email', methods=['POST'])
def analyze_email():
    try:
        data = request.get_json()
        email_content = data.get('email_content')
        sender_email = data.get('sender_email', '')
        
        if not email_content:
            return jsonify({'error': 'No email content provided'}), 400
            
        analyzer = EmailAnalyzer(email_content, sender_email)
        analysis_results = analyzer.analyze_email()
            
        # Calculate final priority score
        if 'priority_analysis' in analysis_results and 'authority_analysis' in analysis_results:
            final_priority_score = min(
                analysis_results['priority_analysis']['priority_score'] * 
                analysis_results['authority_analysis']['priority_multiplier'],
                100
            )
            analysis_results['final_priority_score'] = final_priority_score
            
        response = {
            'timestamp': datetime.now().isoformat(),
            'analysis': analysis_results
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@executive_agent.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

app.register_blueprint(executive_agent)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5009)