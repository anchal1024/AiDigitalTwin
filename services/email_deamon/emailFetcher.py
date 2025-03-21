import os
import time
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from pymongo import MongoClient
import pickle
import datetime
import base64  # added import
import requests  # added import

# Load environment variables
load_dotenv()

# Environment variables
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
GMAIL_CREDENTIALS = os.getenv('GMAIL_CREDENTIALS', 'credentials.json')
CHECK_INTERVAL = int(os.getenv('CHECK_INTERVAL', 120))  # 2 minutes in seconds

class GmailMonitor:
    def __init__(self):
        # MongoDB setup
        self.client = MongoClient(MONGODB_URI)
        self.db = self.client['email_db']
        self.emails = self.db['emails']
        self.metadata = self.db['metadata']
        
        # Gmail API setup
        self.SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
        
        # Initialize last check timestamp
        self.initialize_timestamp()

        # Analysis endpoint
        self.ANALYSIS_ENDPOINT = 'http://127.0.0.1:5009/analyze_email'

    def initialize_timestamp(self):
        """Initialize or get the last check timestamp from MongoDB"""
        timestamp_doc = self.metadata.find_one({'_id': 'last_check'})
        if not timestamp_doc:
            # Start from 24 hours ago if no timestamp exists
            initial_timestamp = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
            self.metadata.insert_one({
                '_id': 'last_check',
                'timestamp': initial_timestamp
            })
            self.last_check_time = initial_timestamp
        else:
            self.last_check_time = timestamp_doc['timestamp']

    def update_timestamp(self):
        """Update the last check timestamp in MongoDB"""
        current_time = datetime.datetime.now(datetime.timezone.utc)
        self.metadata.update_one(
            {'_id': 'last_check'},
            {'$set': {'timestamp': current_time}},
            upsert=True
        )
        self.last_check_time = current_time

    def get_gmail_service(self):
        creds = None
        if os.path.exists('token.pickle'):
            with open('token.pickle', 'rb') as token:
                creds = pickle.load(token)
        
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    GMAIL_CREDENTIALS, self.SCOPES)
                creds = flow.run_local_server(port=0)
            
            with open('token.pickle', 'wb') as token:
                pickle.dump(creds, token)

        return build('gmail', 'v1', credentials=creds)

    def get_email_analysis(self, email_content, sender_email):
        print("Getting email analysis...")
        print(email_content, sender_email)
        """Get email analysis from the analysis service"""
        try:
            response = requests.post(
                self.ANALYSIS_ENDPOINT,
                json={
                    "email_content": email_content,
                    "sender_email": sender_email
                }
            )
            if response.status_code == 200:
                return response.json()
            print(f"Analysis failed with status code: {response.status_code}")
            return None
        except Exception as e:
            print(f"Error getting email analysis: {str(e)}")
            return None

    def extract_email_body(self, payload):
        """Extract email body recursively from payload parts"""
        if not payload:
            return ""

        body = ""
        
        # If this part has a body with data, decode it
        if 'body' in payload and 'data' in payload['body']:
            try:
                body += base64.urlsafe_b64decode(payload['body']['data'].encode('UTF-8')).decode('utf-8', errors='replace')
            except Exception as e:
                print(f"Error decoding body: {str(e)}")

        # If this part has sub-parts, process them recursively
        if 'parts' in payload:
            for part in payload['parts']:
                if part.get('mimeType', '').startswith('text/'):
                    body += self.extract_email_body(part)
                elif part.get('parts'):  # Handle nested multipart messages
                    body += self.extract_email_body(part)

        return body

    def fetch_new_emails(self):
        try:
            service = self.get_gmail_service()
            
            # Convert timestamp to Gmail's query format
            # Gmail API uses seconds since epoch for comparison
            after_timestamp = int(self.last_check_time.timestamp())
            query = f'after:{after_timestamp}'
            
            results = service.users().messages().list(
                userId='me',
                q=query
            ).execute()
            
            messages = results.get('messages', [])
            
            for message in messages:
                msg = service.users().messages().get(
                    userId='me',
                    id=message['id'],
                    format='full'
                ).execute()
                
                # Extract email details
                headers = msg['payload']['headers']
                subject = next(
                    (header['value'] for header in headers if header['name'].lower() == 'subject'),
                    'No Subject'
                )
                sender = next(
                    (header['value'] for header in headers if header['name'].lower() == 'from'),
                    'No Sender'
                )
                
                # Get internal date from the email (in milliseconds since epoch)
                received_date = datetime.datetime.fromtimestamp(
                    int(msg['internalDate']) / 1000,
                    tz=datetime.timezone.utc
                )
                
                # Extract full email content using the new method
                full_body = self.extract_email_body(msg['payload'])
                
                # Debug print
                print("Extracted email body:", full_body[:200], "...")  # Print first 200 chars
                
                # Get email analysis before storing
                print(full_body, sender)
                analysis_result = self.get_email_analysis(full_body, sender)
                
                # Store only if not already in database
                if not self.emails.find_one({'message_id': message['id']}):
                    email_doc = {
                        'message_id': message['id'],
                        'subject': subject,
                        'sender': sender,
                        'received_at': received_date,
                        'stored_at': datetime.datetime.now(datetime.timezone.utc),
                        'snippet': msg.get('snippet', ''),
                        'labels': msg.get('labelIds', []),
                        'full_body': full_body,  # Store as full_body instead of body
                        'analysis': analysis_result  # Add the analysis result
                    }
                    self.emails.insert_one(email_doc)
                    print(f"New email stored with analysis: {subject}")
            
            # Update the timestamp after successful fetch
            self.update_timestamp()
            
        except Exception as e:
            print(f"Error fetching emails: {str(e)}")

    def run(self):
        print("Gmail monitor started. Press Ctrl+C to stop.")
        try:
            while True:
                current_time = datetime.datetime.now(datetime.timezone.utc)
                print(f"\nChecking for new emails at {current_time}")
                print(f"Fetching emails since: {self.last_check_time}")
                self.fetch_new_emails()
                time.sleep(CHECK_INTERVAL)
        except KeyboardInterrupt:
            print("\nStopping Gmail monitor...")
            self.client.close()

if __name__ == "__main__":
    monitor = GmailMonitor()
    monitor.run()