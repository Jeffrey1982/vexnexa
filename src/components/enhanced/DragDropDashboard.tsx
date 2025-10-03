"use client";

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  UniqueIdentifier
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Target,
  PieChart,
  Activity,
  Clock,
  Shield,
  Eye,
  EyeOff,
  GripVertical
} from 'lucide-react';

interface Widget {
  id: string;
  type: 'score' | 'issues' | 'trends' | 'heatmap' | 'benchmark' | 'activity' | 'roi' | 'priority';
  title: string;
  description: string;
  icon: React.ReactNode;
  data?: any;
  size: 'small' | 'medium' | 'large';
  visible: boolean;
}

interface SortableWidgetProps {
  widget: Widget;
  onToggleVisibility: (id: string) => void;
}

function SortableWidget({ widget, onToggleVisibility }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1 row-span-1';
      case 'medium':
        return 'col-span-2 row-span-1';
      case 'large':
        return 'col-span-2 row-span-2';
      default:
        return 'col-span-1 row-span-1';
    }
  };

  if (!widget.visible) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${getSizeClasses(widget.size)} ${isDragging ? 'z-50' : ''}`}
    >
      <Card className="h-full group hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {widget.icon}
              <CardTitle className="text-base">{widget.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onToggleVisibility(widget.id)}
              >
                <EyeOff className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-xs">{widget.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <WidgetContent widget={widget} />
        </CardContent>
      </Card>
    </div>
  );
}

function WidgetContent({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case 'score':
      return (
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {widget.data?.score || 85}/100
          </div>
          <div className="text-xs text-gray-600">Accessibility Score</div>
          <div className="mt-2">
            <Badge variant={widget.data?.score >= 80 ? 'default' : 'secondary'}>
              {widget.data?.score >= 80 ? 'Excellent' : 'Good'}
            </Badge>
          </div>
        </div>
      );

    case 'issues':
      return (
        <div className="space-y-2">
          {[
            { label: 'Critical', value: widget.data?.critical || 3, color: 'text-red-600' },
            { label: 'Serious', value: widget.data?.serious || 7, color: 'text-orange-600' },
            { label: 'Moderate', value: widget.data?.moderate || 12, color: 'text-yellow-600' },
            { label: 'Minor', value: widget.data?.minor || 8, color: 'text-gray-600' },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{item.label}</span>
              <span className={`font-semibold ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      );

    case 'trends':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Score Trend</span>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs font-medium">+12%</span>
            </div>
          </div>
          <div className="h-16 bg-gradient-to-r from-red-100 to-green-100 rounded flex items-end">
            {[60, 65, 70, 75, 82, 85].map((value, index) => (
              <div
                key={index}
                className="flex-1 bg-blue-400 mx-0.5 rounded-t"
                style={{ height: `${(value / 100) * 100}%` }}
              />
            ))}
          </div>
        </div>
      );

    case 'heatmap':
      return (
        <div className="relative h-24 bg-gray-100 rounded overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-red-200 to-transparent opacity-60" />
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-red-500 rounded-full opacity-70"
              style={{
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 60 + 20}%`,
              }}
            />
          ))}
          <div className="absolute bottom-2 left-2 text-xs text-gray-600">
            8 critical issues
          </div>
        </div>
      );

    case 'benchmark':
      return (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Your Score</span>
            <span className="font-semibold">85</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }} />
          </div>
          <div className="flex justify-between items-center text-xs text-gray-600">
            <span>Industry Avg: 72</span>
            <span>+18% above avg</span>
          </div>
        </div>
      );

    case 'activity':
      return (
        <div className="space-y-2">
          {[
            'New scan completed',
            '3 issues resolved',
            'Score improved by 5 points',
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-gray-600">{activity}</span>
            </div>
          ))}
        </div>
      );

    case 'roi':
      return (
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">$12,400</div>
          <div className="text-xs text-gray-600 mb-2">Estimated ROI</div>
          <Badge variant="outline" className="text-xs">
            Legal Risk Reduction
          </Badge>
        </div>
      );

    case 'priority':
      return (
        <div className="space-y-2">
          {[
            { priority: 'High', task: 'Fix color contrast', color: 'bg-red-500' },
            { priority: 'Med', task: 'Add alt text', color: 'bg-yellow-500' },
            { priority: 'Low', task: 'Update headings', color: 'bg-green-500' },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-gray-600">{item.task}</span>
            </div>
          ))}
        </div>
      );

    default:
      return <div>Widget content</div>;
  }
}

interface DragDropDashboardProps {
  className?: string;
}

export function DragDropDashboard({ className }: DragDropDashboardProps) {
  const [widgets, setWidgets] = useState<Widget[]>([
    {
      id: 'score',
      type: 'score',
      title: 'Overall Score',
      description: 'Current accessibility rating',
      icon: <BarChart3 className="h-4 w-4 text-green-600" />,
      size: 'small',
      visible: true,
    },
    {
      id: 'issues',
      type: 'issues',
      title: 'Issues Breakdown',
      description: 'Issues by severity level',
      icon: <AlertTriangle className="h-4 w-4 text-orange-600" />,
      size: 'small',
      visible: true,
    },
    {
      id: 'trends',
      type: 'trends',
      title: 'Score Trends',
      description: 'Performance over time',
      icon: <TrendingUp className="h-4 w-4 text-blue-600" />,
      size: 'medium',
      visible: true,
    },
    {
      id: 'heatmap',
      type: 'heatmap',
      title: 'Issue Heatmap',
      description: 'Visual issue distribution',
      icon: <Target className="h-4 w-4 text-red-600" />,
      size: 'medium',
      visible: true,
    },
    {
      id: 'benchmark',
      type: 'benchmark',
      title: 'Benchmark',
      description: 'Compare to industry',
      icon: <PieChart className="h-4 w-4 text-purple-600" />,
      size: 'small',
      visible: true,
    },
    {
      id: 'activity',
      type: 'activity',
      title: 'Recent Activity',
      description: 'Latest updates',
      icon: <Activity className="h-4 w-4 text-indigo-600" />,
      size: 'small',
      visible: true,
    },
    {
      id: 'roi',
      type: 'roi',
      title: 'ROI Calculator',
      description: 'Financial impact',
      icon: <Clock className="h-4 w-4 text-green-600" />,
      size: 'small',
      visible: false,
    },
    {
      id: 'priority',
      type: 'priority',
      title: 'Priority Tasks',
      description: 'Next actions to take',
      icon: <Shield className="h-4 w-4 text-blue-600" />,
      size: 'small',
      visible: false,
    },
  ]);

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  }, []);

  const toggleWidgetVisibility = useCallback((id: string) => {
    setWidgets((widgets) =>
      widgets.map((widget) =>
        widget.id === id ? { ...widget, visible: !widget.visible } : widget
      )
    );
  }, []);

  const visibleWidgets = widgets.filter((widget) => widget.visible);
  const hiddenWidgets = widgets.filter((widget) => !widget.visible);

  const saveLayout = () => {
    // Save current widget configuration to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
    }
  };

  const loadLayout = () => {
    // Load widget configuration from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-widgets');
      if (saved) {
        try {
          setWidgets(JSON.parse(saved));
        } catch (error) {
          console.error('Failed to load saved layout:', error);
        }
      }
    }
  };

  React.useEffect(() => {
    loadLayout();
  }, []);

  React.useEffect(() => {
    if (widgets.length > 0) {
      saveLayout();
    }
  }, [widgets]);

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-gray-600">Customize your accessibility overview</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Customize Layout</span>
            <Switch
              checked={isCustomizing}
              onCheckedChange={setIsCustomizing}
            />
          </div>
          <Button variant="outline" size="sm" onClick={saveLayout}>
            <Settings className="h-4 w-4 mr-2" />
            Save Layout
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isCustomizing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-blue-50 rounded-lg border"
          >
            <h3 className="font-semibold mb-3">Widget Visibility</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {widgets.map((widget) => (
                <div key={widget.id} className="flex items-center gap-2">
                  <Switch
                    checked={widget.visible}
                    onCheckedChange={() => toggleWidgetVisibility(widget.id)}
                  />
                  <div className="flex items-center gap-2">
                    {widget.icon}
                    <span className="text-sm">{widget.title}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-blue-700">
                💡 Drag widgets to rearrange them. Your layout is saved automatically.
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('dashboard-widgets');
                    window.location.reload();
                  }
                }}
              >
                Reset to Default
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visibleWidgets} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-min">
            {visibleWidgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                onToggleVisibility={toggleWidgetVisibility}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <div className="opacity-90">
              <Card className="shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {widgets.find((w) => w.id === activeId)?.icon}
                    <CardTitle className="text-base">
                      {widgets.find((w) => w.id === activeId)?.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-gray-400">Dragging...</div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {hiddenWidgets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-gray-400" />
            Hidden Widgets ({hiddenWidgets.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {hiddenWidgets.map((widget) => (
              <Card key={widget.id} className="opacity-60 hover:opacity-100 transition-opacity">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {widget.icon}
                      <CardTitle className="text-base">{widget.title}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleWidgetVisibility(widget.id)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                  <CardDescription className="text-xs">{widget.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}