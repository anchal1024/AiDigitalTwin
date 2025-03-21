import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiSend, FiCheck, FiX } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

const Cal = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialResponse, setInitialResponse] = useState(null);
  const [followUpInput, setFollowUpInput] = useState('');
  const [finalResponse, setFinalResponse] = useState(null);

  const handleInitialSubmit = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5004/meet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: inputMessage }),
      });
      const data = await response.json();
      setInitialResponse(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUp = async (e) => {
    e?.preventDefault();
    if (!followUpInput.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5004/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previous_input: inputMessage,
          previous_output: initialResponse,
          user_response: followUpInput
        }),
      });
      const data = await response.json();
      setFinalResponse(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatResponse = (response) => {
    if (!response) return null;
    
    // Extract the output field if it exists in the result
    const output = response.result?.output || response.result || response.message;
    
    if (typeof output === 'string') {
      return output;
    }
    
    return JSON.stringify(output, null, 2);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">Meeting Scheduler</h1>
          <p className="text-yellow-400/60">Seamlessly schedule meetings with AI assistance</p>
        </motion.div>

        {/* Main Scheduling Interface */}
        <div className="grid gap-8">
          {/* Initial Request Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#131313] rounded-lg p-6 border border-yellow-400/20"
          >
            <h2 className="flex items-center gap-2 text-xl font-semibold text-yellow-400 mb-4">
              <FiCalendar className="w-5 h-5" />
              Schedule Request
            </h2>
            <form onSubmit={handleInitialSubmit} className="space-y-4">
              <div className="relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Example: I want to schedule a meeting with john@example.com tomorrow at 2 PM..."
                  rows="3"
                  className="w-full p-4 rounded-lg bg-[#1a1a1a] border-2 border-yellow-400/10 
                    text-yellow-100 placeholder-yellow-600/30 focus:outline-none focus:border-yellow-400/40 
                    transition-all duration-300 resize-none"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="absolute right-3 bottom-3 px-4 py-2 bg-yellow-400/20 
                    hover:bg-yellow-400/30 text-yellow-400 rounded-md transition-colors 
                    disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? 'Processing...' : 'Check Availability'}
                  <FiSend size={16} />
                </button>
              </div>
            </form>

            {/* Simplified Initial Response Display without animations */}
            {initialResponse && (
              <div className="mt-6 p-4 bg-[#1a1a1a] rounded-lg border border-yellow-400/10">
                <h3 className="text-yellow-400 font-medium mb-4">Availability Results:</h3>
                <div className="prose prose-invert prose-yellow max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="text-yellow-400/80 mb-2">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-4 text-yellow-400/80">{children}</ul>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-400 hover:text-yellow-300 underline"
                        >
                          {children}
                        </a>
                      ),
                      strong: ({ children }) => <strong className="text-yellow-400 font-semibold">{children}</strong>,
                    }}
                  >
                    {formatResponse(initialResponse) || 'No response available'}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </motion.div>

          {/* Simplified Confirmation Section without unnecessary animations */}
          {initialResponse && (
            <div className="bg-[#131313] rounded-lg p-6 border border-yellow-400/20">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-yellow-400 mb-4">
                <FiCheck className="w-5 h-5" />
                Confirm Meeting
              </h2>
              <form onSubmit={handleFollowUp} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={followUpInput}
                    onChange={(e) => setFollowUpInput(e.target.value)}
                    placeholder="Type 'yes' to confirm or provide alternative suggestions..."
                    className="w-full p-4 rounded-lg bg-[#1a1a1a] border-2 border-yellow-400/10 
                      text-yellow-100 placeholder-yellow-600/30 focus:outline-none focus:border-yellow-400/40 
                      transition-all duration-300"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !followUpInput.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 
                      bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 rounded-md 
                      transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isLoading ? 'Processing...' : 'Confirm'}
                    <FiCheck size={16} />
                  </button>
                </div>
              </form>

              {/* Final Response Display */}
              {finalResponse && (
                <div className="mt-6 p-4 bg-[#1a1a1a] rounded-lg border border-yellow-400/10">
                  <h3 className="text-yellow-400 font-medium mb-4">Final Status:</h3>
                  <div className="prose prose-invert prose-yellow max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="text-yellow-400/80 mb-2">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-4 text-yellow-400/80">{children}</ul>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        a: ({ children, href }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-yellow-400 hover:text-yellow-300 underline"
                          >
                            {children}
                          </a>
                        ),
                        strong: ({ children }) => <strong className="text-yellow-400 font-semibold">{children}</strong>,
                      }}
                    >
                      {formatResponse(finalResponse) || 'No response available'}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cal;