import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiSend, FiClock } from 'react-icons/fi';
import { SiNotion } from 'react-icons/si';
import { BsKanban } from 'react-icons/bs';

const Dashboard = () => {
  const [greeting, setGreeting] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const textAreaRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Add API key constant (replace with your actual API key)
  const API_KEY = import.meta.env.VITE_COMPOSIO_API_KEY;  // Add this line

  // // Add mockTasks definition
  const mockTasks = [
    { title: 'Review Q4 Marketing Strategy', status: 'In Progress', priority: 'High' },
    { title: 'Prepare Client Presentation', status: 'Todo', priority: 'Medium' },
    { title: 'Update Content Calendar', status: 'In Progress', priority: 'High' },
    { title: 'Social Media Analytics Report', status: 'Todo', priority: 'Low' }
  ];

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
    fetchEvents();
    fetchTasks(); // Add this line
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;

    setIsLoading(true);
    setApiResponse(null);

    try {
      const response = await fetch('http://127.0.0.1:5002/create-doc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: inputMessage }),
      });

      const data = await response.json();
      setApiResponse(data);
    } catch (error) {
      setApiResponse({ error: 'Failed to process request' });
    } finally {
      setIsLoading(false);
    }
  };

  const adjustTextAreaHeight = () => {
    const textarea = textAreaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5001/get-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: API_KEY }), // Use the defined API key
      });
      const data = await response.json();
      const parsedEvents = parseEventsData(data.output);
      setEvents(parsedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8080/api/tasks/recent');
      const data = await response.json();
      setTasks(data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  const parseEventsData = (outputText) => {
    if (!outputText) return [];

    // Split by numbered events and filter out non-event text
    const eventStrings = outputText.split(/\d+\.\s+(?:\*\*)?/).filter(str =>
      str && !str.startsWith('I') && !str.startsWith('I found') && !str.startsWith('Found') && !str.startsWith('Here') && !str.includes('Feel free')
    );

    return eventStrings.map(eventStr => {
      const lines = eventStr.split('\n').map(line => line.trim()).filter(Boolean);
      const details = {};

      // Extract title from first line
      const title = lines[0].replace(/\*\*/g, '').trim();

      // Function to find and extract meeting links
      const findMeetLinks = (text) => {
        const meetLinkRegex = /\[.*?\]\((https:\/\/meet\.google\.com\/[a-z-]+)\)/gi;
        const directMeetLinkRegex = /(https:\/\/meet\.google\.com\/[a-z-]+)/gi;

        const matches = [
          ...(text.match(meetLinkRegex) || []).map(link => link.match(/\((.*?)\)/)[1]),
          ...(text.match(directMeetLinkRegex) || [])
        ];

        return matches[0];
      };

      // Process each line for details
      lines.slice(1).forEach(line => {
        const cleanLine = line.replace(/^\s*-\s*|\*\*/g, '').trim();

        // Check for meet links in the current line
        const meetLink = findMeetLinks(line);
        if (meetLink) {
          details.meetLink = meetLink;
        }

        // Extract other details
        if (cleanLine.includes('Date:')) {
          details.date = cleanLine.split('Date:')[1].trim();
        }
        else if (cleanLine.includes('Time:')) {
          details.time = cleanLine.split('Time:')[1].trim();
        }
        else if (cleanLine.includes('Location:')) {
          details.location = cleanLine.split('Location:')[1].trim();
        }
        else if (cleanLine.includes('Attendees:')) {
          details.attendees = cleanLine.split('Attendees:')[1].trim();
        }
        // Additional date/time format handling
        else if (cleanLine.includes('Date and Time:')) {
          const [date, time] = cleanLine.split('Date and Time:')[1].split(',').map(s => s.trim());
          details.date = date;
          details.time = time.split('(')[0].trim();
          if (time.includes('(')) {
            details.timezone = time.match(/\((.*?)\)/)[1];
          }
        }
      });

      return {
        title,
        ...details,
        // Ensure we have date and time in some form
        date: details.date || 'Date not specified',
        time: details.time || 'Time not specified',
      };
    });
  };

  const renderEventCard = (event, index) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      key={index}
      className="p-4 rounded-lg bg-yellow-400/5 border border-yellow-400/10 
        hover:border-yellow-400/30 transition-colors"
    >
      <h3 className="text-yellow-100 font-medium mb-2">{event.title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="text-yellow-400/60 space-y-2">
          <p className="flex items-center gap-2">
            <span>📅</span> {event.date}
          </p>
          <p className="flex items-center gap-2">
            <span>⏰</span> {event.time}
          </p>
          {event.location && (
            <p className="flex items-center gap-2">
              <span>📍</span> {event.location}
            </p>
          )}
        </div>
        <div className="flex flex-col justify-between text-yellow-400/60 space-y-2">
          {event.attendees && (
            <p className="flex items-center gap-2">
              <span>👥</span> {event.attendees}
            </p>
          )}
          {event.meetLink && (
            <a
              href={event.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 
                bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 
          rounded-md transition-colors"
            >
              <span>💻</span> Join Meeting
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderScheduleSection = () => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-[#131313] backdrop-blur-lg rounded-lg p-6 border border-yellow-400/20"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FiCalendar className="text-yellow-400 w-6 h-6" />
          <h2 className="text-2xl font-semibold text-yellow-400">Your Schedule</h2>
        </div>
        <button
          onClick={fetchEvents}
          className="px-3 py-1 text-sm bg-yellow-400/10 hover:bg-yellow-400/20 
            text-yellow-400 rounded-md transition-colors"
        >
          Refresh
        </button>
      </div>

      {eventsLoading ? (
        <div className="flex justify-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => renderEventCard(event, index))}
          {events.length === 0 && !eventsLoading && (
            <p className="text-center text-yellow-400/60 py-8">No upcoming events</p>
          )}
        </div>
      )}
    </motion.div>
  );

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-400/20 text-green-400 border-green-400/20';
      case 'in progress':
        return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/20';
      default:
        return 'bg-red-400/20 text-red-400 border-red-400/20';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'marketing':
        return '📢';
      case 'development':
        return '💻';
      case 'design':
        return '🎨';
      case 'documentation':
        return '📝';
      default:
        return '📌';
    }
  };

  const renderTasksSection = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-[#131313] backdrop-blur-lg rounded-lg p-6 border border-yellow-400/20"
      onClick={() => window.open('https://www.notion.so/194017e1ad4d81d597f4c30cec36fdc6?v=194017e1ad4d81a8962c000c13e4a0e3', '_blank', 'noopener,noreferrer')}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BsKanban className="text-yellow-400 w-6 h-6" />
          <h2 className="text-2xl font-semibold text-yellow-400">Your Tasks</h2>
        </div>
        <button
          onClick={fetchTasks}
          className="px-3 py-1 text-sm bg-yellow-400/10 hover:bg-yellow-400/20 
            text-yellow-400 rounded-md transition-colors"
        >
          Refresh
        </button>
      </div>

      {tasksLoading ? (
        <div className="flex justify-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full"
          />
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-yellow-400/20 scrollbar-track-transparent">
          {tasks.map((task, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={index}
              className="p-4 rounded-lg bg-yellow-400/5 border border-yellow-400/10 
                hover:border-yellow-400/30 transition-all duration-300 group hover:bg-yellow-400/10"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{getCategoryIcon(task.Category)}</span>
                    <h3 className="text-yellow-100 font-medium">{task.Name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(task.Status)}`}>
                      {task.Status}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                      {task.Category}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full 
                    ${task.Priority.toLowerCase() === 'high' ? 'bg-red-400/20 text-red-400' :
                      task.Priority.toLowerCase() === 'medium' ? 'bg-yellow-400/20 text-yellow-400' :
                        'bg-green-400/20 text-green-400'}`}>
                    {task.Priority}
                  </span>
                  <div className="flex items-center gap-1 text-yellow-400/60 text-sm">
                    <FiClock className="w-4 h-4" />
                    <span>{task.Deadline}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {tasks.length === 0 && !tasksLoading && (
            <p className="text-center text-yellow-400/60 py-8">No tasks found</p>
          )}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen  p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Greeting Section */}
        <h1 className="text-5xl  font-bold text-yellow-400 mb-16">{greeting}</h1>

        {/* Enhanced Tip Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-yellow-500/10 to-yellow-400/10 blur-xl" />
          <motion.div
            animate={{
              // y: [0, -8, 0],
              scale: [1, 1.0001, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: 'linear'
            }}
            className="relative overflow-hidden  rounded-lg border border-yellow-400/30 p-4 backdrop-blur-md shadow-lg"
          >
            <div className="flex items-center justify-center space-x-3">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: 3, duration: 5 }}
                className="text-yellow-400 text-2xl"
              >
                ✨
              </motion.span>
              <span className="text-yellow-400 font-medium text-lg tracking-wide">
                Try anything with Google Docs, Google Sheets, Google Drive
              </span>
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-yellow-400 text-2xl"
              >
                ✨
              </motion.span>
            </div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent animate-shimmer" />
          </motion.div>
        </motion.div>

        {/* Chat Interface */}
        <div className="mb-12">
          <form onSubmit={handleSubmit} className="relative group">
            <textarea
              ref={textAreaRef}
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                adjustTextAreaHeight();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="How can I assist you today? Press Shift + Enter for new line"
              rows="1"
              className="w-full p-6 rounded-xl bg-[#131313] border-2 border-yellow-400/10 
                text-yellow-100 placeholder-yellow-600/30 focus:outline-none focus:border-yellow-400/40 
                transition-all duration-300 backdrop-blur-lg resize-none min-h-[60px] max-h-[300px] 
                scrollbar-hide shadow-lg hover:border-yellow-400/20 
                focus:shadow-yellow-400/5 focus:shadow-lg"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {inputMessage.length > 0 && !isLoading && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.5, scale: 1 }}
                  className="text-xs text-yellow-400/50"
                >
                  Press Enter ↵
                </motion.span>
              )}
              <button
                onClick={handleSubmit}
                className="text-yellow-400/70 hover:text-yellow-400 transition-colors
                  hover:scale-110 transform duration-200 p-2"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full"
                  />
                ) : (
                  <FiSend size={20} />
                )}
              </button>
            </div>
          </form>

          {/* API Response Section */}
          <AnimatePresence mode="wait">
            {(isLoading || apiResponse) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                {isLoading ? (
                  <motion.div
                    className="flex items-center justify-center space-x-2 text-yellow-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <span className="text-lg">Processing your request</span>
                    <span className="text-lg">...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="bg-[#131313] border border-yellow-400/20 rounded-lg p-4 backdrop-blur-lg"
                  >
                    <pre className="text-yellow-100 whitespace-pre-wrap font-medium">
                      {JSON.stringify(apiResponse, null, 2)}
                    </pre>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {renderScheduleSection()}
          {renderTasksSection()}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;