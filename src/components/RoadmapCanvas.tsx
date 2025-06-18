import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
import { RoadmapBlock as RoadmapBlockType } from '../types/roadmap';
import RoadmapBlock from './RoadmapBlock';

interface RoadmapCanvasProps {
  blocks: RoadmapBlockType[];
  onUpdateBlocks: (blocks: RoadmapBlockType[]) => void;
}

const RoadmapCanvas: React.FC<RoadmapCanvasProps> = ({ blocks, onUpdateBlocks }) => {
  const [blockPositions, setBlockPositions] = useState<Record<number, { x: number; y: number }>>({});
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Virtual canvas size - much larger than viewport
  const virtualCanvasSize = { width: 5000, height: 8000 };

  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Improved layout algorithm for roadmap-like structure
  const calculateRoadmapPositions = useCallback(() => {
    if (blocks.length === 0) return {};

    const positions: Record<number, { x: number; y: number }> = {};
    const visited = new Set<number>();
    const levels: number[][] = [];
    
    // Build adjacency list
    const adjacencyList: Record<number, number[]> = {};
    const inDegree: Record<number, number> = {};
    
    blocks.forEach(block => {
      adjacencyList[block.blockID] = block.connectivity;
      inDegree[block.blockID] = 0;
    });
    
    // Calculate in-degrees
    blocks.forEach(block => {
      block.connectivity.forEach(target => {
        if (inDegree[target] !== undefined) {
          inDegree[target]++;
        }
      });
    });
    
    // Topological sort to determine levels
    const queue: number[] = [];
    const levelMap: Record<number, number> = {};
    
    // Start with nodes that have no dependencies
    blocks.forEach(block => {
      if (inDegree[block.blockID] === 0) {
        queue.push(block.blockID);
        levelMap[block.blockID] = 0;
      }
    });
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLevel = levelMap[current];
      
      if (!levels[currentLevel]) {
        levels[currentLevel] = [];
      }
      levels[currentLevel].push(current);
      
      // Process connected nodes
      const currentBlock = blocks.find(b => b.blockID === current);
      if (currentBlock) {
        currentBlock.connectivity.forEach(target => {
          if (inDegree[target] !== undefined) {
            inDegree[target]--;
            if (inDegree[target] === 0) {
              levelMap[target] = currentLevel + 1;
              queue.push(target);
            }
          }
        });
      }
    }
    
    // Handle remaining nodes (cycles or disconnected)
    blocks.forEach(block => {
      if (levelMap[block.blockID] === undefined) {
        const maxLevel = Math.max(...Object.values(levelMap), -1);
        levelMap[block.blockID] = maxLevel + 1;
        if (!levels[maxLevel + 1]) {
          levels[maxLevel + 1] = [];
        }
        levels[maxLevel + 1].push(block.blockID);
      }
    });
    
    // Calculate positions
    const blockWidth = 320;
    const blockHeight = 200;
    const horizontalSpacing = 100;
    const verticalSpacing = 150;
    const startX = virtualCanvasSize.width / 2;
    const startY = 200;
    
    levels.forEach((level, levelIndex) => {
      const levelWidth = level.length * (blockWidth + horizontalSpacing) - horizontalSpacing;
      const levelStartX = startX - levelWidth / 2;
      
      level.forEach((blockId, blockIndex) => {
        positions[blockId] = {
          x: levelStartX + blockIndex * (blockWidth + horizontalSpacing),
          y: startY + levelIndex * (blockHeight + verticalSpacing)
        };
      });
    });
    
    return positions;
  }, [blocks, virtualCanvasSize]);

  useEffect(() => {
    const newPositions = calculateRoadmapPositions();
    setBlockPositions(prev => {
      // Only update positions for new blocks
      const updated = { ...prev };
      Object.entries(newPositions).forEach(([blockId, position]) => {
        if (!prev[parseInt(blockId)]) {
          updated[parseInt(blockId)] = position;
        }
      });
      return updated;
    });
  }, [calculateRoadmapPositions]);

  // Modified wheel handler for better zoom control
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom when Ctrl/Cmd is held
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05; // Smaller increments
      setZoom(prevZoom => Math.max(0.1, Math.min(3, prevZoom + delta)));
    }
    // Otherwise, let normal scrolling happen
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as Element).closest('.canvas-background')) {
      e.preventDefault();
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastPanPoint]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  const handleToggleComplete = (blockId: number) => {
    const updatedBlocks = blocks.map(block =>
      block.blockID === blockId
        ? { ...block, isCompletedByUser: !block.isCompletedByUser }
        : block
    );
    onUpdateBlocks(updatedBlocks);
  };

  const handlePositionChange = (blockId: number, position: { x: number; y: number }) => {
    setBlockPositions(prev => ({
      ...prev,
      [blockId]: position,
    }));
  };

  const handleZoomIn = () => setZoom(prev => Math.min(3, prev + 0.1));
  const handleZoomOut = () => setZoom(prev => Math.max(0.1, prev - 0.1));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const drawConnections = () => {
    return (
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        style={{ zIndex: 1 }}
        width={virtualCanvasSize.width}
        height={virtualCanvasSize.height}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
          </marker>
        </defs>
        {blocks.flatMap(block =>
          block.connectivity.map(targetId => {
            const sourcePos = blockPositions[block.blockID];
            const targetPos = blockPositions[targetId];
            
            if (!sourcePos || !targetPos) return null;

            const sourceX = sourcePos.x + 160; // Half of block width
            const sourceY = sourcePos.y + 200; // Bottom of source block
            const targetX = targetPos.x + 160;
            const targetY = targetPos.y; // Top of target block
            
            return (
              <line
                key={`${block.blockID}-${targetId}`}
                x1={sourceX}
                y1={sourceY}
                x2={targetX}
                y2={targetY}
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="5,5"
                markerEnd="url(#arrowhead)"
              />
            );
          })
        ).filter(Boolean)}
      </svg>
    );
  };

  const completedCount = blocks.filter(block => block.isCompletedByUser).length;
  const progressPercentage = blocks.length > 0 ? (completedCount / blocks.length) * 100 : 0;

  useEffect(() => {
    // Only run this once when blockPositions is first populated
    if (Object.keys(blockPositions).length > 0 && pan.x === 0 && pan.y === 0) {
      const firstBlockId = blocks[0]?.blockID;
      if (firstBlockId && blockPositions[firstBlockId]) {
        const firstBlockPos = blockPositions[firstBlockId];
        
        // Calculate the desired viewport center (65% of width, 50% of height)
        const viewportCenterX = canvasSize.width * 0.65;
        const viewportCenterY = canvasSize.height * 0.5;
        
        // Calculate the required pan to position the first block at this point
        const targetX = viewportCenterX - (firstBlockPos.x * zoom);
        const targetY = viewportCenterY - (firstBlockPos.y * zoom);
        
        setPan({
          x: targetX,
          y: targetY
        });
      }
    }
  }, [blockPositions, canvasSize, zoom, blocks, pan.x, pan.y]);

  return (
    <div className="relative">
      {/* Progress Bar */}
      <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Progress: {completedCount}/{blocks.length} blocks
        </div>
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="fixed top-4 left-4 bg-white rounded-lg shadow-lg p-2 z-50 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="px-2 py-1 text-xs text-gray-600 text-center border-t">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Pan Instruction */}
      <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-50 flex items-center gap-2 text-sm text-gray-600">
        <Move className="w-4 h-4" />
        <span>Click and drag to pan • Ctrl+Scroll to zoom • Normal scroll works</span>
      </div>

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ 
          height: canvasSize.height,
          width: '100%'
        }}
      >
        {/* Canvas */}
        <div
          ref={canvasRef}
          className={`relative bg-gradient-to-br from-gray-50 to-gray-100 ${
            isPanning ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ 
            width: virtualCanvasSize.width * zoom,
            height: virtualCanvasSize.height * zoom,
            minWidth: '100%',
            minHeight: '100%'
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Grid Background */}
          <div
            className="canvas-background absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
            }}
          />

          {/* Content Container */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: virtualCanvasSize.width,
              height: virtualCanvasSize.height,
              position: 'relative',
            }}
          >
            {drawConnections()}

            {blocks.map(block => (
              <RoadmapBlock
                key={block.blockID}
                block={block}
                onToggleComplete={handleToggleComplete}
                position={blockPositions[block.blockID] || { x: 0, y: 0 }}
                onPositionChange={handlePositionChange}
                zoom={zoom}
              />
            ))}

            {blocks.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-xl font-medium mb-2">No roadmap yet</h3>
                  <p>Enter your learning goal above to generate a roadmap</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapCanvas;