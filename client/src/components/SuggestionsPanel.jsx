import React from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiAlertCircle, FiUser, FiTrendingUp } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

const SuggestionCard = ({ suggestion }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-lg p-4 border border-yellow-400/20"
    >
        <ReactMarkdown
            className="text-yellow-200 prose prose-invert prose-yellow max-w-none"
            components={{
                strong: ({ children }) => <span className="text-yellow-400 font-semibold">{children}</span>,
                li: ({ children }) => <li className="text-yellow-200/80">{children}</li>,
                p: ({ children }) => <p className="mb-2">{children}</p>
            }}
        >
            {suggestion}
        </ReactMarkdown>
    </motion.div>
);

const PatternCard = ({ icon, title, value }) => (
    <div className="rounded-lg p-4 border border-yellow-400/10">
        <div className="flex items-center gap-2 mb-1">
            {icon}
            <span className="text-sm text-yellow-400/60">{title}</span>
        </div>
        <p className="text-lg font-semibold text-yellow-400">{value}</p>
    </div>
);

const SuggestionsPanel = ({ suggestions, patterns }) => {
    if (!suggestions) return null;

    return (
        <div className="rounded-xl p-6 border border-yellow-400/20 mb-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">AI Assistant Suggestions</h2>

            {/* User Patterns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <PatternCard
                    icon={<FiTrendingUp className="text-yellow-400" />}
                    title="Average Feedback"
                    value={patterns.average_feedback.toFixed(2)}
                />
                <PatternCard
                    icon={<FiAlertCircle className="text-yellow-400" />}
                    title="Common Priority"
                    value={patterns.common_priority}
                />
                <PatternCard
                    icon={<FiUser className="text-yellow-400" />}
                    title="Most Used Agent"
                    value={patterns.most_used_agent}
                />
            </div>

            {/* Suggestions List */}
            <div className="space-y-4">
                <SuggestionCard suggestion={suggestions} />
            </div>

            {/* Last Updated */}
            <div className="mt-4 text-right">
                <p className="text-sm text-yellow-400/40">
                    {`Last updated: ${new Date().toLocaleString()}`}
                </p>
            </div>
        </div>
    );
};

export default SuggestionsPanel;
