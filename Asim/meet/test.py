from flask import Flask, request, jsonify
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain import hub
from langchain_openai import ChatOpenAI
from composio_langchain import ComposioToolSet
import os
from datetime import datetime
import pytz
from dotenv import load_dotenv
import re
from pymongo import MongoClient
from flask_cors import CORS  # Add this import

load_dotenv()

app = Flask(__name__)
CORS(app)
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

# MongoDB connection setup
client = MongoClient(os.getenv("MONGODB_URI"))
db = client.SPIT_HACK
users_collection = db.users

class MeetingScheduler:
    def __init__(self, openai_api_key, timezone="Asia/Kolkata"):
        os.environ["OPENAI_API_KEY"] = openai_api_key
        self.timezone = pytz.timezone(timezone)
        self.llm = ChatOpenAI()
        self.prompt = hub.pull("hwchase17/openai-functions-agent")
        
    def initialize_tools(self, composio_api_key):
        """Initialize tools with specific API key"""
        self.composio_toolset = ComposioToolSet(api_key=composio_api_key)
        self.tools = self.composio_toolset.get_tools(actions=[
            'GOOGLEMEET_CREATE_MEET',
            'GOOGLEMEET_GET_RECORDINGS_BY_CONFERENCE_RECORD_ID',
            'GOOGLEMEET_GET_CONFERENCE_RECORD_FOR_MEET',
            'GOOGLEMEET_GET_MEET',
            'GOOGLECALENDAR_CREATE_EVENT',
            'GOOGLECALENDAR_FIND_FREE_SLOTS',
            'GMAIL_SEND_EMAIL'
        ])
        
        self.agent = create_openai_functions_agent(self.llm, self.tools, self.prompt)
        self.agent_executor = AgentExecutor(agent=self.agent, tools=self.tools, verbose=True)

    def ensure_initialized(self, composio_api_key):
        """Ensure tools and agent_executor are initialized"""
        if not hasattr(self, 'agent_executor'):
            self.initialize_tools(composio_api_key)

    def extract_emails(self, text):
        """Extract all email addresses from text"""
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        return re.findall(email_pattern, text)

    def get_user_api_key(self, email):
        """Get API key for a specific user email from MongoDB"""
        try:
            user = users_collection.find_one({"email": email})
            if user:
                return user.get("api_key")
        except Exception as e:
            print(f"Error fetching user API key from MongoDB: {str(e)}")
        return None

    def get_current_time_context(self):
        current_time = datetime.now(self.timezone)
        return current_time.strftime("""
Current Context:
- Date: %A, %B %d, %Y
- Time: %I:%M %p %Z
- Timezone: {}""".format(self.timezone.zone))

    def get_schedule_for_day(self, email, date):
        """Get the schedule for a specific email and date"""
        # Use GOOGLECALENDAR_FIND_FREE_SLOTS to get the schedule
        schedule_prompt = f"CHECK_FREE_SLOTS for {email} on {date}"
        try:
            result = self.agent_executor.invoke({"input": schedule_prompt})
            return result
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }

    def process_meeting_request(self, user_prompt):
        default_email = "asim.shah22@spit.ac.in"
        api_key = self.get_user_api_key(default_email)
        
        if not api_key:
            return {
                "status": "error",
                "message": f"No API key found for user: {default_email}"
            }
            
        self.ensure_initialized(api_key)
        
        time_context = self.get_current_time_context()
        
        enhanced_prompt = f"""
    {time_context}

    I am your AI Meeting Assistant with access to Google Meet, Google Calendar, and Gmail. I will help you with: {user_prompt}

    Please provide the schedules for the participants mentioned in the prompt for the specified date.If the prompt is asking for a slot then decide yourself and suggest
    """
        
        try:
            result = self.agent_executor.invoke({"input": enhanced_prompt})
            
            # Modify output to always offer options
            options = ["Yes", "No"]
            alternative_slots = []  # Can be extracted dynamically if needed
            
            # Check if response contains scheduling details
            
            
            return {
                "status": "success",
                "result": result,
                "time_context": time_context,
                "primary_user": default_email,
                "suggested_actions": {
                    "confirm_meeting": options,
                    "alternative_options": alternative_slots if alternative_slots else ["Modify request"]
                }
            }
        except Exception as e:
            print(f"Error invoking agent executor: {str(e)}")
            return {
                "status": "error",
                "message": str(e),
                "time_context": time_context,
                "primary_user": default_email,
                "suggested_actions": ["Try again", "Modify request"]
            }


# Initialize the scheduler with OpenAI API key
scheduler = MeetingScheduler(openai_api_key=os.getenv("OPENAI_API_KEY"))

@app.route('/meet', methods=['POST'])
def schedule_meeting():
    try:
        data = request.json
        print(data.get('prompt'))
        if not data or 'prompt' not in data:
            return jsonify({
                "status": "error",
                "message": "No prompt provided in request body"
            }), 400
        
        result = scheduler.process_meeting_request(data['prompt'])
        return jsonify(result)
    
    except Exception as e:
        print(f"Error in /meet endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Server error: {str(e)}"
        }), 500


@app.route('/followup', methods=['POST'])
def meeting_followup():
    try:
        print("hi")
        data = request.json
        if not data or 'user_response' not in data or 'previous_input' not in data or 'previous_output' not in data:
            return jsonify({
                "status": "error",
                "message": "Missing required fields in request body"
            }), 400
        
        user_response = data['user_response']
        previous_input = data['previous_input']
        previous_output = data['previous_output']
        host_email = "asim.shah22@spit.ac.in"  # Default host

        # Get current time context
        time_context = scheduler.get_current_time_context()
        
        # Ensure tools and agent_executor are initialized
        scheduler.ensure_initialized(scheduler.get_user_api_key(host_email))
        
        # First, get the decision from OpenAI
        decision_prompt = f"""
{time_context}

Previous Request: {previous_input}

Assistant's Response: {previous_output}

User's Response: {user_response}

Please analyze this situation and respond with EXACTLY ONE of these actions:
1. CREATE_MEETING - if we should create the meeting
2. SUGGEST_TIMES - if we should find new time slots
3. CANCEL - if we should cancel the request

Respond with the action followed by any necessary details in this format:
ACTION: [action name]
DETAILS: [relevant details like time, participants, etc.]
"""
        
        # Get the decision from OpenAI
        decision_result = scheduler.agent_executor.invoke({"input": decision_prompt})
        action_output = decision_result['output']
        # Parse the action and details
        action_match = re.search(r'ACTION:\s*(.*?)\n', action_output)
        details_match = re.search(r'DETAILS:\s*(.*)', action_output, re.DOTALL)
        
        if not action_match:
            return jsonify({
                "status": "error",
                "message": "Could not determine action from AI response"
            }), 400
            
        action = action_match.group(1).strip()
        details = details_match.group(1).strip() if details_match else ""

        # Execute the appropriate action
        if action == "CREATE_MEETING":
            # Extract all emails from the previous input
            participant_emails = scheduler.extract_emails(previous_input)
            # Add host if not already in the list
            if host_email not in participant_emails:
                participant_emails.append(host_email)
                
            # Create meeting creation prompt with all participants including host
            creation_prompt = f"""
            CREATE A GOOGLE MEET with the following details:
            Host: {host_email}
            Participants: {', '.join(participant_emails)}
            {details}
            After creating the meet, send an email to all participants with the meeting link and details.
            """
            
            result = scheduler.agent_executor.invoke({"input": creation_prompt})
            
            return jsonify({
                "status": "success",
                "result": result,
                "action_taken": "CREATE_MEETING",
                "participants": participant_emails
            })
            
        elif action == "SUGGEST_TIMES":
            # Create a prompt to find available times
            suggestion_prompt = f"""
            FIND FREE SLOTS for the following participants:
            Host: {host_email}
            {details}
            Please suggest 3 alternative time slots.
            """
            
            result = scheduler.agent_executor.invoke({"input": suggestion_prompt})
            
            return jsonify({
                "status": "success",
                "result": result,
                "action_taken": "SUGGEST_TIMES",
                "suggested_actions": {
                    "options": ["Select a suggested time", "Cancel request"]
                }
            })
            
        elif action == "CANCEL":
            return jsonify({
                "status": "success",
                "message": "Meeting request cancelled",
                "action_taken": "CANCEL",
                "suggested_actions": {
                    "options": ["Start new request"]
                }
            })
            
        else:
            return jsonify({
                "status": "error",
                "message": f"Unknown action: {action}"
            }), 400
            
    except Exception as e:
        print(f"Error in /followup endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Server error: {str(e)}"
        }), 500
    

@app.route('/execute', methods=['POST'])
def meeting_execute():
    try:
        print("hi")
        data = request.json
        if not data or 'prompt' not in data:
            return jsonify({
                "status": "error",
                "message": "Missing required fields in request body"
            }), 400
        
        prompt = data['prompt']
        
        host_email = "asim.shah22@spit.ac.in"  # Default host

        # Get current time context
        time_context = scheduler.get_current_time_context()
        
        # Ensure tools and agent_executor are initialized
        scheduler.ensure_initialized(scheduler.get_user_api_key(host_email))
        
        # Simplified decision prompt focusing only on meeting creation
        decision_prompt = f"""
{time_context}

Context:
- Prompt : {prompt}
You are a meeting scheduler that MUST create a meeting. Extract or determine these details:
1. Date and time (if not specified, pick any suitable time during work hours)
2. Duration (default to 1 hour if not specified)
3. Meeting purpose/title
4. Any special requirements

Output format (use exactly this format):
DETAILS: [Include:
- Date and time (or specify "any available time during work hours")
- Duration
- Purpose/title
- Any special requirements]
"""
        
        # Get the decision from OpenAI
        decision_result = scheduler.agent_executor.invoke({"input": decision_prompt})
        action_output = decision_result['output']
        # Parse the details
        details_match = re.search(r'DETAILS:\s*(.*)', action_output, re.DOTALL)
        
        if not details_match:
            return jsonify({
                "status": "error",
                "message": "Could not extract meeting details from AI response"
            }), 400
            
        details = details_match.group(1).strip()

        # Extract participants and create meeting
        participant_emails = scheduler.extract_emails(prompt)
        if host_email not in participant_emails:
            participant_emails.append(host_email)
            
        creation_prompt = f"""
        EXECUTE: Create a Google Meet with these exact specifications:
        Host: {host_email}
        Participants: {', '.join(participant_emails)}
        Details: {details}
        
        If no specific time is mentioned, schedule for the next available time slot during work hours (9 AM - 5 PM).
        
        Required actions:
        1. Create the Google Meet event
        2. Send calendar invites to all participants
        3. Return the meeting link and confirmation
        """
        
        result = scheduler.agent_executor.invoke({"input": creation_prompt})
        
        return jsonify({
            "status": "success",
            "result": result,
            "action_taken": "CREATE_MEETING",
            "participants": participant_emails
        })
            
    except Exception as e:
        print(f"Error in /followup endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Server error: {str(e)}"
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004)