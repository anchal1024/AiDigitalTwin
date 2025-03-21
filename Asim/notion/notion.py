from flask import Flask, request, jsonify, render_template
from flask_cors import CORS  # Add this import
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain import hub
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from composio_langchain import ComposioToolSet
from langchain.prompts import PromptTemplate
from langchain.output_parsers import ResponseSchema, StructuredOutputParser
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
from apscheduler.schedulers.background import BackgroundScheduler
import json
import logging
from pathlib import Path
from flask_cors import CORS 

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize LangChain and Composio components
llm = ChatOpenAI()
prompt = hub.pull("hwchase17/openai-functions-agent")

# Initialize Gemini
gemini = ChatGoogleGenerativeAI(
    model="gemini-pro",
    temperature=0,
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

# Define response schemas for task extraction
response_schemas = [
    ResponseSchema(
        name="name",
        description="The name or title of the task. Should be clear and concise."
    ),
    ResponseSchema(
        name="deadline",
        description="The deadline date in DD-MM-YYYY format. If a relative date is given, convert it based on the current date. If no date is specified, use 'N/A'."
    ),
    ResponseSchema(
        name="status",
        description="The current status of the task. Must be exactly one of: ['Not Started', 'In Progress', 'Completed']. Default to 'Not Started' if unclear."
    ),
    ResponseSchema(
        name="priority",
        description="The priority level of the task. Must be exactly one of: ['High', 'Medium', 'Low']. Default to 'Medium' if unclear."
    ),
    ResponseSchema(
        name="category",
        description="The category of the task. Must be one of: ['Development', 'Design', 'Marketing', 'Documentation', 'Testing', 'Operations', 'Other']. Use 'Other' if unclear."
    )
]

output_parser = StructuredOutputParser.from_response_schemas(response_schemas)

# Constants
CSV_FILE_PATH = 'notion_mock_tasks.csv'
TEMPLATES_DIR = Path('templates')
DASHBOARD_TEMPLATE = TEMPLATES_DIR / 'dashboard.html'
ANALYSIS_FILE = 'analysis_results.json'

def get_current_context():
    """Get current date and time context"""
    now = datetime.now()
    return {
        'current_date': now.strftime('%d-%m-%Y'),
        'current_day': now.strftime('%A'),
        'current_time': now.strftime('%H:%M'),
    }

# Create the enhanced extraction prompt template
extraction_prompt = PromptTemplate(
    template="""
    Current Context:
    - Today's Date: {current_date}
    - Day: {current_day}
    - Current Time: {current_time}

    Extract exactly 5 task-related fields from the following email body using these strict guidelines:

    1. name: 
       - Clear, descriptive task title
       - Capitalize first letter of each word
       - Maximum 50 characters

    2. deadline:
       - Must be in DD - MM - YYYY format
       - Convert relative dates based on current date:
         * "tomorrow" → calculate from current date
         * "next week" → current date + 7 days
         * "end of month" → last day of current month
         * If only day of week is mentioned, use the next occurrence
       - Use 'N/A' if no deadline is mentioned
       - Ensure the deadline is strictly greater than the current date and time; if not, adjust it to tomorrow's date
       - Ensure there are spaces around the dashes

    3. status:
       - Must be EXACTLY one of: ['Not Started', 'In Progress', 'Completed']
       - Default to 'Not Started' if unclear
       - Look for keywords like "started", "working on", "completed", "done"

    4. priority:
       - Must be EXACTLY one of: ['High', 'Medium', 'Low']
       - Default to 'Medium' if unclear
       - Keywords mapping:
         * High: "urgent", "asap", "critical", "important"
         * Low: "when possible", "no rush", "backlog"
         * Medium: everything else

    5. category:
       - Must be EXACTLY one of: ['Development', 'Design', 'Marketing', 'Documentation', 'Testing', 'Operations', 'Other']
       - Use 'Other' if unclear
       - Look for technical keywords to determine category

    Email body:
    {email_body}

    {format_instructions}
    """,
    input_variables=["email_body", "current_date", "current_day", "current_time"],
    partial_variables={"format_instructions": output_parser.get_format_instructions()}
)

# Initialize Composio tools
composio_toolset = ComposioToolSet(api_key=os.getenv("COMPOSIO_API_KEY"))
tools = composio_toolset.get_tools(actions=[
    'NOTION_INSERT_ROW_DATABASE',
    'NOTION_QUERY_DATABASE',
])

agent = create_openai_functions_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

def initialize_csv():
    """Initialize CSV file with headers if it doesn't exist"""
    if not os.path.exists(CSV_FILE_PATH):
        headers = ['Name', 'Deadline', 'Status', 'Priority', 'Category']
        pd.DataFrame(columns=headers).to_csv(CSV_FILE_PATH, index=False)
        logger.info(f"Created new CSV file at {CSV_FILE_PATH}")

def save_to_csv(task_data):
    """Save task data to CSV file"""
    try:
        initialize_csv()
        df = pd.DataFrame([task_data])
        df.to_csv(CSV_FILE_PATH, mode='a', header=False, index=False)
        logger.info(f"Successfully saved task to CSV: {task_data['name']}")
    except Exception as e:
        logger.error(f"Error saving to CSV: {str(e)}")
        raise

def extract_task_info(email_body):
    """Extract task information from email body using Gemini"""
    try:
        context = get_current_context()
        extraction_input = extraction_prompt.format(
            email_body=email_body,
            current_date=context['current_date'],
            current_day=context['current_day'],
            current_time=context['current_time']
        )
        response = gemini.invoke(extraction_input)
        extracted_data = output_parser.parse(response.content)
        logger.info(f"Successfully extracted task info: {extracted_data['name']}")
        return extracted_data
    except Exception as e:
        logger.error(f"Error extracting task info: {str(e)}")
        raise

def generate_ai_insights(df):
    """Generate comprehensive AI insights using Gemini"""
    try:
        # Prepare data for analysis
        total_tasks = len(df)
        urgent_tasks = len(df[df['Days_to_Deadline'] <= 3])
        overdue_tasks = len(df[df['Days_to_Deadline'] < 0])
        category_counts = df['Category'].value_counts().to_dict()
        priority_counts = df['Priority'].value_counts().to_dict()
        
        analysis_prompt = f"""
        Analyze this task management data and provide comprehensive optimization advice:

        Task Overview:
        - Total Tasks: {total_tasks}
        - Urgent Tasks (≤3 days): {urgent_tasks}
        - Overdue Tasks: {overdue_tasks}

        Category Distribution:
        {json.dumps(category_counts, indent=2)}

        Priority Distribution:
        {json.dumps(priority_counts, indent=2)}

        Please provide detailed insights including:
        1. Workload Analysis
           - Current workload distribution
           - Bottlenecks and potential risks
           - Resource allocation recommendations

        2. Priority Management
           - High-priority task handling strategy
           - Risk mitigation for urgent tasks
           - Balancing urgent vs. important tasks

        3. Timeline Optimization
           - Deadline management recommendations
           - Task sequencing suggestions
           - Resource leveling strategies

        4. Category-specific Strategies
           - Recommendations for each task category
           - Cross-category dependencies
           - Resource optimization per category

        5. Efficiency Improvements
           - Process optimization suggestions
           - Team collaboration recommendations
           - Productivity enhancement strategies

        use emojies 
        
        Format the response in HTML with proper headers and bullet points.
        """
        
        response = gemini.invoke(analysis_prompt)
        return response.content
    except Exception as e:
        logger.error(f"Error generating AI insights: {e}")
        return "Error generating AI insights"

def generate_enhanced_graphs(df):
    """Generate comprehensive interactive graphs with detailed metrics"""
    if df.empty:
        logger.warning("DataFrame is empty. No graphs to generate.")
        return {}

    graphs = {}
    
    # Add calculated metrics
    df['Days_to_Deadline'] = (df['Deadline'] - pd.Timestamp.now()).dt.days
    df['Week_Number'] = df['Deadline'].dt.isocalendar().week
    df['Month'] = df['Deadline'].dt.month_name()
    
    # 1. Advanced Task Distribution Sunburst with Metrics
    fig_distribution = px.sunburst(
        df,
        path=['Category', 'Priority', 'Status'],
        values='Days_to_Deadline',
        color='Priority',
        color_discrete_map={'High': '#ff4d4d', 'Medium': '#ffd966', 'Low': '#63c765'},
        title='Task Distribution Overview',
        width=800,
        height=600
    )
    fig_distribution.update_traces(
        textinfo='label+percent parent+value',
        hovertemplate='<b>%{label}</b><br>' +
                     'Days to Deadline: %{value:.0f}<br>' +
                     'Percentage of Parent: %{percentParent:.1%}<br>' +
                     'Percentage of Total: %{percentRoot:.1%}'
    )
    
    # 2. Timeline Scatter Plot with Deadline Tracking
    fig_timeline = go.Figure()
    
    priority_colors = {'High': '#ff4d4d', 'Medium': '#ffd966', 'Low': '#63c765'}
    status_symbols = {'Not Started': 'circle', 'In Progress': 'diamond', 'Completed': 'star'}
    
    for priority in ['High', 'Medium', 'Low']:
        for status in ['Not Started', 'In Progress', 'Completed']:
            mask = (df['Priority'] == priority) & (df['Status'] == status)
            
            fig_timeline.add_trace(go.Scatter(
                x=df[mask]['Deadline'],
                y=df[mask]['Category'],
                mode='markers',
                name=f'{priority} - {status}',
                marker=dict(
                    size=15,
                    symbol=status_symbols[status],
                    color=priority_colors[priority],
                    line=dict(width=1, color='white')
                ),
                text=df[mask]['Name'],
                hovertemplate='<b>%{text}</b><br>' +
                             'Category: %{y}<br>' +
                             'Deadline: %{x|%Y-%m-%d}<br>' +
                             'Priority: ' + priority + '<br>' +
                             'Status: ' + status + '<br>' +
                             '<extra></extra>'
            ))
    
    fig_timeline.update_layout(
        title='Task Timeline and Status Distribution',
        xaxis_title='Deadline',
        yaxis_title='Category',
        height=500,
        showlegend=True,
        legend=dict(
            groupclick="toggleitem",
            yanchor="top",
            y=0.99,
            xanchor="left",
            x=1.05
        )
    )
    
    # 3. Workload Distribution Heatmap with Metrics
    workload_data = pd.crosstab(
        [df['Category'], df['Priority']], 
        df['Status'],
        margins=True
    )
    
    z_data = []
    x_labels = []
    y_labels = []
    hover_text = []
    
    for cat_prio in workload_data.index[:-1]:  # Exclude 'All'
        row = workload_data.loc[cat_prio]
        z_data.append(row[:-1])  # Exclude 'All' column
        y_labels.append(f"{cat_prio[0]} - {cat_prio[1]}")
        hover_text.append([
            f"Category: {cat_prio[0]}<br>" +
            f"Priority: {cat_prio[1]}<br>" +
            f"Status: {col}<br>" +
            f"Count: {val}"
            for col, val in zip(workload_data.columns[:-1], row[:-1])
        ])
    
    fig_heatmap = go.Figure(data=go.Heatmap(
        z=z_data,
        x=workload_data.columns[:-1],
        y=y_labels,
        colorscale='YlOrRd',
        text=[[str(val) for val in row] for row in z_data],
        texttemplate="%{text}",
        textfont={"size": 12},
        hoverongaps=False,
        hoverinfo='text',
        hovertext=hover_text
    ))
    
    fig_heatmap.update_layout(
        title='Task Distribution Matrix',
        height=600,
        xaxis_title='Status',
        yaxis_title='Category - Priority',
        yaxis={'categoryorder': 'category ascending'}
    )
    
    # 4. Progress Gauge Chart
    fig_progress = make_subplots(
        rows=2, cols=2,
        specs=[[{'type': 'indicator'}, {'type': 'indicator'}],
               [{'type': 'indicator'}, {'type': 'indicator'}]],
        subplot_titles=(
            'Overall Completion Rate',
            'High Priority Progress',
            'Tasks On Schedule',
            'Category Distribution'
        )
    )
    
    # Overall completion rate
    completion_rate = (len(df[df['Status'] == 'Completed']) / len(df) * 100)
    
    # High priority progress
    high_priority_rate = (
        len(df[(df['Priority'] == 'High') & (df['Status'] == 'Completed')]) /
        len(df[df['Priority'] == 'High']) * 100
        if len(df[df['Priority'] == 'High']) > 0 else 0
    )
    
    # Tasks on schedule
    on_schedule_rate = (
        len(df[df['Days_to_Deadline'] > 0]) / len(df) * 100
    )
    
    # Category distribution
    category_balance = (
        1 - (df['Category'].value_counts().std() / df['Category'].value_counts().mean())
    ) * 100
    
    # Add indicators
    fig_progress.add_trace(
        go.Indicator(
            mode="gauge+number+delta",
            value=completion_rate,
            title={'text': "Completion Rate"},
            delta={'reference': 100},
            gauge={
                'axis': {'range': [0, 100]},
                'steps': [
                    {'range': [0, 50], 'color': '#ffcdd2'},
                    {'range': [50, 80], 'color': '#fff9c4'},
                    {'range': [80, 100], 'color': '#c8e6c9'}
                ],
                'threshold': {
                    'line': {'color': 'red', 'width': 4},
                    'thickness': 0.75,
                    'value': 95
                }
            }
        ),
        row=1, col=1
    )
    
    fig_progress.add_trace(
        go.Indicator(
            mode="gauge+number+delta",
            value=high_priority_rate,
            title={'text': "High Priority"},
            delta={'reference': 100},
            gauge={
                'axis': {'range': [0, 100]},
                'steps': [
                    {'range': [0, 60], 'color': '#ffcdd2'},
                    {'range': [60, 85], 'color': '#fff9c4'},
                    {'range': [85, 100], 'color': '#c8e6c9'}
                ],
                'threshold': {
                    'line': {'color': 'red', 'width': 4},
                    'thickness': 0.75,
                    'value': 90
                }
            }
        ),
        row=1, col=2
    )
    
    fig_progress.add_trace(
        go.Indicator(
            mode="gauge+number+delta",
            value=on_schedule_rate,
            title={'text': "On Schedule"},
            delta={'reference': 100},
            gauge={
                'axis': {'range': [0, 100]},
                'steps': [
                    {'range': [0, 70], 'color': '#ffcdd2'},
                    {'range': [70, 90], 'color': '#fff9c4'},
                    {'range': [90, 100], 'color': '#c8e6c9'}
                ],
                'threshold': {
                    'line': {'color': 'red', 'width': 4},
                    'thickness': 0.75,
                    'value': 95
                }
            }
        ),
        row=2, col=1
    )
    
    fig_progress.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=category_balance,
            title={'text': "Category Balance"},
            gauge={
                'axis': {'range': [0, 100]},
                'steps': [
                    {'range': [0, 40], 'color': '#ffcdd2'},
                    {'range': [40, 70], 'color': '#fff9c4'},
                    {'range': [70, 100], 'color': '#c8e6c9'}
                ],
                'threshold': {
                    'line': {'color': 'red', 'width': 4},
                    'thickness': 0.75,
                    'value': 80
                }
            }
        ),
        row=2, col=2
    )
    
    fig_progress.update_layout(
        height=800,
        grid={'rows': 2, 'columns': 2, 'pattern': 'independent'},
        showlegend=False
    )
    
    # Convert figures to HTML
    graphs = {
        'distribution': fig_distribution.to_html(full_html=False, include_plotlyjs=False),
        'timeline': fig_timeline.to_html(full_html=False, include_plotlyjs=False),
        'heatmap': fig_heatmap.to_html(full_html=False, include_plotlyjs=False),
        'progress': fig_progress.to_html(full_html=False, include_plotlyjs=False)
    }
    
    return graphs

def generate_task_analysis():
    try:
        if not os.path.exists(CSV_FILE_PATH):
            logger.warning("No tasks found in CSV file")
            return None

        df = pd.read_csv(CSV_FILE_PATH)
        df['Deadline'] = pd.to_datetime(df['Deadline'], format='%d - %m - %Y')
        df['Deadline_End'] = df['Deadline'] + pd.Timedelta(days=1)
        df['Days_to_Deadline'] = (df['Deadline'] - pd.Timestamp(datetime.now())).dt.days

        # Generate enhanced graphs
        graphs = generate_enhanced_graphs(df)
        
        # Generate AI insights
        ai_insights = generate_ai_insights(df)
        
        # Basic statistics for API
        insights = {
            'total_tasks': len(df),
            'urgent_tasks': len(df[df['Days_to_Deadline'] <= 3]),
            'overdue_tasks': len(df[df['Days_to_Deadline'] < 0]),
            'tasks_by_status': df['Status'].value_counts().to_dict(),
            'tasks_by_priority': df['Priority'].value_counts().to_dict(),
            'tasks_by_category': df['Category'].value_counts().to_dict(),
            'ai_insights': ai_insights
        }
        
        return {'graphs_html': graphs, 'insights_json': insights}
    except Exception as e:
        logger.error(f"Error generating task analysis: {str(e)}")
        raise

def store_analysis_results(analysis_data):
    """Store analysis results in a JSON file"""
    try:
        with open(ANALYSIS_FILE, 'w') as f:
            json.dump(analysis_data, f, indent=2)
        logger.info("Analysis results stored successfully")
    except Exception as e:
        logger.error(f"Error storing analysis results: {str(e)}")
        raise

def load_analysis_results():
    """Load analysis results from JSON file"""
    try:
        if not os.path.exists(ANALYSIS_FILE):
            return None
        with open(ANALYSIS_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading analysis results: {str(e)}")
        return None

@app.route('/tasks', methods=['POST'])
def create_task():
    """Create a new task from email body"""
    try:
        data = request.json
        
        if 'email_body' not in data:
            return jsonify({'error': 'Missing email_body in request'}), 400
        
        # Extract task information
        extracted_info = extract_task_info(data['email_body'])
        
        # Save to CSV
        save_to_csv(extracted_info)
        
        # Create task in Notion
        task_prompt = f"""
        Insert a new row into the Notion database with the following properties:
        
        - **Name** (Type: Title): {extracted_info['name']}
        - **Deadline** (Type: Rich Text): {extracted_info['deadline']}
        - **Status** (Type: Rich Text): {extracted_info['status']}
        - **Priority** (Type: Rich Text): {extracted_info['priority']}
        - **Category** (Type: Rich Text): {extracted_info['category']}
        
        Use the database ID: {os.getenv('NOTION_DATABASE_ID')}
        """
        
        result = agent_executor.invoke({"input": task_prompt})
        
        # Trigger analysis update
        generate_task_analysis()
        
        return jsonify({
            'message': 'Task created successfully',
            'extracted_info': extracted_info,
            'result': result
        }), 201
    
    except Exception as e:
        logger.error(f"Error creating task: {str(e)}")
        return jsonify({
            'error': f'Failed to create task: {str(e)}'
        }), 500

@app.route('/dashboard')
def dashboard():
    try:
        analysis = generate_task_analysis()
        graphs = analysis.get('graphs_html')
        if not graphs:
            return "No graphs available", 404
        
        return render_template(
            'dashboard.html',
            timeline_sunburst=graphs['timeline_sunburst'],
            priority_matrix=graphs['priority_matrix'],
            workload_heatmap=graphs['workload_heatmap'],
            completion_gauges=graphs['completion_gauges'],
            last_updated=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        )
    except Exception as e:
        logger.error(f"Error rendering dashboard: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analysis')
def get_analysis():
    """Get the latest task analysis insights from stored results"""
    try:
        analysis = load_analysis_results()
        if not analysis:
            # If stored analysis doesn't exist, generate new one
            analysis = generate_task_analysis()
            store_analysis_results(analysis)
        return jsonify(analysis.get('insights_json', {})), 200
    except Exception as e:
        logger.error(f"Error getting analysis: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/graphs')
@app.route('/graphs')
def show_graphs():
    try:
        analysis = generate_task_analysis()
        if not analysis or not analysis.get('graphs_html'):
            return "No data available", 404
        
        return render_template(
            'graphs.html',
            distribution=analysis['graphs_html']['distribution'],
            timeline=analysis['graphs_html']['timeline'],
            heatmap=analysis['graphs_html']['heatmap'],
            progress=analysis['graphs_html']['progress'],
            last_updated=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        )
    except Exception as e:
        logger.error(f"Error rendering graphs: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/recent', methods=['GET'])
def get_recent_tasks():
    """Get the 5 most recently added tasks"""
    try:
        if not os.path.exists(CSV_FILE_PATH):
            return jsonify({'error': 'No tasks found'}), 404
        
        # Read CSV and get last 5 rows
        df = pd.read_csv(CSV_FILE_PATH)
        last_five = df.tail(5).to_dict('records')
        
        # Format the response
        response = {
            'count': len(last_five),
            'tasks': last_five
        }
        
        return jsonify(response), 200
    except Exception as e:
        logger.error(f"Error fetching recent tasks: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Initialize scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(
    func=lambda: store_analysis_results(generate_task_analysis()),
    trigger="interval",
    hours=6,
    id='task_analysis_job',
    max_instances=1,
    coalesce=True
)

def initialize_app():
    """Initialize application components"""
    try:
        # Create necessary directories
        TEMPLATES_DIR.mkdir(exist_ok=True)
        
        # Initialize CSV file
        initialize_csv()
        
        # Generate and store initial analysis
        logger.info("Generating initial analysis...")
        initial_analysis = generate_task_analysis()
        store_analysis_results(initial_analysis)
        logger.info("Initial analysis completed and stored")
        
        # Start the scheduler
        scheduler.start()
        
        logger.info("Application initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing application: {str(e)}")
        raise

if __name__ == '__main__':
    initialize_app()
    app.run(debug=True, port=8080)