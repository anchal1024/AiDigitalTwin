from flask import Flask, request, jsonify
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain import hub
from langchain_openai import ChatOpenAI
from composio_langchain import ComposioToolSet
import os
from dotenv import load_dotenv
from flask_cors import CORS
from pymongo import MongoClient
import re
from bson import json_util
import json

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()

# Get API keys from environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
FRIEND_API_KEY = os.getenv('FRIEND_API_KEY')
YOUR_API_KEY = os.getenv('YOUR_API_KEY')
FRIEND_EMAIL = os.getenv('FRIEND_EMAIL')

# Set OpenAI API key
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

def initialize_agent():
    llm = ChatOpenAI()
    prompt = hub.pull("hwchase17/openai-functions-agent")
    
    your_toolset = ComposioToolSet(api_key=YOUR_API_KEY)
    
    gmail_tools = ['GMAIL_SEND_EMAIL', 'GMAIL_CREATE_EMAIL_DRAFT']
    google_docs_tools = [
        'GOOGLEDOCS_CREATE_DOCUMENT',
        'GOOGLEDOCS_UPDATE_EXISTING_DOCUMENT',
        'GOOGLEDOCS_GET_DOCUMENT_BY_ID',
        'GOOGLEDOCS_CREATE_DOCUMENT_MARKDOWN',
        'GOOGLEDOCS_UPDATE_DOCUMENT_MARKDOWN'
    ]
    
    your_tools = your_toolset.get_tools(actions=[*google_docs_tools, *gmail_tools])
    your_agent = create_openai_functions_agent(llm, your_tools, prompt)
    return AgentExecutor(agent=your_agent, tools=your_tools, verbose=True)

def extract_email(text):
    """Extract email addresses from text using regex."""
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(email_pattern, text)
    return emails

@app.route('/create-doc', methods=['POST'])
def create_document():
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        
        # Extract emails from prompt
        emails = extract_email(prompt)
        # If no email found in prompt, use default
        email_list = emails if emails else [FRIEND_EMAIL]
        
        executor = initialize_agent()
        
        # Create document based on prompt
        doc_result = executor.invoke({"input": prompt})
        
        # Send email to all found recipients
        email_results = []
        for email in email_list:
            email_task = f"""
            Send an email to {email} with:
            Subject: Important Document
            Body: Here is the important document content:

            {doc_result['output']}
            """
            email_result = executor.invoke({"input": email_task})
            email_results.append(email_result['output'])
        
        return jsonify({
            "status": "success",
            "doc_result": doc_result['output'],
            "email_results": email_results,
            "recipients": email_list
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    
def get_database():
    try:
        mongo_url = os.getenv('MONGO_URL')
        if not mongo_url:
            raise ValueError("MONGO_URI not found in environment variables")
            
        client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
        # Force a connection to verify it works
        client.server_info()
        print("MongoDB connected successfully")  # Debug print
        return client.get_database("SPIT_HACK")
    except Exception as e:
        print(f"MongoDB Connection Error: {e}")
        return None

db = get_database()
print(db)

@app.route('/get-user-records', methods=['GET'])
def get_user_records():
    print("Starting get_user_records function")  # Debug print
    try:
        if db is None:
            return jsonify({
                "status": "error",
                "message": "Database connection not available"
            }), 500

        # Print available collections
        print("Available collections:", db.list_collection_names())  # Debug print
        
        # Get the user_data collection
        collection = db.user_data
        
        # Print total documents in collection
        print("Total documents in collection:", collection.count_documents({}))  # Debug print
        
        # Fetch all documents and handle ObjectId serialization
        user_records = json.loads(json_util.dumps(list(collection.find({"user_id": "U024"}))))

        print("Found records:", len(user_records))  # Debug print

        # if db != None:
        #     db.client.close()
        #     print("MongoDB connection closed")

        return jsonify({
            "status": "success",
            "count": len(user_records),
            "data": user_records
        })
        
        

    except Exception as e:
        print(f"Error in get_user_records: {str(e)}")  # Debug print
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5002)
