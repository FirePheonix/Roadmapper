import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock, ArrowRight } from 'lucide-react';

interface RoadmapBlock {
  isCompletedByUser: boolean;
  blockID: number;
  title: string;
  time: string;
  description: string;
  connectivity: number[];
}

interface RoadmapBlockProps {
  block: RoadmapBlock;
  onToggleComplete: (blockId: number) => void;
  position: { x: number; y: number };
  onPositionChange: (blockId: number, position: { x: number; y: number }) => void;
  zoom?: number;
}

const RoadmapBlock: React.FC<RoadmapBlockProps> = ({
  block,
  onToggleComplete,
  position,
  onPositionChange,
  zoom = 1,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Prevent dragging if it's a button click or if zoom is too small
    if ((e.target as Element).closest('button') || zoom < 0.5) {
      return;
    }

    e.stopPropagation(); // Prevent canvas panning
    setIsDragging(true);
    
    // Calculate offset considering zoom
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [zoom]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      // Calculate new position accounting for zoom
      const deltaX = (e.clientX - dragStart.x) / zoom;
      const deltaY = (e.clientY - dragStart.y) / zoom;
      
      onPositionChange(block.blockID, {
        x: position.x + deltaX,
        y: position.y + deltaY,
      });
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, dragStart, zoom, position, block.blockID, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Adjust font sizes based on zoom level
  const getFontSize = (baseSize: string) => {
    if (zoom < 0.7) return 'text-xs';
    if (zoom < 1) return 'text-sm';
    return baseSize;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: zoom > 0.7 ? 1.02 : 1 }}
      className={`absolute w-80 bg-white border-2 rounded-lg shadow-lg select-none z-10 transition-all duration-200 ${
        block.isCompletedByUser
          ? 'border-green-400 bg-green-50'
          : 'border-blue-400 bg-blue-50'
      } ${isDragging ? 'shadow-2xl' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : zoom < 0.5 ? 'default' : 'grab',
        transform: `scale(${Math.max(0.8, Math.min(1, zoom))})`,
        transformOrigin: 'top left',
      }}
      role="button"
      tabIndex={0}
      aria-label={`Learning block: ${block.title}`}
      onMouseDown={handleMouseDown}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className={`font-semibold text-gray-800 pr-2 ${getFontSize('text-lg')}`}>
            {block.title}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(block.blockID);
            }}
            className="flex-shrink-0 text-gray-600 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-white/50"
            aria-label={block.isCompletedByUser ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {block.isCompletedByUser ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <Circle className="w-6 h-6" />
            )}
          </button>
        </div>
        
        <div className={`flex items-center mb-3 text-gray-600 ${getFontSize('text-sm')}`}>
          <Clock className="w-4 h-4 mr-1" />
          <span>{block.time}</span>
        </div>
        
        <p className={`text-gray-700 mb-3 leading-relaxed ${getFontSize('text-sm')}`}>
          {block.description}
        </p>
        
        {block.connectivity.length > 0 && (
          <div className={`flex items-center text-gray-500 ${getFontSize('text-xs')}`}>
            <ArrowRight className="w-3 h-3 mr-1" />
            <span>Connects to: {block.connectivity.join(', ')}</span>
          </div>
        )}
        
        <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {block.blockID}
        </div>

        {/* Drag indicator */}
        {zoom >= 0.5 && (
          <div className="absolute top-2 right-2 opacity-30 hover:opacity-60 transition-opacity">
            <div className="w-2 h-2 bg-gray-400 rounded-full mb-1"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full mb-1"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RoadmapBlock;