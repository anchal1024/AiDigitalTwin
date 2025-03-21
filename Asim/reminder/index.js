const fs = require('fs');
const csv = require('csv-parse');
const nodemailer = require('nodemailer');
const moment = require('moment');
const path = require('path');
const dotenv = require('dotenv');
const cron = require('node-cron');
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

// Add logging configuration
const logFile = path.join(__dirname, 'reminder.log');
const log = message => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    console.log(logMessage.trim());
    fs.appendFileSync(logFile, logMessage);
};

function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv.parse({ columns: true, trim: true }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

function isTaskUrgent(deadline) {
    const deadlineDate = moment(deadline, 'DD - MM - YYYY');
    const currentDate = moment();
    const diffInDays = deadlineDate.diff(currentDate, 'days', true);
    return diffInDays <= 1 && diffInDays >= 0;
}

function generateHTMLContent(urgentTasks) {
    const tasksByPriority = urgentTasks.reduce((acc, task) => {
        if (!acc[task.Priority]) {
            acc[task.Priority] = [];
        }
        acc[task.Priority].push(task);
        return acc;
    }, {});

    let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background: #2c3e50;
                    color: white;
                    padding: 20px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                .priority-section {
                    margin-bottom: 30px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    padding: 15px;
                }
                .priority-header {
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #eee;
                }
                .task-card {
                    background: #f9f9f9;
                    padding: 15px;
                    margin-bottom: 15px;
                    border-radius: 5px;
                    border-left: 4px solid #3498db;
                }
                .task-name {
                    font-weight: bold;
                    color: #2c3e50;
                    font-size: 1.1em;
                }
                .task-details {
                    margin-top: 10px;
                    color: #666;
                }
                .high-priority {
                    border-left-color: #e74c3c;
                }
                .medium-priority {
                    border-left-color: #f39c12;
                }
                .low-priority {
                    border-left-color: #27ae60;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>⚠️ Task Reminder: Due Within 24 Hours</h1>
                <p>The following tasks require your immediate attention.</p>
            </div>
    `;

    Object.entries(tasksByPriority).forEach(([priority, tasks]) => {
        const priorityColor = priority.toLowerCase() === 'high' ? 'e74c3c' : 
                            priority.toLowerCase() === 'medium' ? 'f39c12' : '27ae60';
        
        htmlContent += `
            <div class="priority-section">
                <div class="priority-header">
                    <h2 style="color: #${priorityColor};">
                        ${priority} Priority Tasks (${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'})
                    </h2>
                </div>
        `;

        tasks.forEach(task => {
            htmlContent += `
                <div class="task-card ${priority.toLowerCase()}-priority">
                    <div class="task-name">${task.Name}</div>
                    <div class="task-details">
                        <p>📁 Category: ${task.Category}</p>
                        <p>⏰ Deadline: ${task.Deadline}</p>
                        <p>📊 Status: ${task.Status}</p>
                    </div>
                </div>
            `;
        });

        htmlContent += `</div>`;
    });

    htmlContent += `
            </body>
            </html>
    `;

    return htmlContent;
}

async function processTasksAndSendEmail() {
    try {
        log('Starting task processing...');
        const filePath = path.join(__dirname, '..', 'notion', 'notion_mock_tasks.csv');
        const tasks = await readCSV(filePath);
        log(`Found ${tasks.length} total tasks`);

        const urgentTasks = tasks.filter(task => isTaskUrgent(task.Deadline));
        const tasksByPriority = urgentTasks.reduce((acc, task) => {
            if (!acc[task.Priority]) acc[task.Priority] = [];
            acc[task.Priority].push(task);
            return acc;
        }, {});

        // Generate task summary
        const summary = {
            total: urgentTasks.length,
            high: tasksByPriority['High']?.length || 0,
            medium: tasksByPriority['Medium']?.length || 0,
            low: tasksByPriority['Low']?.length || 0
        };

        log('\nUrgent Tasks Summary:');
        log(`Total tasks due within 24 hours: ${summary.total}`);
        log(`High Priority: ${summary.high}`);
        log(`Medium Priority: ${summary.medium}`);
        log(`Low Priority: ${summary.low}\n`);

        if (urgentTasks.length === 0) {
            log('No urgent tasks due within 24 hours.');
            return;
        }

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: 'asim.shah22@spit.ac.in',
            subject: `🚨 Task Reminder: ${summary.total} Tasks Due Within 24 Hours`,
            html: generateHTMLContent(urgentTasks)
        };

        const info = await transporter.sendMail(mailOptions);
        log('Reminder email sent successfully!');
        log(`Message ID: ${info.messageId}`);
        log('Email recipient summary:');
        log(`- Total tasks sent: ${summary.total}`);
        log(`- Email sent to: ${mailOptions.to}`);

        // Return summary for potential API usage
        return {
            success: true,
            summary,
            messageId: info.messageId
        };

    } catch (error) {
        log(`Error: ${error.message}`);
        console.error('Error stack:', error.stack);
        return {
            success: false,
            error: error.message
        };
    }
}

// Add timezone configuration
const TIMEZONE = 'Asia/Kolkata';  // IST timezone
const SCHEDULE_TIME = '9:00';     // Run at 9 AM daily

// Configure daily schedule
cron.schedule('0 9 * * *', async () => {
    log(`Starting scheduled task check at ${new Date().toLocaleString('en-IN', { timeZone: TIMEZONE })}`);
    try {
        const result = await processTasksAndSendEmail();
        if (result && result.success) {
            log('Daily task check completed successfully');
            console.table(result.summary);
        }
    } catch (error) {
        log(`Error in scheduled task: ${error.message}`);
        console.error('Error stack:', error.stack);
    }
}, {
    scheduled: true,
    timezone: TIMEZONE
});

// Initial run on startup
processTasksAndSendEmail()
    .then(result => {
        if (result) {
            log('Initial task check completed');
            if (result.summary) {
                console.table(result.summary);
            }
        }
    })
    .catch(error => {
        log(`Error in initial task check: ${error.message}`);
    });

// Keep the process running
log(`Reminder service started. Scheduled to run daily at ${SCHEDULE_TIME}`);
process.on('SIGINT', () => {
    log('Reminder service stopped');
    process.exit(0);
});