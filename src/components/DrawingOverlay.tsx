import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DrawingItem, DrawingToolType } from '../types/market';
import {
  saveDrawings,
  loadDrawings,
} from '../utils/drawingStorage';
import {
  Trash2,
  Lock,
  Unlock,
  Copy,
  Sliders,
  Eye,
  EyeOff,
  Move,
  CornerDownRight,
  Maximize2,
  Check,
  X,
} from 'lucide-react';

export const PRESET_DRAWING_COLORS = [
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'White', hex: '#f8fafc' },
];

interface DrawingOverlayProps {
  symbol: string;
  chartPaneId: string | number;
  activeTool: DrawingToolType;
  onToolUsed?: () => void;
  plotWidth: number;
  plotHeight: number;
  totalWidth: number;
  minPrice: number;
  maxPrice: number;
  candlesCount: number;
  candleDates: string[];
  getX: (barIndex: number) => number;
  getYPrice: (price: number) => number;
  getPriceFromY: (y: number) => number;
  getBarIndexFromX: (x: number) => number;
  currentDrawings?: DrawingItem[];
  onDrawingsChange?: (drawings: DrawingItem[]) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const DrawingOverlay: React.FC<DrawingOverlayProps> = ({
  symbol,
  chartPaneId,
  activeTool,
  onToolUsed,
  plotWidth,
  plotHeight,
  totalWidth,
  minPrice,
  maxPrice,
  candlesCount,
  candleDates,
  getX,
  getYPrice,
  getPriceFromY,
  getBarIndexFromX,
  currentDrawings: propDrawings,
  onDrawingsChange,
}) => {
  // State of drawings
  const [drawings, setDrawings] = useState<DrawingItem[]>(() => {
    if (propDrawings && propDrawings.length > 0) return propDrawings;
    return loadDrawings(symbol, chartPaneId);
  });

  // Track selected drawing and active drag handle
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingHandle, setDraggingHandle] = useState<{
    drawingId: string;
    pointIndex: number | 'all' | 'offset';
    startMouseX: number;
    startMouseY: number;
    initialPoints: { barIndex: number; price: number; date: string }[];
    initialOffset?: number;
  } | null>(null);

  // In-progress creation state
  const [pendingPoints, setPendingPoints] = useState<
    { x: number; y: number; price: number; barIndex: number; date: string }[]
  >([]);
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number } | null>(null);

  // Default visual presets for newly created drawings
  const [strokeColor, setStrokeColor] = useState<string>('#06b6d4');
  const [lineWidth, setLineWidth] = useState<number>(1.5);
  const [lineStyle, setLineStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [fillOpacity, setFillOpacity] = useState<number>(0.15);

  // Floating customization menu position
  const [floatingMenuPos, setFloatingMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Load from local storage whenever symbol or chartPaneId changes
  useEffect(() => {
    const loaded = loadDrawings(symbol, chartPaneId);
    setDrawings(loaded);
    setSelectedId(null);
    setPendingPoints([]);
    if (onDrawingsChange) {
      onDrawingsChange(loaded);
    }
  }, [symbol, chartPaneId]);

  // Sync propDrawings if provided and differs
  useEffect(() => {
    if (propDrawings && propDrawings !== drawings) {
      setDrawings(propDrawings);
    }
  }, [propDrawings]);

  // Persist drawings whenever updated
  const updateDrawings = useCallback(
    (newDrawings: DrawingItem[]) => {
      setDrawings(newDrawings);
      saveDrawings(symbol, chartPaneId, newDrawings);
      if (onDrawingsChange) {
        onDrawingsChange(newDrawings);
      }
    },
    [symbol, chartPaneId, onDrawingsChange]
  );

  // Helper: Get selected drawing item
  const selectedDrawing = drawings.find((d) => d.id === selectedId) || null;

  // Reposition floating menu based on selected drawing
  useEffect(() => {
    if (!selectedDrawing || selectedDrawing.points.length === 0) {
      setFloatingMenuPos(null);
      return;
    }
    const p1 = selectedDrawing.points[0];
    const menuWidth = Math.min(260, Math.max(200, plotWidth - 20));
    const rawX = getX(p1.barIndex) - menuWidth / 2;
    const x = Math.max(10, Math.min(plotWidth - menuWidth - 10, rawX));
    const rawY = getYPrice(p1.price) - 160;
    const y = Math.max(10, Math.min(plotHeight - 165, rawY));
    setFloatingMenuPos({ x, y });
  }, [selectedId, drawings, getX, getYPrice, plotWidth, plotHeight]);

  // Keyboard shortcut: Delete or Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPendingPoints([]);
        setSelectedId(null);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // Delete if not locked
        if (selectedDrawing && !selectedDrawing.locked) {
          const filtered = drawings.filter((d) => d.id !== selectedId);
          updateDrawings(filtered);
          setSelectedId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedDrawing, drawings, updateDrawings]);

  // Ray calculation helper: extends ray from (x1, y1) through (x2, y2) to targetX
  const calculateRayEnd = (x1: number, y1: number, x2: number, y2: number, targetX: number) => {
    if (Math.abs(x2 - x1) < 0.001) {
      return { x: x1, y: y2 < y1 ? 0 : plotHeight };
    }
    const slope = (y2 - y1) / (x2 - x1);
    const targetY = y1 + slope * (targetX - x1);
    return { x: targetX, y: targetY };
  };

  // Safe date helper
  const getDateForBar = (barIdx: number) => {
    const clamped = Math.max(0, Math.min(candleDates.length - 1, barIdx));
    return candleDates[clamped] || new Date().toISOString().split('T')[0];
  };

  // Handle click on canvas for drawing creation
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'cursor' || activeTool === 'eraser') {
      if (activeTool === 'eraser' && selectedId) {
        const filtered = drawings.filter((d) => d.id !== selectedId);
        updateDrawings(filtered);
        setSelectedId(null);
      }
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = Math.max(0, Math.min(plotWidth, e.clientX - rect.left));
    const mouseY = Math.max(0, Math.min(plotHeight, e.clientY - rect.top));

    const clickedPrice = Math.round(getPriceFromY(mouseY) * 100) / 100;
    const clickedBarIdx = Math.round(getBarIndexFromX(mouseX));
    const clickedDate = getDateForBar(clickedBarIdx);

    // Single-click tools: Horizontal line / Horizontal ray / Vertical line
    if (activeTool === 'horizontal_line' || activeTool === 'horizontal_ray' || activeTool === 'vertical_line') {
      const newDrawing: DrawingItem = {
        id: `draw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tool: activeTool,
        symbol,
        chartId: typeof chartPaneId === 'number' ? chartPaneId : undefined,
        points: [{ barIndex: clickedBarIdx, price: clickedPrice, date: clickedDate }],
        color: strokeColor,
        lineWidth,
        lineStyle,
        showLabels: true,
      };
      const updated = [...drawings, newDrawing];
      updateDrawings(updated);
      setSelectedId(newDrawing.id);
      setPendingPoints([]);
      if (onToolUsed) onToolUsed();
      return;
    }

    // Two-point tools: Trendline, Ray, Rectangle, Fibonacci, Price Range, Gann Fan
    if (
      activeTool === 'trendline' ||
      activeTool === 'ray' ||
      activeTool === 'rectangle' ||
      activeTool === 'fibonacci' ||
      activeTool === 'price_range' ||
      activeTool === 'gann_fan'
    ) {
      if (pendingPoints.length === 0) {
        setPendingPoints([
          { x: mouseX, y: mouseY, price: clickedPrice, barIndex: clickedBarIdx, date: clickedDate },
        ]);
      } else {
        const p1 = pendingPoints[0];
        const newDrawing: DrawingItem = {
          id: `draw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tool: activeTool,
          symbol,
          chartId: typeof chartPaneId === 'number' ? chartPaneId : undefined,
          points: [
            { barIndex: p1.barIndex, price: p1.price, date: p1.date },
            { barIndex: clickedBarIdx, price: clickedPrice, date: clickedDate },
          ],
          color: strokeColor,
          fillColor: strokeColor,
          fillOpacity: activeTool === 'rectangle' ? fillOpacity : 0.15,
          lineWidth,
          lineStyle,
          showLabels: true,
          extendRight: activeTool === 'ray',
        };
        const updated = [...drawings, newDrawing];
        updateDrawings(updated);
        setSelectedId(newDrawing.id);
        setPendingPoints([]);
        if (onToolUsed) onToolUsed();
      }
      return;
    }

    // Three-point tools: Parallel Lines / Channel
    if (activeTool === 'parallel_lines' || activeTool === 'parallel_channel') {
      if (pendingPoints.length === 0) {
        setPendingPoints([
          { x: mouseX, y: mouseY, price: clickedPrice, barIndex: clickedBarIdx, date: clickedDate },
        ]);
      } else if (pendingPoints.length === 1) {
        setPendingPoints([
          pendingPoints[0],
          { x: mouseX, y: mouseY, price: clickedPrice, barIndex: clickedBarIdx, date: clickedDate },
        ]);
      } else {
        const p1 = pendingPoints[0];
        const p2 = pendingPoints[1];
        const channelOffset = clickedPrice - p2.price;
        const newDrawing: DrawingItem = {
          id: `draw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tool: 'parallel_lines',
          symbol,
          chartId: typeof chartPaneId === 'number' ? chartPaneId : undefined,
          points: [
            { barIndex: p1.barIndex, price: p1.price, date: p1.date },
            { barIndex: p2.barIndex, price: p2.price, date: p2.date },
          ],
          channelOffset: channelOffset !== 0 ? channelOffset : 25,
          color: strokeColor,
          fillColor: strokeColor,
          fillOpacity,
          lineWidth,
          lineStyle,
          showLabels: true,
        };
        const updated = [...drawings, newDrawing];
        updateDrawings(updated);
        setSelectedId(newDrawing.id);
        setPendingPoints([]);
        if (onToolUsed) onToolUsed();
      }
    }
  };

  // Mouse move over canvas for rubber-band preview & vertex dragging
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = Math.max(0, Math.min(plotWidth, e.clientX - rect.left));
    const mouseY = Math.max(0, Math.min(plotHeight, e.clientY - rect.top));
    setCurrentMousePos({ x: mouseX, y: mouseY });

    // Handle active dragging of drawing or handle
    if (draggingHandle) {
      const currentPrice = getPriceFromY(mouseY);
      const currentBar = getBarIndexFromX(mouseX);

      const startPrice = getPriceFromY(draggingHandle.startMouseY);
      const startBar = getBarIndexFromX(draggingHandle.startMouseX);

      const deltaPrice = currentPrice - startPrice;
      const deltaBar = Math.round(currentBar - startBar);

      setDrawings((prev) =>
        prev.map((d) => {
          if (d.id !== draggingHandle.drawingId || d.locked) return d;

          // Drag whole shape
          if (draggingHandle.pointIndex === 'all') {
            const movedPoints = draggingHandle.initialPoints.map((pt) => {
              const newBarIdx = Math.max(0, Math.min(candlesCount + 50, pt.barIndex + deltaBar));
              return {
                ...pt,
                barIndex: newBarIdx,
                price: Math.round((pt.price + deltaPrice) * 100) / 100,
                date: getDateForBar(newBarIdx),
              };
            });
            return { ...d, points: movedPoints };
          }

          // Drag parallel channel offset
          if (draggingHandle.pointIndex === 'offset') {
            const baseInitialOffset = draggingHandle.initialOffset || 25;
            const newOffset = Math.round((baseInitialOffset + deltaPrice) * 100) / 100;
            return { ...d, channelOffset: newOffset };
          }

          // Drag single vertex
          if (typeof draggingHandle.pointIndex === 'number') {
            const idx = draggingHandle.pointIndex;
            const initPt = draggingHandle.initialPoints[idx];
            if (!initPt) return d;

            const newBarIdx = Math.max(0, Math.min(candlesCount + 50, initPt.barIndex + deltaBar));
            const newPrice = Math.round((initPt.price + deltaPrice) * 100) / 100;

            const nextPoints = [...d.points];
            nextPoints[idx] = {
              barIndex: newBarIdx,
              price: newPrice,
              date: getDateForBar(newBarIdx),
            };
            return { ...d, points: nextPoints };
          }

          return d;
        })
      );
    }
  };

  // Mouse up terminates dragging and commits to storage
  const handleMouseUp = () => {
    if (draggingHandle) {
      saveDrawings(symbol, chartPaneId, drawings);
      if (onDrawingsChange) onDrawingsChange(drawings);
      setDraggingHandle(null);
    }
  };

  // Start dragging a specific vertex handle or the whole drawing
  const handleStartDrag = (
    e: React.MouseEvent,
    drawing: DrawingItem,
    pointIndex: number | 'all' | 'offset'
  ) => {
    e.stopPropagation();
    if (drawing.locked) return;

    setSelectedId(drawing.id);
    const rect = e.currentTarget.closest('svg')?.getBoundingClientRect();
    const startX = rect ? e.clientX - rect.left : e.clientX;
    const startY = rect ? e.clientY - rect.top : e.clientY;

    setDraggingHandle({
      drawingId: drawing.id,
      pointIndex,
      startMouseX: startX,
      startMouseY: startY,
      initialPoints: drawing.points.map((p) => ({ ...p })),
      initialOffset: drawing.channelOffset,
    });
  };

  // Update properties of the selected drawing
  const updateSelectedDrawing = (patch: Partial<DrawingItem>) => {
    if (!selectedId) return;
    const updated = drawings.map((d) => (d.id === selectedId ? { ...d, ...patch } : d));
    updateDrawings(updated);
  };

  // Delete selected drawing
  const deleteSelected = () => {
    if (!selectedId) return;
    const updated = drawings.filter((d) => d.id !== selectedId);
    updateDrawings(updated);
    setSelectedId(null);
  };

  // Duplicate selected drawing
  const duplicateSelected = () => {
    if (!selectedDrawing) return;
    const newDrawing: DrawingItem = {
      ...selectedDrawing,
      id: `draw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      points: selectedDrawing.points.map((p) => ({
        ...p,
        price: p.price * 1.01,
        barIndex: p.barIndex + 2,
      })),
      locked: false,
    };
    const updated = [...drawings, newDrawing];
    updateDrawings(updated);
    setSelectedId(newDrawing.id);
  };

  return (
    <>
      <svg
        className={`absolute inset-0 z-10 ${
          activeTool !== 'cursor' || draggingHandle ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        width={totalWidth}
        height={plotHeight}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          cursor:
            activeTool === 'cursor'
              ? 'default'
              : activeTool === 'eraser'
              ? 'not-allowed'
              : 'crosshair',
        }}
      >
        <defs>
          <filter id="draw-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* ------------------------------------------------------------- */}
        {/* Render Saved Drawings                                         */}
        {/* ------------------------------------------------------------- */}
        {drawings.map((draw) => {
          const isSelected = draw.id === selectedId;
          const stroke = draw.color;
          const sw = draw.lineWidth || 1.5;
          const dash =
            draw.lineStyle === 'dashed'
              ? '5 4'
              : draw.lineStyle === 'dotted'
              ? '2 3'
              : undefined;

          // 1. Horizontal Line / Support Resistance Ray
          if (draw.tool === 'horizontal_line' || draw.tool === 'horizontal_ray') {
            if (draw.points.length === 0) return null;
            const p = draw.points[0];
            const y = getYPrice(p.price);

            return (
              <g
                key={draw.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(draw.id);
                }}
                className="group cursor-pointer pointer-events-auto"
              >
                {/* Wide invisible strike zone */}
                <line
                  x1={0}
                  y1={y}
                  x2={plotWidth}
                  y2={y}
                  stroke="transparent"
                  strokeWidth={12}
                  onMouseDown={(e) => handleStartDrag(e, draw, 'all')}
                />
                {/* Visual Line */}
                <line
                  x1={0}
                  y1={y}
                  x2={plotWidth}
                  y2={y}
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeDasharray={dash}
                  filter={isSelected ? 'url(#draw-shadow)' : undefined}
                />
                {/* Price Tag Badge on Right Margin */}
                <g transform={`translate(${plotWidth + 3}, ${y - 9})`}>
                  <rect
                    width={52}
                    height={18}
                    rx={3}
                    fill="#0f172a"
                    stroke={isSelected ? '#38bdf8' : stroke}
                    strokeWidth={isSelected ? 1.5 : 1}
                  />
                  <text
                    x={26}
                    y={12}
                    fill={stroke}
                    fontSize={9}
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                  >
                    ₹{p.price.toFixed(1)}
                  </text>
                </g>
                {/* Custom Label if present */}
                {draw.text && (
                  <text
                    x={12}
                    y={y - 5}
                    fill={stroke}
                    fontSize={9}
                    fontWeight="600"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {draw.text}
                  </text>
                )}
                {/* Interactive Anchor Handle when selected */}
                {isSelected && !draw.locked && (
                  <circle
                    cx={plotWidth / 2}
                    cy={y}
                    r={5}
                    fill="#ffffff"
                    stroke={stroke}
                    strokeWidth={2}
                    className="cursor-ns-resize"
                    onMouseDown={(e) => handleStartDrag(e, draw, 0)}
                  />
                )}
              </g>
            );
          }

          // 1b. Vertical Line / Date Marker
          if (draw.tool === 'vertical_line' && draw.points.length >= 1) {
            const p = draw.points[0];
            const x = getX(p.barIndex);

            return (
              <g
                key={draw.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(draw.id);
                }}
                className="group cursor-pointer pointer-events-auto"
              >
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={plotHeight}
                  stroke="transparent"
                  strokeWidth={12}
                  onMouseDown={(e) => handleStartDrag(e, draw, 'all')}
                />
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={plotHeight}
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeDasharray={dash}
                  filter={isSelected ? 'url(#draw-shadow)' : undefined}
                />
                {/* Date Tag Badge on Bottom */}
                <g transform={`translate(${x - 30}, ${plotHeight - 17})`}>
                  <rect
                    width={60}
                    height={16}
                    rx={2}
                    fill="#0f172a"
                    stroke={isSelected ? '#38bdf8' : stroke}
                    strokeWidth={isSelected ? 1.5 : 1}
                  />
                  <text
                    x={30}
                    y={11}
                    fill={stroke}
                    fontSize={8}
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                  >
                    {p.date}
                  </text>
                </g>
                {/* Study ID or text label if present */}
                {(draw.studyId || draw.text) && (
                  <text
                    x={x + 4}
                    y={14}
                    fill={stroke}
                    fontSize={9}
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {draw.studyId ? `Study: ${draw.studyId}` : draw.text}
                  </text>
                )}
                {/* Interactive Anchor Handle when selected */}
                {isSelected && !draw.locked && (
                  <circle
                    cx={x}
                    cy={plotHeight / 2}
                    r={5}
                    fill="#ffffff"
                    stroke={stroke}
                    strokeWidth={2}
                    className="cursor-ew-resize"
                    onMouseDown={(e) => handleStartDrag(e, draw, 0)}
                  />
                )}
              </g>
            );
          }

          // 2. Trendline
          if (draw.tool === 'trendline' && draw.points.length >= 2) {
            const p1 = draw.points[0];
            const p2 = draw.points[1];
            const x1 = getX(p1.barIndex);
            const y1 = getYPrice(p1.price);
            const x2 = getX(p2.barIndex);
            const y2 = getYPrice(p2.price);

            return (
              <g
                key={draw.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(draw.id);
                }}
                className="group cursor-pointer pointer-events-auto"
              >
                {/* Hit test area */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="transparent"
                  strokeWidth={14}
                  onMouseDown={(e) => handleStartDrag(e, draw, 'all')}
                />
                {/* Rendered Line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeDasharray={dash}
                  filter={isSelected ? 'url(#draw-shadow)' : undefined}
                />
                {/* Handles when selected */}
                {isSelected && !draw.locked && (
                  <>
                    <circle
                      cx={x1}
                      cy={y1}
                      r={5}
                      fill="#ffffff"
                      stroke={stroke}
                      strokeWidth={2}
                      className="cursor-move"
                      onMouseDown={(e) => handleStartDrag(e, draw, 0)}
                    />
                    <circle
                      cx={x2}
                      cy={y2}
                      r={5}
                      fill="#ffffff"
                      stroke={stroke}
                      strokeWidth={2}
                      className="cursor-move"
                      onMouseDown={(e) => handleStartDrag(e, draw, 1)}
                    />
                  </>
                )}
              </g>
            );
          }

          // 3. Ray (Origin at p1, passes through p2, extends to right edge of chart)
          if (draw.tool === 'ray' && draw.points.length >= 2) {
            const p1 = draw.points[0];
            const p2 = draw.points[1];
            const x1 = getX(p1.barIndex);
            const y1 = getYPrice(p1.price);
            const x2 = getX(p2.barIndex);
            const y2 = getYPrice(p2.price);

            // Extended right endpoint
            const extTargetX = x2 > x1 ? plotWidth : 0;
            const ext = calculateRayEnd(x1, y1, x2, y2, extTargetX);

            return (
              <g
                key={draw.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(draw.id);
                }}
                className="group cursor-pointer pointer-events-auto"
              >
                <line
                  x1={x1}
                  y1={y1}
                  x2={ext.x}
                  y2={ext.y}
                  stroke="transparent"
                  strokeWidth={14}
                  onMouseDown={(e) => handleStartDrag(e, draw, 'all')}
                />
                <line
                  x1={x1}
                  y1={y1}
                  x2={ext.x}
                  y2={ext.y}
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeDasharray={dash}
                  filter={isSelected ? 'url(#draw-shadow)' : undefined}
                />
                {/* Ray arrow head / dot at origin */}
                <circle cx={x1} cy={y1} r={3} fill={stroke} />

                {isSelected && !draw.locked && (
                  <>
                    <circle
                      cx={x1}
                      cy={y1}
                      r={5}
                      fill="#ffffff"
                      stroke={stroke}
                      strokeWidth={2}
                      className="cursor-move"
                      onMouseDown={(e) => handleStartDrag(e, draw, 0)}
                    />
                    <circle
                      cx={x2}
                      cy={y2}
                      r={5}
                      fill="#ffffff"
                      stroke={stroke}
                      strokeWidth={2}
                      className="cursor-move"
                      onMouseDown={(e) => handleStartDrag(e, draw, 1)}
                    />
                  </>
                )}
              </g>
            );
          }

          // 4. Parallel Lines / Channel (Baseline + Offset parallel line + Midline + Shading)
          if (
            (draw.tool === 'parallel_lines' || draw.tool === 'parallel_channel') &&
            draw.points.length >= 2
          ) {
            const p1 = draw.points[0];
            const p2 = draw.points[1];
            const x1 = getX(p1.barIndex);
            const y1 = getYPrice(p1.price);
            const x2 = getX(p2.barIndex);
            const y2 = getYPrice(p2.price);

            const offset = draw.channelOffset || 25;
            const y1Offset = getYPrice(p1.price + offset);
            const y2Offset = getYPrice(p2.price + offset);
            const dy1 = y1Offset - y1;
            const dy2 = y2Offset - y2;

            const fillColor = draw.fillColor || stroke;
            const op = draw.fillOpacity !== undefined ? draw.fillOpacity : 0.15;

            return (
              <g
                key={draw.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(draw.id);
                }}
                className="group cursor-pointer pointer-events-auto"
              >
                {/* Shaded Channel Corridor */}
                <polygon
                  points={`${x1},${y1} ${x2},${y2} ${x2},${y2 + dy2} ${x1},${y1 + dy1}`}
                  fill={fillColor}
                  fillOpacity={op}
                  onMouseDown={(e) => handleStartDrag(e, draw, 'all')}
                />
                {/* Baseline */}
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={sw} />
                {/* Parallel Top/Bottom Line */}
                <line
                  x1={x1}
                  y1={y1 + dy1}
                  x2={x2}
                  y2={y2 + dy2}
                  stroke={stroke}
                  strokeWidth={sw}
                />
                {/* Midline (Dashed) */}
                <line
                  x1={x1}
                  y1={y1 + dy1 / 2}
                  x2={x2}
                  y2={y2 + dy2 / 2}
                  stroke={stroke}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  strokeOpacity={0.7}
                />

                {/* Handles when selected */}
                {isSelected && !draw.locked && (
                  <>
                    <circle
                      cx={x1}
                      cy={y1}
                      r={5}
                      fill="#ffffff"
                      stroke={stroke}
                      strokeWidth={2}
                      className="cursor-move"
                      onMouseDown={(e) => handleStartDrag(e, draw, 0)}
                    />
                    <circle
                      cx={x2}
                      cy={y2}
                      r={5}
                      fill="#ffffff"
                      stroke={stroke}
                      strokeWidth={2}
                      className="cursor-move"
                      onMouseDown={(e) => handleStartDrag(e, draw, 1)}
                    />
                    {/* Parallel Offset Handle */}
                    <circle
                      cx={(x1 + x2) / 2}
                      cy={(y1 + y2) / 2 + (dy1 + dy2) / 4}
                      r={5}
                      fill="#ffffff"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      className="cursor-ns-resize"
                      onMouseDown={(e) => handleStartDrag(e, draw, 'offset')}
                    >
                      <title>Drag to adjust channel parallel width</title>
                    </circle>
                  </>
                )}
              </g>
            );
          }

          // 5. Rectangle / Consolidation Box
          if (draw.tool === 'rectangle' && draw.points.length >= 2) {
            const p1 = draw.points[0];
            const p2 = draw.points[1];
            const x1 = getX(p1.barIndex);
            const y1 = getYPrice(p1.price);
            const x2 = getX(p2.barIndex);
            const y2 = getYPrice(p2.price);

            const rx = Math.min(x1, x2);
            const ry = Math.min(y1, y2);
            const rw = Math.max(2, Math.abs(x2 - x1));
            const rh = Math.max(2, Math.abs(y2 - y1));

            const topPrice = Math.max(p1.price, p2.price);
            const botPrice = Math.min(p1.price, p2.price);
            const diffPct =
              botPrice > 0 ? (((topPrice - botPrice) / botPrice) * 100).toFixed(2) : '0.00';
            const barSpan = Math.abs(p2.barIndex - p1.barIndex);

            const op = draw.fillOpacity !== undefined ? draw.fillOpacity : 0.15;

            return (
              <g
                key={draw.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(draw.id);
                }}
                className="group cursor-pointer pointer-events-auto"
              >
                {/* Filled Rect */}
                <rect
                  x={rx}
                  y={ry}
                  width={rw}
                  height={rh}
                  fill={draw.fillColor || stroke}
                  fillOpacity={op}
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeDasharray={dash}
                  filter={isSelected ? 'url(#draw-shadow)' : undefined}
                  onMouseDown={(e) => handleStartDrag(e, draw, 'all')}
                />
                {/* Informative Stats Header */}
                <g transform={`translate(${rx + 4}, ${ry + 13})`}>
                  <rect
                    x={0}
                    y={-10}
                    width={Math.min(rw - 8, 175)}
                    height={16}
                    rx={2}
                    fill="#0f172a"
                    fillOpacity={0.85}
                  />
                  <text
                    x={4}
                    y={2}
                    fill={stroke}
                    fontSize={9}
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    ₹{botPrice} - ₹{topPrice} (+{diffPct}%) · {barSpan}b
                  </text>
                </g>

                {/* Handles when selected */}
                {isSelected && !draw.locked && (
                  <>
                    <circle
                      cx={x1}
                      cy={y1}
                      r={5}
                      fill="#ffffff"
                      stroke={stroke}
                      strokeWidth={2}
                      className="cursor-nwse-resize"
                      onMouseDown={(e) => handleStartDrag(e, draw, 0)}
                    />
                    <circle
                      cx={x2}
                      cy={y2}
                      r={5}
                      fill="#ffffff"
                      stroke={stroke}
                      strokeWidth={2}
                      className="cursor-nwse-resize"
                      onMouseDown={(e) => handleStartDrag(e, draw, 1)}
                    />
                    <circle
                      cx={x1}
                      cy={y2}
                      r={4}
                      fill="#ffffff"
                      stroke={stroke}
                      strokeWidth={1.5}
                      className="cursor-nesw-resize"
                    />
                    <circle
                      cx={x2}
                      cy={y1}
                      r={4}
                      fill="#ffffff"
                      stroke={stroke}
                      strokeWidth={1.5}
                      className="cursor-nesw-resize"
                    />
                  </>
                )}
              </g>
            );
          }

          // 6. Gann Fan Angles (1x8, 1x4, 1x3, 1x2, 1x1, 2x1, 3x1, 4x1, 8x1)
          if (draw.tool === 'gann_fan' && draw.points.length >= 1) {
            const p0 = draw.points[0];
            const x0 = getX(p0.barIndex);
            const y0 = getYPrice(p0.price);

            // If 2nd point provided, compute dynamic scale factor
            let scaleMultiplier = 0.45;
            if (draw.points.length >= 2) {
              const p1 = draw.points[1];
              const x1 = getX(p1.barIndex);
              const y1 = getYPrice(p1.price);
              const dx = Math.abs(x1 - x0);
              const dy = Math.abs(y1 - y0);
              if (dx > 5) {
                scaleMultiplier = Math.max(0.1, Math.min(2.5, dy / dx));
              }
            }

            const gannRays = [
              { ratio: '1x8', mult: 8.0, angle: '82.5°' },
              { ratio: '1x4', mult: 4.0, angle: '75.0°' },
              { ratio: '1x3', mult: 3.0, angle: '71.2°' },
              { ratio: '1x2', mult: 2.0, angle: '63.7°' },
              { ratio: '1x1', mult: 1.0, angle: '45.0°' },
              { ratio: '2x1', mult: 0.5, angle: '26.3°' },
              { ratio: '3x1', mult: 0.333, angle: '18.7°' },
              { ratio: '4x1', mult: 0.25, angle: '15.0°' },
              { ratio: '8x1', mult: 0.125, angle: '7.5°' },
            ];

            return (
              <g
                key={draw.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(draw.id);
                }}
                className="group cursor-pointer pointer-events-auto"
              >
                {/* Center Pivot Anchor */}
                <circle
                  cx={x0}
                  cy={y0}
                  r={5}
                  fill={stroke}
                  onMouseDown={(e) => handleStartDrag(e, draw, 'all')}
                />
                {/* 9 Gann Rays */}
                {gannRays.map((ray) => {
                  const targetX = plotWidth;
                  const deltaX = targetX - x0;
                  const deltaY = deltaX * ray.mult * scaleMultiplier;
                  const targetY = y0 - deltaY;

                  const isMainRay = ray.ratio === '1x1';

                  return (
                    <g key={ray.ratio}>
                      <line
                        x1={x0}
                        y1={y0}
                        x2={targetX}
                        y2={targetY}
                        stroke={stroke}
                        strokeWidth={isMainRay ? sw + 0.5 : sw}
                        strokeOpacity={isMainRay ? 0.95 : 0.6}
                        strokeDasharray={isMainRay ? undefined : '3 3'}
                      />
                      <text
                        x={targetX - 26}
                        y={Math.max(12, Math.min(plotHeight - 6, targetY))}
                        fill={stroke}
                        fontSize={8}
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight={isMainRay ? '700' : '400'}
                      >
                        {ray.ratio}
                      </text>
                    </g>
                  );
                })}

                {/* Handles when selected */}
                {isSelected && !draw.locked && (
                  <>
                    <circle
                      cx={x0}
                      cy={y0}
                      r={6}
                      fill="#ffffff"
                      stroke={stroke}
                      strokeWidth={2}
                      className="cursor-move"
                      onMouseDown={(e) => handleStartDrag(e, draw, 0)}
                    />
                    {draw.points.length >= 2 && (
                      <circle
                        cx={getX(draw.points[1].barIndex)}
                        cy={getYPrice(draw.points[1].price)}
                        r={5}
                        fill="#ffffff"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        className="cursor-crosshair"
                        onMouseDown={(e) => handleStartDrag(e, draw, 1)}
                      >
                        <title>Drag to reorient Gann 1x1 angle</title>
                      </circle>
                    )}
                  </>
                )}
              </g>
            );
          }

          // 7. Fibonacci Retracement
          if (draw.tool === 'fibonacci' && draw.points.length >= 2) {
            const p1 = draw.points[0];
            const p2 = draw.points[1];
            const y1 = getYPrice(p1.price);
            const y2 = getYPrice(p2.price);
            const diff = p2.price - p1.price;
            const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.618];

            return (
              <g
                key={draw.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(draw.id);
                }}
                className="group cursor-pointer pointer-events-auto"
              >
                {levels.map((lvl) => {
                  const priceLvl = p1.price + diff * lvl;
                  const yLvl = getYPrice(priceLvl);
                  const isGolden = lvl === 0.5 || lvl === 0.618;
                  return (
                    <g key={lvl}>
                      <line
                        x1={0}
                        y1={yLvl}
                        x2={plotWidth}
                        y2={yLvl}
                        stroke={isGolden ? '#eab308' : stroke}
                        strokeWidth={isGolden ? 1.5 : 1}
                        strokeDasharray="3 3"
                        strokeOpacity={0.8}
                      />
                      <text
                        x={plotWidth + 4}
                        y={yLvl + 3}
                        fill={isGolden ? '#eab308' : stroke}
                        fontSize={8}
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {(lvl * 100).toFixed(1)}% (₹{priceLvl.toFixed(1)})
                      </text>
                    </g>
                  );
                })}
                {isSelected && !draw.locked && (
                  <>
                    <circle
                      cx={getX(p1.barIndex)}
                      cy={y1}
                      r={5}
                      fill="#ffffff"
                      stroke={stroke}
                      strokeWidth={2}
                      onMouseDown={(e) => handleStartDrag(e, draw, 0)}
                    />
                    <circle
                      cx={getX(p2.barIndex)}
                      cy={y2}
                      r={5}
                      fill="#ffffff"
                      stroke={stroke}
                      strokeWidth={2}
                      onMouseDown={(e) => handleStartDrag(e, draw, 1)}
                    />
                  </>
                )}
              </g>
            );
          }

          // 8. Price Ruler / Measurement
          if (draw.tool === 'price_range' && draw.points.length >= 2) {
            const p1 = draw.points[0];
            const p2 = draw.points[1];
            const x1 = getX(p1.barIndex);
            const y1 = getYPrice(p1.price);
            const x2 = getX(p2.barIndex);
            const y2 = getYPrice(p2.price);
            const priceDiff = p2.price - p1.price;
            const pctDiff = ((priceDiff / p1.price) * 100).toFixed(2);
            const barsCount = Math.abs(p2.barIndex - p1.barIndex);

            return (
              <g
                key={draw.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(draw.id);
                }}
                className="group cursor-pointer pointer-events-auto"
              >
                <rect
                  x={Math.min(x1, x2)}
                  y={Math.min(y1, y2)}
                  width={Math.abs(x2 - x1)}
                  height={Math.abs(y2 - y1)}
                  fill="rgba(6, 182, 212, 0.12)"
                  stroke="#06b6d4"
                  strokeWidth={1}
                />
                <text
                  x={Math.min(x1, x2) + 6}
                  y={Math.min(y1, y2) + 14}
                  fill="#06b6d4"
                  fontSize={10}
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="700"
                >
                  {priceDiff >= 0 ? '+' : ''}
                  {priceDiff.toFixed(2)} ({pctDiff}%) · {barsCount} bars
                </text>
              </g>
            );
          }

          return null;
        })}

        {/* ------------------------------------------------------------- */}
        {/* Rubber-band Live Creation Preview                             */}
        {/* ------------------------------------------------------------- */}
        {pendingPoints.length > 0 && currentMousePos && (
          <g className="pointer-events-none opacity-80">
            {/* First pending anchor point */}
            <circle cx={pendingPoints[0].x} cy={pendingPoints[0].y} r={5} fill={strokeColor} />

            {/* Rubber line for Trendline, Ray, Fibonacci, Ruler */}
            {(activeTool === 'trendline' ||
              activeTool === 'ray' ||
              activeTool === 'fibonacci' ||
              activeTool === 'price_range') && (
              <line
                x1={pendingPoints[0].x}
                y1={pendingPoints[0].y}
                x2={currentMousePos.x}
                y2={currentMousePos.y}
                stroke={strokeColor}
                strokeWidth={lineWidth}
                strokeDasharray="4 4"
              />
            )}

            {/* Rubber rectangle */}
            {activeTool === 'rectangle' && (
              <rect
                x={Math.min(pendingPoints[0].x, currentMousePos.x)}
                y={Math.min(pendingPoints[0].y, currentMousePos.y)}
                width={Math.abs(currentMousePos.x - pendingPoints[0].x)}
                height={Math.abs(currentMousePos.y - pendingPoints[0].y)}
                fill={strokeColor}
                fillOpacity={0.15}
                stroke={strokeColor}
                strokeWidth={lineWidth}
                strokeDasharray="4 4"
              />
            )}

            {/* Rubber Gann fan */}
            {activeTool === 'gann_fan' && (
              <line
                x1={pendingPoints[0].x}
                y1={pendingPoints[0].y}
                x2={plotWidth}
                y2={currentMousePos.y}
                stroke={strokeColor}
                strokeWidth={1.5}
                strokeDasharray="2 2"
              />
            )}

            {/* Rubber Parallel lines */}
            {activeTool === 'parallel_lines' && pendingPoints.length === 1 && (
              <line
                x1={pendingPoints[0].x}
                y1={pendingPoints[0].y}
                x2={currentMousePos.x}
                y2={currentMousePos.y}
                stroke={strokeColor}
                strokeWidth={lineWidth}
                strokeDasharray="4 4"
              />
            )}

            {activeTool === 'parallel_lines' && pendingPoints.length === 2 && (
              <g>
                <line
                  x1={pendingPoints[0].x}
                  y1={pendingPoints[0].y}
                  x2={pendingPoints[1].x}
                  y2={pendingPoints[1].y}
                  stroke={strokeColor}
                  strokeWidth={lineWidth}
                />
                <line
                  x1={pendingPoints[0].x}
                  y1={currentMousePos.y}
                  x2={pendingPoints[1].x}
                  y2={currentMousePos.y + (pendingPoints[1].y - pendingPoints[0].y)}
                  stroke={strokeColor}
                  strokeWidth={lineWidth}
                  strokeDasharray="3 3"
                />
              </g>
            )}
          </g>
        )}
      </svg>

      {/* ------------------------------------------------------------- */}
      {/* Floating Customization Toolbar for Selected Drawing           */}
      {/* ------------------------------------------------------------- */}
      {selectedDrawing && floatingMenuPos && (
        <div
          className="absolute z-30 flex flex-col gap-1.5 p-2.5 rounded-lg bg-slate-900/98 border border-slate-700 shadow-2xl backdrop-blur text-xs select-none pointer-events-auto animate-in fade-in zoom-in-95 duration-100 w-[260px]"
          style={{
            left: `${floatingMenuPos.x}px`,
            top: `${floatingMenuPos.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Line 1: Header / Tool Label & Deselect Close */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold tracking-wider">
              {selectedDrawing.tool.replace('_', ' ')}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={deleteSelected}
                disabled={selectedDrawing.locked}
                title="Delete Drawing (Del)"
                className="p-1 rounded text-rose-400 hover:text-rose-200 hover:bg-rose-950/80 transition-colors disabled:opacity-30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSelectedId(null)}
                title="Deselect (Esc)"
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Line 2: Color Palette */}
          <div className="flex items-center justify-between gap-1 py-0.5">
            <span className="text-[10px] font-mono text-slate-400">Color:</span>
            <div className="flex items-center gap-1.5">
              {PRESET_DRAWING_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => updateSelectedDrawing({ color: c.hex, fillColor: c.hex })}
                  className={`w-4 h-4 rounded-full border transition-transform ${
                    selectedDrawing.color === c.hex
                      ? 'scale-125 border-white ring-1 ring-white/50'
                      : 'border-slate-800 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Line 3: Stroke Width & Line Style (Below Colors) */}
          <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/80">
            {/* Width: 1px, 2px, 3px */}
            <div className="flex items-center bg-slate-800 rounded p-0.5 border border-slate-700">
              {[1, 2, 3].map((w) => (
                <button
                  key={w}
                  onClick={() => updateSelectedDrawing({ lineWidth: w })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    (selectedDrawing.lineWidth || 1.5) === w
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>

            {/* Style: Solid, Dashed, Dotted */}
            <div className="flex items-center bg-slate-800 rounded p-0.5 border border-slate-700">
              {(['solid', 'dashed', 'dotted'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => updateSelectedDrawing({ lineStyle: st })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    (selectedDrawing.lineStyle || 'solid') === st
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`Style: ${st}`}
                >
                  {st === 'solid' ? '—' : st === 'dashed' ? '--' : '··'}
                </button>
              ))}
            </div>
          </div>

          {/* Line 4 (Optional): Fill Opacity for Boxes & Channels */}
          {(selectedDrawing.tool === 'rectangle' ||
            selectedDrawing.tool === 'parallel_lines' ||
            selectedDrawing.tool === 'parallel_channel') && (
            <div className="flex items-center justify-between bg-slate-800 rounded px-2 py-0.5 border border-slate-700">
              <span className="text-[10px] text-slate-400">Fill Opacity:</span>
              <div className="flex items-center gap-1">
                {[0, 0.15, 0.3, 0.5].map((op) => (
                  <button
                    key={op}
                    onClick={() => updateSelectedDrawing({ fillOpacity: op })}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                      (selectedDrawing.fillOpacity ?? 0.15) === op
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {op * 100}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Line 5: Study ID for AFL and Lock & Duplicate */}
          <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/80">
            <div className="flex items-center bg-slate-800 rounded px-1.5 py-0.5 border border-slate-700 gap-1 flex-1">
              <span className="text-[10px] text-cyan-400 font-mono font-semibold">Study:</span>
              <input
                type="text"
                placeholder="ID (e.g. SU1)"
                value={selectedDrawing.studyId || ''}
                onChange={(e) => updateSelectedDrawing({ studyId: e.target.value.toUpperCase() })}
                className="bg-transparent text-[10px] font-mono text-cyan-200 w-20 focus:outline-none uppercase"
                title="Assign Study ID to reference this line in AFL strategies via Study('ID')"
              />
            </div>

            <div className="flex items-center gap-1">
              {/* Lock / Unlock */}
              <button
                onClick={() => updateSelectedDrawing({ locked: !selectedDrawing.locked })}
                title={selectedDrawing.locked ? 'Unlock Drawing' : 'Lock Drawing'}
                className={`p-1 rounded transition-colors ${
                  selectedDrawing.locked
                    ? 'bg-amber-950 text-amber-400 border border-amber-600/50'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                {selectedDrawing.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              </button>

              {/* Duplicate */}
              <button
                onClick={duplicateSelected}
                title="Duplicate Drawing"
                className="p-1 rounded text-slate-400 hover:text-cyan-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Tool Instruction Tooltip */}
      {activeTool !== 'cursor' && activeTool !== 'eraser' && (
        <div className="absolute bottom-3 left-3 z-20 pointer-events-none flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900/90 border border-cyan-500/40 text-[11px] text-cyan-300 font-mono shadow-md backdrop-blur">
          <CornerDownRight className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>
            {pendingPoints.length === 0
              ? `Click chart to place 1st anchor for ${activeTool.replace('_', ' ')}`
              : pendingPoints.length === 1 &&
                (activeTool === 'parallel_lines' || activeTool === 'parallel_channel')
              ? 'Click to set baseline endpoint'
              : pendingPoints.length === 2 &&
                (activeTool === 'parallel_lines' || activeTool === 'parallel_channel')
              ? 'Click to set parallel width offset'
              : 'Click to place 2nd anchor (Esc to cancel)'}
          </span>
        </div>
      )}
    </>
  );
};
