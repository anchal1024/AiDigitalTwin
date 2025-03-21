import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // For now, just navigate to dashboard
            // You can add actual authentication later
            navigate('/details');
        } catch (err) {
            console.log(err);
            setError('Login failed. Please check your credentials.');
        }
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
                        Automate.ai
                    </motion.h2>
                    <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-yellow-200/70 text-center"
                    >
                        Welcome back to your AI-Powered Marketing Dashboard
                    </motion.p>
                </div>

                {/* Right Section */}
                <div className="w-1/2 pl-8">
                    <motion.h3 
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="text-2xl font-semibold text-yellow-400 mb-6"
                    >
                        Sign in to your account
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
                        onSubmit={handleLogin}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block text-yellow-200/70 mb-2" htmlFor="email">
                                Company Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                className="w-full p-3 rounded-lg bg-black border border-yellow-400/20 text-yellow-100 
                                    placeholder-yellow-600/30 focus:outline-none focus:border-yellow-400 
                                    transition-colors"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your company email"
                            />
                        </div>

                        <div>
                            <label className="block text-yellow-200/70 mb-2" htmlFor="password">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                className="w-full p-3 rounded-lg bg-black border border-yellow-400/20 text-yellow-100 
                                    placeholder-yellow-600/30 focus:outline-none focus:border-yellow-400 
                                    transition-colors"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter your password"
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="w-full bg-yellow-400 text-black p-3 rounded-lg hover:bg-yellow-300 
                                transition-colors font-medium text-lg"
                        >
                            Login
                        </motion.button>

                        <p className="text-center mt-4 text-sm text-yellow-200/50">
                            Don't have an account?{' '}
                            <span
                                className="text-yellow-400 cursor-pointer hover:text-yellow-300 transition-colors"
                                onClick={() => navigate('/signup')}
                            >
                                Contact sales
                            </span>
                        </p>
                    </motion.form>
                </div>
            </div>
        </div>
    );
};

export default Login;