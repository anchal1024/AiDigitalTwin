from flask import Flask
from apscheduler.schedulers.background import BackgroundScheduler
from composio_langchain import ComposioToolSet
import os
import json
from datetime import datetime, timedelta
import pytz
from dotenv import load_dotenv
import logging
from typing import Set, Dict

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)

class MeetingMonitorService:
    def __init__(self):
        # Load credentials
        with open('credentials.json') as f:
            self.credentials = json.load(f)
        
        # Initialize Composio toolset
        self.composio_toolset = ComposioToolSet(api_key=os.getenv("COMPOSIO_API_KEY"))
        self.tools = self.composio_toolset.get_tools([
            'GOOGLEMEET_GET_MEET',
            'GOOGLEMEET_GET_RECORDINGS_BY_CONFERENCE_RECORD_ID',
            'GOOGLEMEET_GET_CONFERENCE_RECORD_FOR_MEET',
            'GMAIL_SEND_EMAIL'
        ])
        
        # Initialize tracking variables
        self.last_check_time = datetime.now(pytz.UTC) - timedelta(minutes=5)  # Start checking from 5 minutes ago
        self.processed_meets: Set[str] = set()
        self.meeting_participants: Dict[str, list] = {}
        
        # Initialize scheduler
        self.scheduler = BackgroundScheduler()
        self.scheduler.add_job(
            func=self.check_new_meetings,
            trigger='interval',
            minutes=2,
            id='meeting_check'
        )

    def start(self):
        """Start the monitoring service"""
        try:
            self.scheduler.start()
            logger.info("Meeting monitor service started successfully")
        except Exception as e:
            logger.error(f"Failed to start meeting monitor service: {str(e)}")

    def stop(self):
        """Stop the monitoring service"""
        self.scheduler.shutdown()
        logger.info("Meeting monitor service stopped")

    def check_new_meetings(self):
        """Check for new meetings and process their transcripts"""
        try:
            current_time = datetime.now(pytz.UTC)
            
            # Fetch recent meetings
            meetings = self.composio_toolset.execute_action(
                'GOOGLEMEET_GET_MEET',
                parameters={
                    'timeMin': self.last_check_time.isoformat(),
                    'timeMax': current_time.isoformat()
                }
            )
            
            for meeting in meetings:
                meet_id = meeting.get('id')
                if meet_id and meet_id not in self.processed_meets:
                    self.process_meeting(meet_id)
            
            self.last_check_time = current_time
            
        except Exception as e:
            logger.error(f"Error in check_new_meetings: {str(e)}")

    def process_meeting(self, meet_id: str):
        """Process a single meeting's transcript and send emails"""
        try:
            # Get conference record
            conf_record = self.composio_toolset.execute_action(
                'GOOGLEMEET_GET_CONFERENCE_RECORD_FOR_MEET',
                parameters={'meetId': meet_id}
            )
            
            if not conf_record:
                logger.warning(f"No conference record found for meeting {meet_id}")
                return

            # Get recordings and transcript
            recordings = self.composio_toolset.execute_action(
                'GOOGLEMEET_GET_RECORDINGS_BY_CONFERENCE_RECORD_ID',
                parameters={'conferenceRecordId': conf_record['id']}
            )
            
            if not recordings:
                logger.warning(f"No recordings found for meeting {meet_id}")
                return

            # Extract transcript and participant information
            transcript = recordings.get('transcript', 'Transcript not available')
            participants = self.get_meeting_participants(meet_id)
            
            # Send emails to all participants
            self.send_transcript_emails(meet_id, transcript, participants)
            
            # Mark as processed
            self.processed_meets.add(meet_id)
            logger.info(f"Successfully processed meeting {meet_id}")
            
        except Exception as e:
            logger.error(f"Error processing meeting {meet_id}: {str(e)}")

    def get_meeting_participants(self, meet_id: str) -> list:
        """Get list of participant emails for a meeting"""
        try:
            meeting_details = self.composio_toolset.execute_action(
                'GOOGLEMEET_GET_MEET',
                parameters={'meetId': meet_id}
            )
            return [p['email'] for p in meeting_details.get('participants', [])]
        except Exception as e:
            logger.error(f"Error getting participants for meeting {meet_id}: {str(e)}")
            return []

    def send_transcript_emails(self, meet_id: str, transcript: str, participants: list):
        """Send transcript emails to all participants"""
        try:
            email_content = self.create_email_content(meet_id, transcript)
            
            for participant in participants:
                self.composio_toolset.execute_action(
                    'GMAIL_SEND_EMAIL',
                    parameters={
                        'to': participant,
                        'subject': f'Meeting Transcript - {meet_id}',
                        'body': email_content,
                        'contentType': 'text/html'
                    }
                )
                logger.info(f"Sent transcript email to {participant}")
                
        except Exception as e:
            logger.error(f"Error sending transcript emails: {str(e)}")

    def create_email_content(self, meet_id: str, transcript: str) -> str:
        """Create formatted email content with the transcript"""
        return f"""
        <html>
            <body>
                <h2>Meeting Transcript</h2>
                <p>Meeting ID: {meet_id}</p>
                <p>Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                <hr>
                <h3>Transcript:</h3>
                <pre>{transcript}</pre>
            </body>
        </html>
        """

# Create and start the monitor service
monitor_service = MeetingMonitorService()

@app.route('/start', methods=['POST'])
def start_service():
    monitor_service.start()
    return {'status': 'success', 'message': 'Meeting monitor service started'}

@app.route('/stop', methods=['POST'])
def stop_service():
    monitor_service.stop()
    return {'status': 'success', 'message': 'Meeting monitor service stopped'}

if __name__ == '__main__':
    # Start the monitoring service
    monitor_service.start()
    # Run the Flask app
    app.run(host='0.0.0.0', port=5001)