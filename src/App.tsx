import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Send, RefreshCw } from 'lucide-react';
import RoadmapCanvas from './components/RoadmapCanvas';
import { generateRoadmap } from './services/geminiService';
import { RoadmapBlock, RoadmapData } from './types/roadmap';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';


function App() {
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const samplePrompts = [
    "Learn React.js from scratch",
    "Master data structures and algorithms",
    "Become a UI/UX designer",
    "Learn machine learning basics"
  ];

  const handleGenerateRoadmap = async (inputQuery?: string) => {
    const queryToUse = inputQuery || query;
    if (!queryToUse.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const blocks = await generateRoadmap(queryToUse);
      setRoadmapData({ blocks, query: queryToUse });
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBlocks = (blocks: RoadmapBlock[]) => {
    if (roadmapData) {
      setRoadmapData({ ...roadmapData, blocks });
    }
  };

  const handleReset = () => {
    setRoadmapData(null);
    setError(null);
    setQuery('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerateRoadmap();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Fixed Canvas Overlay Controls */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="p-6">
          {/* Main Input Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-4 max-w-2xl mx-auto">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="What would you like to learn?"
                  className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-gray-800 placeholder-gray-500"
                  disabled={isLoading}
                />
                <motion.button
                  onClick={() => handleGenerateRoadmap()}
                  disabled={isLoading || !query.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
              
              {/* Sample Prompts */}
              {!roadmapData && !isLoading && (
                <div className="mt-4 pt-4 border-t border-gray-200/50">
                  <p className="text-xs text-gray-500 mb-2">Try these examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {samplePrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleGenerateRoadmap(prompt)}
                        className="px-3 py-1 text-xs bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 rounded-full transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reset Button - Top Right */}
      <AnimatePresence>
        {roadmapData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-6 right-6 z-50 pointer-events-auto"
          >
            <motion.button
              onClick={handleReset}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm text-gray-600 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg border border-gray-200/50"
              title="Reset"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="ml-auto">
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-6 right-6 z-40 pointer-events-auto"
          >
            <div className="bg-red-50/95 backdrop-blur-sm border border-red-200/50 rounded-xl p-4 mx-auto max-w-2xl">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Make sure you have set your Gemini API key in the .env file
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-8 text-center">
              <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Generating Your Learning Roadmap
              </h3>
              <p className="text-gray-600 text-sm">
                AI is analyzing your request and creating structured learning blocks...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roadmap Canvas */}
      {roadmapData && !isLoading && (
        <RoadmapCanvas
          blocks={roadmapData.blocks}
          onUpdateBlocks={handleUpdateBlocks}
        />
      )}

      {/* Welcome State */}
      {!roadmapData && !isLoading && !error && (
        <div className="flex items-center justify-center min-h-screen pt-32">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">🎓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Start Your Learning Journey
            </h2>
            <p className="text-gray-600 mb-6">
              Enter your learning goal above and let AI create a structured, interactive roadmap 
              that you can customize and track.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;