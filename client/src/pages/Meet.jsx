import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLink, FiShare2, FiUsers, FiFileText, FiCheck, FiClock, FiCalendar, FiBarChart2 } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

const Meet = () => {
  const [meetId, setMeetId] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareResponse, setShareResponse] = useState(null);

  const extractMeetId = (url) => {
    return url.trim();
  };

  const handleGetAnalysis = async () => {
    setIsLoading(true);
    const id = extractMeetId(meetId);
    try {
      const response = await fetch(`http://localhost:5050/getAnalysis/${id}`);
      const data = await response.json();
      
      // Random delay between 5 and 19 seconds
      const delay = Math.floor(Math.random() * (19000 - 5000 + 1) + 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      setAnalysis(data);
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    const id = extractMeetId(meetId);
    try {
      const response = await fetch(`http://localhost:5050/share/${id}`, {
        method: 'POST',
      });
      const data = await response.json();
      setShareResponse(data);
    } catch (error) {
      console.error('Error sharing analysis:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    });
  };

  const renderLoadingState = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-12 space-y-6"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full"
      />
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-yellow-400/70 text-lg"
      >
        Analyzing your meeting...
      </motion.p>
    </motion.div>
  );

  const renderAnalysisSection = () => (
    <div className="space-y-6">
      {/* Meeting Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-[#131313]/50 rounded-xl p-6 border border-yellow-400/20">
          <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
            <FiCalendar />
            Meeting Details
          </h3>
          <div className="space-y-3 text-yellow-400/70">
            <p>Title: {analysis.meeting_details.title}</p>
            <p>Duration: {analysis.meeting_details.duration_minutes} minutes</p>
            <p>Start: {formatDate(analysis.meeting_details.start_time)}</p>
            <p>End: {formatDate(analysis.meeting_details.end_time)}</p>
            <p>Host: {analysis.meeting_details.host.name}</p>
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="bg-[#131313]/50 rounded-xl p-6 border border-yellow-400/20">
          <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
            <FiBarChart2 />
            Sentiment Analysis
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-yellow-400/10 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-full rounded-full"
                  style={{ width: `${analysis.sentiment_analysis.overall_sentiment.pos * 100}%` }}
                />
              </div>
              <span className="text-yellow-400/70 text-sm">
                {(analysis.sentiment_analysis.overall_sentiment.pos * 100).toFixed(1)}% Positive
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modified Participants Section with Share Button */}
      <div className="bg-[#131313]/50 rounded-xl p-6 border border-yellow-400/20">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
            <FiUsers />
            Participants ({analysis.participants.total_participants})
          </h3>
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="px-6 py-2 bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 
              rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50
              disabled:cursor-not-allowed border border-yellow-400/20 hover:border-yellow-400/40"
          >
            {isSharing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full"
              />
            ) : (
              <>
                <FiShare2 className="w-5 h-5" />
                <span>Share Recording</span>
              </>
            )}
          </button>
        </div>

        {/* Participants Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {analysis.participants.participants.map((participant, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-3 bg-yellow-400/5 rounded-lg border border-yellow-400/10"
            >
              <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
                <span className="text-yellow-400 font-bold">
                  {participant.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-yellow-400">{participant.name}</p>
                <p className="text-yellow-400/50 text-sm">{participant.email}</p>
                <div className="flex gap-2 mt-1 text-xs text-yellow-400/40">
                  <FiClock className="w-3 h-3" />
                  <span>
                    {new Date(participant.join_time).toLocaleTimeString()} - {new Date(participant.leave_time).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Share Response Display */}
        <AnimatePresence>
          {shareResponse && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-4 bg-yellow-400/5 rounded-lg border border-yellow-400/20"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-400">
                  <FiCheck className="w-6 h-6" />
                  <h4 className="text-lg font-semibold">Analysis Shared Successfully</h4>
                </div>
                
                <div className="space-y-3">
                  <p className="text-yellow-400/70">{shareResponse.message}</p>
                  
                  {shareResponse.doc_url && (
                    <a
                      href={shareResponse.doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      <FiFileText className="w-5 h-5" />
                      <span>View Document</span>
                    </a>
                  )}
                  
                  <div className="space-y-2">
                    <p className="text-yellow-400/60 flex items-center gap-2">
                      <FiUsers className="w-5 h-5" />
                      <span>Shared with:</span>
                    </p>
                    <div className="pl-7 space-y-1">
                      {shareResponse.shared_with.map((email, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="text-yellow-400/80"
                        >
                          {email}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Summary with React Markdown */}
      <div className="bg-[#131313]/50 rounded-xl p-6 border border-yellow-400/20">
        <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
          <FiFileText />
          Meeting Summary
        </h3>
        <div className="prose prose-yellow prose-invert max-w-none">
          <ReactMarkdown
            className="text-yellow-400/70"
            components={{
              h1: ({ children }) => <h1 className="text-2xl font-bold text-yellow-400 mt-6 mb-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-bold text-yellow-400 mt-5 mb-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-bold text-yellow-400 mt-4 mb-2">{children}</h3>,
              p: ({ children }) => <p className="text-yellow-400/70 mb-4">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4">{children}</ul>,
              li: ({ children }) => <li className="text-yellow-400/70">{children}</li>,
              strong: ({ children }) => <strong className="text-yellow-400">{children}</strong>,
            }}
          >
            {analysis.summary}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-yellow-400 mb-4">Meeting Analysis</h1>
          <p className="text-yellow-400/60 text-lg">Get insights from your Google Meet recordings</p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="relative group">
            <input
              type="text"
              value={meetId}
              onChange={(e) => setMeetId(e.target.value)}
              placeholder="Enter Meet ID (e.g., anj-fuby-qe8)"
              className="w-full p-6 rounded-xl bg-[#131313] border-2 border-yellow-400/10 
                text-yellow-100 placeholder-yellow-600/30 focus:outline-none focus:border-yellow-400/40 
                transition-all duration-300 backdrop-blur-lg shadow-lg hover:border-yellow-400/20"
            />
            <button
              onClick={handleGetAnalysis}
              disabled={isLoading || !meetId}
              className="absolute right-4 top-1/2 -translate-y-1/2 px-6 py-2 bg-yellow-400/20 
                hover:bg-yellow-400/30 text-yellow-400 rounded-lg transition-colors disabled:opacity-50
                disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <FiFileText />
                  <span>Get Analysis</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Analysis Display Section */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            renderLoadingState()
          ) : analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-[#131313] rounded-xl border border-yellow-400/20 p-6 backdrop-blur-lg"
            >
              {renderAnalysisSection()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share Response Section */}
        <AnimatePresence mode="wait">
          {shareResponse && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 bg-[#131313] rounded-xl border border-yellow-400/20 p-6 backdrop-blur-lg"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-400">
                  <FiCheck className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Analysis Shared Successfully</h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-yellow-400/60">
                    <FiUsers className="w-5 h-5" />
                    <span>Shared with:</span>
                  </div>
                  <div className="pl-7 space-y-1">
                    {shareResponse.shared_with.map((email, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="text-yellow-400/80"
                      >
                        {email}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Meet;