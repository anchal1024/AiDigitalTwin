import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { FiClock, FiCheck, FiAlertCircle, FiActivity, FiBarChart2 } from 'react-icons/fi';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import SuggestionsPanel from '../components/SuggestionsPanel';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];

const StatCard = ({ title, value, icon, color }) => (
    <div className="rounded-xl p-6 border border-yellow-400/20">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-yellow-400/60">{title}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
            <div className={`${color} opacity-80 text-2xl`}>{icon}</div>
        </div>
    </div>
);

const InteractionCard = ({ record }) => {
    const getSentimentColor = (score) => {
        if (score > 0) return 'text-green-400';
        if (score < 0) return 'text-red-400';
        return 'text-yellow-400';
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-400/20 text-red-400 border-red-400/30';
            case 'medium': return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30';
            case 'low': return 'bg-green-400/20 text-green-400 border-green-400/30';
            default: return 'bg-gray-400/20 text-gray-400 border-gray-400/30';
        }
    };

    const formatDuration = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-yellow-400/20 shadow-lg"
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold text-yellow-400 mb-2">{record.task_type}</h3>
                    <p className="text-sm text-yellow-400/60">Session: {record.session_id}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(record.priority_level)}`}>
                    {record.priority_level}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Feedback Score */}
                <div className="col-span-1">
                    <div className="w-20 h-20 mx-auto mb-2">
                        <CircularProgressbar
                            value={record.feedback_score * 20}
                            text={`${record.feedback_score}`}
                            styles={buildStyles({
                                textSize: '24px',
                                pathColor: `rgba(250, 204, 21, ${record.feedback_score / 5})`,
                                textColor: '#fbbf24',
                                trailColor: '#374151',
                            })}
                        />
                    </div>
                    <p className="text-center text-sm text-yellow-400/60">Feedback Score</p>
                </div>

                {/* Sentiment Score */}
                <div className="col-span-1">
                    <div className="w-20 h-20 mx-auto mb-2">
                        <CircularProgressbar
                            value={(record.sentiment_score + 1) * 50}
                            text={record.sentiment_score.toFixed(2)}
                            styles={buildStyles({
                                textSize: '24px',
                                pathColor: record.sentiment_score > 0 ? '#4ade80' : '#ef4444',
                                textColor: record.sentiment_score > 0 ? '#4ade80' : '#ef4444',
                                trailColor: '#374151',
                            })}
                        />
                    </div>
                    <p className="text-center text-sm text-yellow-400/60">Sentiment</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Duration */}
                <div className="bg-black/40 rounded-lg p-3 border border-yellow-400/10">
                    <div className="flex items-center gap-2 mb-2">
                        <FiClock className="text-yellow-400" />
                        <span className="text-sm text-yellow-400/60">Duration</span>
                    </div>
                    <p className="text-lg font-semibold text-yellow-400">
                        {formatDuration(record.interaction_duration)}
                    </p>
                </div>

                {/* Response Time */}
                <div className="bg-black/40 rounded-lg p-3 border border-yellow-400/10">
                    <div className="flex items-center gap-2 mb-2">
                        <FiActivity className="text-yellow-400" />
                        <span className="text-sm text-yellow-400/60">Response</span>
                    </div>
                    <p className="text-lg font-semibold text-yellow-400">
                        {record.response_time}s
                    </p>
                </div>

                {/* Status */}
                <div className="bg-black/40 rounded-lg p-3 border border-yellow-400/10">
                    <div className="flex items-center gap-2 mb-2">
                        <FiBarChart2 className="text-yellow-400" />
                        <span className="text-sm text-yellow-400/60">Status</span>
                    </div>
                    <p className="text-lg font-semibold text-yellow-400">
                        {record.completion_status}
                    </p>
                </div>

                {/* Follow Up */}
                <div className="bg-black/40 rounded-lg p-3 border border-yellow-400/10">
                    <div className="flex items-center gap-2 mb-2">
                        <FiAlertCircle className="text-yellow-400" />
                        <span className="text-sm text-yellow-400/60">Follow Up</span>
                    </div>
                    <p className="text-lg font-semibold text-yellow-400">
                        {record.follow_up_required}
                    </p>
                </div>
            </div>

            {/* Timestamp */}
            <div className="mt-4 text-right">
                <p className="text-sm text-yellow-400/40">
                    {new Date(record.timestamp).toLocaleString()}
                </p>
            </div>
        </motion.div>
    );
};

const YourInteractions = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalInteractions: 0,
        avgResponseTime: 0,
        avgSentiment: 0,
        completionRate: 0
    });
    const [suggestions, setSuggestions] = useState(null);
    const [suggestionsLoading, setSuggestionsLoading] = useState(true);

    useEffect(() => {
        fetchUserRecords();
        fetchSuggestions();
    }, []);

    const fetchUserRecords = async () => {
        try {
            console.log('Fetching user records...'); // Debug log
            const response = await fetch('http://127.0.0.1:5002/get-user-records');
            const responseData = await response.json();
            console.log('API Response:', responseData); // Debug log
            localStorage.setItem('user_id', JSON.stringify(responseData.data.user_id));
            if (responseData.status === 'success') {
                // Ensure we're using the data array from the response
                const records = responseData.data || [];
                console.log('Setting records:', records); // Debug log
                setRecords(records);
                calculateStats(records);
            } else {
                console.error('Error response:', responseData); // Debug log
                setError(responseData.message || 'Failed to fetch records');
            }
        } catch (err) {
            console.error('Error details:', err); // Debug log
            setError('Failed to fetch user records');
        } finally {
            setLoading(false);
        }
    };

    const fetchSuggestions = async () => {
        try {
            setSuggestionsLoading(true);
            const response = await fetch('http://127.0.0.1:5010/api/user-suggestions/U024');
            const data = await response.json();
            console.log(data);
            setSuggestions(data);
        } catch (err) {
            console.error('Error fetching suggestions:', err);
        } finally {
            setSuggestionsLoading(false);
        }
    };

    const calculateStats = (data) => {
        const total = data.length;
        const avgResponse = data.reduce((acc, curr) => acc + curr.response_time, 0) / total;
        const avgSentiment = data.reduce((acc, curr) => acc + curr.sentiment_score, 0) / total;
        const completed = data.filter(r => r.completion_status === 'In Progress').length;

        setStats({
            totalInteractions: total,
            avgResponseTime: avgResponse.toFixed(2),
            avgSentiment: avgSentiment.toFixed(2),
            completionRate: ((completed / total) * 100).toFixed(1)
        });
    };

    const prepareChartData = (data) => {
        // Group by task_type for pie chart
        const taskTypes = data.reduce((acc, curr) => {
            acc[curr.task_type] = (acc[curr.task_type] || 0) + 1;
            return acc;
        }, {});

        // Prepare time series data
        const timelineData = data.map(record => ({
            timestamp: new Date(record.timestamp).toLocaleDateString(),
            response_time: record.response_time,
            sentiment: record.sentiment_score
        }));

        return {
            taskTypes: Object.entries(taskTypes).map(([name, value]) => ({ name, value })),
            timeline: timelineData
        };
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-400 bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20">
                    {error}
                </div>
            </div>
        );
    }

    const chartData = prepareChartData(records);

    return (
        <div className="min-h-screen p-8">
            <h1 className="text-4xl font-bold text-yellow-400 mb-8">Interaction Analytics</h1>

            {/* Suggestions Panel with loading state */}
            {suggestionsLoading ? (
                <div className="rounded-xl p-6 border border-yellow-400/20 mb-8">
                    <div className="flex items-center space-x-4">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full"
                        />
                        <span className="text-yellow-400">Loading suggestions...</span>
                    </div>
                </div>
            ) : suggestions && (
                <SuggestionsPanel
                    suggestions={suggestions.suggestions}
                    patterns={suggestions.user_patterns}
                />
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Interactions"
                    value={stats.totalInteractions}
                    icon={<FiBarChart2 />}
                    color="text-blue-400"
                />
                <StatCard
                    title="Avg Response Time"
                    value={`${stats.avgResponseTime}s`}
                    icon={<FiClock />}
                    color="text-green-400"
                />
                <StatCard
                    title="Sentiment Score"
                    value={stats.avgSentiment}
                    icon={<FiActivity />}
                    color="text-purple-400"
                />
                <StatCard
                    title="Completion Rate"
                    value={`${stats.completionRate}%`}
                    icon={<FiCheck />}
                    color="text-yellow-400"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Timeline Chart */}
                <div className="rounded-xl p-6 border border-yellow-400/20">
                    <h2 className="text-xl font-bold text-yellow-400 mb-4">Response Time Trend</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData.timeline}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                            <XAxis dataKey="timestamp" stroke="#ffffff60" />
                            <YAxis stroke="#ffffff60" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                                labelStyle={{ color: '#ffffff' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="response_time" stroke="#4ECDC4" name="Response Time" />
                            <Line type="monotone" dataKey="sentiment" stroke="#FF6B6B" name="Sentiment" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Task Distribution */}
                <div className="rounded-xl p-6 border border-yellow-400/20">
                    <h2 className="text-xl font-bold text-yellow-400 mb-4">Task Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={chartData.taskTypes}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.taskTypes.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Records Table */}
            <div className="rounded-xl p-6 border border-yellow-400/20">
                <h2 className="text-xl font-bold text-yellow-400 mb-4">Detailed Records</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-yellow-200">
                        <thead className="text-xs uppercase bg-yellow-400/10">
                            <tr>
                                <th className="px-6 py-3">Task Type</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Response Time</th>
                                <th className="px-6 py-3">Sentiment</th>
                                <th className="px-6 py-3">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((record, index) => (
                                <tr key={index} className="border-b border-yellow-400/10 hover:bg-yellow-400/5">
                                    <td className="px-6 py-4">{record.task_type}</td>
                                    <td className="px-6 py-4">{record.completion_status}</td>
                                    <td className="px-6 py-4">{record.response_time}s</td>
                                    <td className="px-6 py-4">{record.sentiment_score.toFixed(2)}</td>
                                    <td className="px-6 py-4">{new Date(record.timestamp).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default YourInteractions;
