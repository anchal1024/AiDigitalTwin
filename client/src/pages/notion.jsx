import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Download, Loader } from 'lucide-react';
import AdvancedAnalytics from '@/components/analytics';
import html2pdf from 'html2pdf.js';

const API_BASE_URL = 'http://127.0.0.1:8080';

const analysisPhrases = [
  { text: "🔍 Initializing analysis...", duration: 1250 },
  { text: "📊 Processing data...", duration: 1250 },
  { text: "🤖 Applying AI analysis...", duration: 1250 },
  { text: "✨ Finalizing results...", duration: 1250 }
];

const colors = {
  yellow: {
    primary: '#FCD34D',
    secondary: '#FBBF24',
    hover: '#F59E0B',
    muted: '#FEF3C7'
  },
  black: {
    pure: '#000000',
    primary: '#111827',
    secondary: '#1F2937'
  }
};

const NotionAIApp = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState('');

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const runLoadingSequence = async (phrases) => {
    for (const phrase of phrases) {
      setCurrentPhrase(phrase.text);
      await new Promise(resolve => setTimeout(resolve, phrase.duration));
    }
  };

  const handleDownloadPDF = () => {
    // Create a temporary div to combine analytics and insights
    const tempDiv = document.createElement('div');

    // Clone the analytics report
    const analyticsReport = document.getElementById('analysis-report').cloneNode(true);

    // Create insights section
    const insightsDiv = document.createElement('div');
    insightsDiv.className = 'mt-8 p-4';
    insightsDiv.innerHTML = `
      <h2 class="text-2xl font-bold mb-4">AI Insights</h2>
      <div class="text-black prose prose-invert prose-yellow">
        ${analysisData.ai_insights}
      </div>
    `;

    // Combine both elements
    tempDiv.appendChild(analyticsReport);
    tempDiv.appendChild(insightsDiv);

    const opt = {
      margin: 1,
      filename: 'task-analysis-report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(tempDiv).save();
  };

  const handleGenerateReport = async () => {
    setAnalysisLoading(true);
    try {
      await runLoadingSequence(analysisPhrases);
      await fetchAnalysis();
      setShowAnalysis(true);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a task description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_body: prompt }),
      });

      if (!response.ok) throw new Error(`Server responded with ${response.status}`);

      const data = await response.json();
      console.log('Task processed:', data);
      setPrompt('');
    } catch (err) {
      setError(`Failed to process task: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis`);
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      const data = await response.json();
      setAnalysisData(data);
    } catch (err) {
      setError(`Failed to fetch analysis: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-yellow-400/20
            shadow-lg"
        >
          <h1 className="text-5xl font-bold text-yellow-400 mb-4">
            Notion Integration
          </h1>
          <p className="text-yellow-400/60 text-xl">
            Seamlessly manage and analyze your tasks with AI-powered insights
          </p>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 backdrop-blur-xl rounded-xl p-4 border border-red-500/20
                flex items-center gap-3 text-red-400"
            >
              <Terminal size={20} />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-yellow-400/20
            shadow-lg hover:border-yellow-400/40 transition-colors group"
        >
          <div className="space-y-6">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full min-h-[120px] bg-black/60 rounded-xl p-6 text-yellow-400
                placeholder-yellow-400/30 border-2 border-yellow-400/20 focus:border-yellow-400/40
                focus:outline-none transition-colors resize-none"
              placeholder="Describe your task here..."
            />
            <div className="flex justify-end gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }} cat
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500
                  text-black font-bold rounded-xl shadow-lg hover:shadow-yellow-400/20
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-black border-t-transparent rounded-full"
                  />
                ) : (
                  'Schedule Task'
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Analysis Section */}
        <div className="space-y-6">
          {!showAnalysis ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateReport}
              disabled={analysisLoading}
              className="w-full bg-black/40 backdrop-blur-xl rounded-2xl p-8 border
                border-yellow-400/20 text-yellow-400 hover:border-yellow-400/40
                transition-all disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg hover:shadow-yellow-400/20"
            >
              <div className="flex items-center justify-center gap-3">
                <Loader className={`w-5 h-5 ${analysisLoading ? 'animate-spin' : ''}`} />
                Generate Analysis Report
              </div>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border
                border-yellow-400/20 shadow-lg"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-yellow-400">Analysis Report</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-6 py-3 bg-yellow-400/10
                    hover:bg-yellow-400/20 text-yellow-400 rounded-xl border
                    border-yellow-400/20 hover:border-yellow-400/40 transition-all"
                >
                  <Download size={20} />
                  Download Report
                </motion.button>
              </div>
              <div id="analysis-report" className="bg-black/60 rounded-xl p-6 border
                border-yellow-400/20">
                <AdvancedAnalytics data={analysisData} />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {(loading || analysisLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center
              justify-center"
          >
            <div className="text-center space-y-6">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-6xl"
              >
                ✨
              </motion.div>
              <motion.p
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-yellow-400 text-2xl font-bold"
              >
                {currentPhrase}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotionAIApp;