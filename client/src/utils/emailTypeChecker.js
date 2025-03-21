
/**
 * Checks the type of email based on its analysis
 * @param {Object} emailData - The email data object
 * @returns {Object} Object containing type and relevant data
 */
export const checkEmailType = (emailData) => {
    if (!emailData?.analysis?.analysis) {
        return { type: 'unknown', data: null };
    }

    const { analysis } = emailData.analysis;

    // Check if it's a notion task
    if (analysis.notion_tasks && analysis.notion_tasks.length > 0) {
        return {
            type: 'notion_task',
            data: analysis.notion_tasks[0], // Taking the first task for now
            priority: analysis.final_priority_score,
            content: analysis.content_segments.tasks[0] || ''
        };
    }

    // Check if it's a calendar event
    if (analysis.calendar_meetings && analysis.calendar_meetings.length > 0 ||
        (analysis.content_segments?.calendar && analysis.content_segments.calendar.length > 0)) {
        return {
            type: 'calendar',
            data: analysis.calendar_meetings[0] || analysis.content_segments.calendar[0],
            priority: analysis.final_priority_score
        };
    }

    // If neither, return unknown
    return { type: 'unknown', data: null };
};
