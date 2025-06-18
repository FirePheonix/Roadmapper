import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader, Sparkles } from 'lucide-react';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

const QueryInput: React.FC<QueryInputProps> = ({ onSubmit, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
    }
  };

  const exampleQueries = [
    "Learn MERN stack in 60 days with weekly milestones",
    "Master React.js from beginner to advanced in 3 months",
    "Data Science with Python roadmap for 6 months",
    "Full-stack web development with TypeScript",
  ];

  return (
    <div className="bg-white border-b border-gray-200 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <Sparkles className="w-8 h-8 text-blue-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">
              Learning Roadmap Assistant
            </h1>
          </div>
          <p className="text-gray-600">
            Create structured, connected learning paths for any skill with AI assistance
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Learn MERN stack in 60 days with weekly milestones"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
                disabled={isLoading}
              />
            </div>
            <motion.button
              type="submit"
              disabled={!query.trim() || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {isLoading ? 'Generating...' : 'Generate Roadmap'}
            </motion.button>
          </div>
        </form>

        <div>
          <p className="text-sm text-gray-500 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                onClick={() => setQuery(example)}
                disabled={isLoading}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryInput;
