import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Details = () => {
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const AUTH_BACKEND_URL = import.meta.env.VITE_GOOGLE_AUTH_SERVER;
    const navigate = useNavigate();

    const handleSubmit = async (e) => {

        localStorage.setItem('composio-api-key', apiKey);
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${AUTH_BACKEND_URL}/api-auth`, {  
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ api_key: apiKey }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            // Open the OAuth URL in a new window
            if (data.redirectUrl) {
                window.open(data.redirectUrl, '_blank', 'width=600,height=800');
            } else {
                throw new Error('No redirect URL received');
            }

        } catch (err) {
            console.error("Error:", err);
            setError(err.message || 'Failed to authenticate. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="bg-zinc-900/50 p-8 rounded-lg shadow-lg w-full max-w-4xl flex backdrop-blur-xl border border-yellow-400/20">
                {/* Left Section */}
                <div className="w-1/2 flex flex-col items-center justify-center border-r border-yellow-400/20 pr-8">
                    <motion.h2 
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl font-bold text-yellow-400 mb-4"
                    >
                        API Configuration
                    </motion.h2>
                    <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-yellow-200/70 text-center"
                    >
                        Connect your Composio API to get started
                    </motion.p>
                </div>

                {/* Right Section */}
                <div className="w-1/2 pl-8">
                    <motion.h3 
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="text-2xl font-semibold text-yellow-400 mb-6"
                    >
                        Enter your API credentials
                    </motion.h3>
                    
                    {error && (
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-red-400 mb-4 text-sm"
                        >
                            {error}
                        </motion.p>
                    )}

                    <motion.form 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block text-yellow-200/70 mb-2" htmlFor="apiKey">
                                Composio API Key
                            </label>
                            <input
                                type="password"
                                id="apiKey"
                                className="w-full p-3 rounded-lg bg-black border border-yellow-400/20 text-yellow-100 
                                    placeholder-yellow-600/30 focus:outline-none focus:border-yellow-400 
                                    transition-colors"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                required
                                placeholder="Enter your Composio API key"
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-yellow-400 text-black p-3 rounded-lg hover:bg-yellow-300 
                                transition-colors font-medium text-lg disabled:opacity-50"
                        >
                            {isLoading ? 'Validating...' : 'Connect API'}
                        </motion.button>

                        <p className="text-center mt-4 text-sm text-yellow-200/50">
                            Don't have an API key?{' '}
                            <a
                                href="https://composio.dev"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-yellow-400 cursor-pointer hover:text-yellow-300 transition-colors"
                            >
                                Get one here
                            </a>
                        </p>
                    </motion.form>

                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        onClick={handleGoToDashboard}
                        className="w-full mt-4 bg-yellow-400/10 text-yellow-400 p-3 rounded-lg 
                            hover:bg-yellow-400/20 transition-colors font-medium text-lg border 
                            border-yellow-400/20 hover:border-yellow-400/40"
                    >
                        Go to Dashboard
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default Details;