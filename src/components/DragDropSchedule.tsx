
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Trash2, GripVertical, Plus } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface ScheduleSlot {
  id: string;
  timeSlot: string;
  subjectId: string | null;
}

interface DragDropScheduleProps {
  subjects: Subject[];
  schedule: Record<string, ScheduleSlot[]>;
  onScheduleChange: (schedule: Record<string, ScheduleSlot[]>) => void;
}

const DragDropSchedule: React.FC<DragDropScheduleProps> = ({ subjects, schedule, onScheduleChange }) => {
  const [draggedSubject, setDraggedSubject] = useState<Subject | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<{ day: string; slotId: string } | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [customTimeSlots, setCustomTimeSlots] = useState<Record<string, { startTime: string; endTime: string }>>({});
  const [showCustomTimeInput, setShowCustomTimeInput] = useState<Record<string, boolean>>({});
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  const defaultTimeSlots = [
    '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00',
    '17:00-18:00', '18:00-19:00', '19:00-20:00'
  ];

  const handleSubjectDragStart = (e: React.DragEvent, subject: Subject) => {
    setDraggedSubject(subject);
    setDraggedSlot(null);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleSlotDragStart = (e: React.DragEvent, day: string, slotId: string) => {
    setDraggedSlot({ day, slotId });
    setDraggedSubject(null);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedSlot ? 'move' : 'copy';
  };

  const handleDragEnter = (e: React.DragEvent, day: string, timeSlot: string) => {
    e.preventDefault();
    setDragOverSlot(`${day}-${timeSlot}`);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, day: string, timeSlot: string) => {
    e.preventDefault();
    setDragOverSlot(null);
    
    const newSchedule = { ...schedule };

    if (draggedSubject) {
      // Dropping a subject from the palette
      if (!newSchedule[day]) {
        newSchedule[day] = [];
      }

      const existingSlotIndex = newSchedule[day].findIndex(slot => slot.timeSlot === timeSlot);
      
      if (existingSlotIndex >= 0) {
        newSchedule[day][existingSlotIndex].subjectId = draggedSubject.id;
      } else {
        newSchedule[day].push({
          id: `${day}-${timeSlot}-${Date.now()}`,
          timeSlot,
          subjectId: draggedSubject.id
        });
      }

      newSchedule[day].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
    } else if (draggedSlot) {
      // Moving an existing slot
      const sourceDay = draggedSlot.day;
      const sourceSlotIndex = newSchedule[sourceDay]?.findIndex(slot => slot.id === draggedSlot.slotId);
      
      if (sourceSlotIndex !== undefined && sourceSlotIndex >= 0) {
        const movedSlot = newSchedule[sourceDay][sourceSlotIndex];
        
        // Remove from source
        newSchedule[sourceDay].splice(sourceSlotIndex, 1);
        if (newSchedule[sourceDay].length === 0) {
          delete newSchedule[sourceDay];
        }
        
        // Add to destination
        if (!newSchedule[day]) {
          newSchedule[day] = [];
        }
        
        const existingSlotIndex = newSchedule[day].findIndex(slot => slot.timeSlot === timeSlot);
        if (existingSlotIndex >= 0) {
          newSchedule[day][existingSlotIndex].subjectId = movedSlot.subjectId;
        } else {
          newSchedule[day].push({
            ...movedSlot,
            id: `${day}-${timeSlot}-${Date.now()}`,
            timeSlot
          });
        }
        
        newSchedule[day].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
      }
    }

    onScheduleChange(newSchedule);
    setDraggedSubject(null);
    setDraggedSlot(null);
  };

  const removeSlot = (day: string, slotId: string) => {
    const newSchedule = { ...schedule };
    if (newSchedule[day]) {
      newSchedule[day] = newSchedule[day].filter(slot => slot.id !== slotId);
      if (newSchedule[day].length === 0) {
        delete newSchedule[day];
      }
    }
    onScheduleChange(newSchedule);
  };

  const addCustomTimeSlot = (day: string) => {
    const customTime = customTimeSlots[day];
    if (!customTime || !customTime.startTime || !customTime.endTime) return;

    const timeSlot = `${customTime.startTime}-${customTime.endTime}`;
    const newSchedule = { ...schedule };
    
    if (!newSchedule[day]) {
      newSchedule[day] = [];
    }

    // Check if this time slot already exists
    const existingSlot = newSchedule[day].find(slot => slot.timeSlot === timeSlot);
    if (existingSlot) return;

    newSchedule[day].push({
      id: `${day}-${timeSlot}-${Date.now()}`,
      timeSlot,
      subjectId: null
    });

    newSchedule[day].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
    onScheduleChange(newSchedule);

    // Reset custom time input
    setCustomTimeSlots(prev => ({
      ...prev,
      [day]: { startTime: '', endTime: '' }
    }));
    setShowCustomTimeInput(prev => ({
      ...prev,
      [day]: false
    }));
  };

  const getSubjectForSlot = (subjectId: string | null) => {
    return subjects.find(s => s.id === subjectId);
  };

  const getTotalClasses = () => {
    return Object.values(schedule).reduce((total, slots) => total + slots.length, 0);
  };

  const validateTime = (time: string) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const isValidTimeRange = (startTime: string, endTime: string) => {
    if (!validateTime(startTime) || !validateTime(endTime)) return false;
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes > startMinutes;
  };

  // Handle drop directly on existing slot (for both custom and preset time slots)
  const handleSlotDrop = (e: React.DragEvent, day: string, slotId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedSubject) return;
    
    const newSchedule = { ...schedule };
    if (!newSchedule[day]) return;
    
    const slotIndex = newSchedule[day].findIndex(slot => slot.id === slotId);
    if (slotIndex >= 0) {
      newSchedule[day][slotIndex].subjectId = draggedSubject.id;
      onScheduleChange(newSchedule);
    }
    
    setDraggedSubject(null);
    setDragOverSlot(null);
  };

  return (
    <div className="space-y-6">
      {/* Draggable subjects */}
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <h3 className="font-semibold text-dark-blue flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Drag Subjects to Time Slots
        </h3>
        {subjects.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                draggable
                onDragStart={(e) => handleSubjectDragStart(e, subject)}
                className={`${subject.color} px-3 py-2 rounded cursor-move hover:shadow-md transition-all duration-200 hover:scale-105 select-none flex items-center`}
              >
                <GripVertical className="w-4 h-4 mr-1 opacity-60" />
                <div>
                  <span className="font-medium block">{subject.code}</span>
                  <span className="text-sm">{subject.name}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">Add subjects first to create schedule</p>
        )}
      </div>

      {/* Schedule grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-dark-blue">Weekly Schedule</h3>
          <Badge variant="outline">Total Classes: {getTotalClasses()}</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {days.map(day => (
            <div key={day} className="space-y-2">
              <Label className="font-medium text-lg">
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </Label>
              
              <div className="space-y-1 min-h-[200px] p-3 border rounded bg-white">
                {/* Show existing schedule slots */}
                {schedule[day]?.map((slot) => {
                  const subject = getSubjectForSlot(slot.subjectId);
                  const dropZoneId = `${day}-${slot.timeSlot}`;
                  const isHighlighted = dragOverSlot === dropZoneId;
                  
                  return (
                    <div
                      key={slot.id}
                      draggable={slot.subjectId !== null}
                      onDragStart={(e) => slot.subjectId && handleSlotDragStart(e, day, slot.id)}
                      onDragOver={handleDragOver}
                      onDragEnter={(e) => handleDragEnter(e, day, slot.timeSlot)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleSlotDrop(e, day, slot.id)}
                      className={`flex items-center justify-between p-2 rounded text-sm transition-all duration-200 ${
                        subject 
                          ? `${subject.color} cursor-move hover:shadow-md` 
                          : 'bg-gray-100 border-2 border-dashed border-gray-300'
                      } ${isHighlighted ? 'ring-2 ring-blue-500 scale-105' : ''}`}
                    >
                      <div className="flex items-center">
                        <GripVertical className="w-3 h-3 mr-2 opacity-60" />
                        <div>
                          <span className="font-mono font-medium">{slot.timeSlot}</span>
                          {subject && (
                            <span className="ml-2 font-medium">
                              {subject.code} - {subject.name}
                            </span>
                          )}
                          {!subject && (
                            <span className="ml-2 text-gray-500 italic">
                              Drop subject here
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSlot(day, slot.id)}
                        className="h-6 w-6 p-0 text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}

                {/* Custom time slot input */}
                <div className="space-y-2 pt-2 border-t">
                  {!showCustomTimeInput[day] ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomTimeInput(prev => ({ ...prev, [day]: true }))}
                      className="w-full text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Custom Time Slot
                    </Button>
                  ) : (
                    <div className="space-y-2 p-2 bg-blue-50 rounded border">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Start Time</Label>
                          <Input
                            type="time"
                            value={customTimeSlots[day]?.startTime || ''}
                            onChange={(e) => setCustomTimeSlots(prev => ({
                              ...prev,
                              [day]: { ...prev[day], startTime: e.target.value }
                            }))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">End Time</Label>
                          <Input
                            type="time"
                            value={customTimeSlots[day]?.endTime || ''}
                            onChange={(e) => setCustomTimeSlots(prev => ({
                              ...prev,
                              [day]: { ...prev[day], endTime: e.target.value }
                            }))}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => addCustomTimeSlot(day)}
                          disabled={!customTimeSlots[day] || !isValidTimeRange(customTimeSlots[day].startTime, customTimeSlots[day].endTime)}
                          className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700"
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowCustomTimeInput(prev => ({ ...prev, [day]: false }));
                            setCustomTimeSlots(prev => ({ ...prev, [day]: { startTime: '', endTime: '' } }));
                          }}
                          className="flex-1 h-7 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Drop zones for default time slots */}
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 mt-2">Or drop subjects on preset time slots:</p>
                  {defaultTimeSlots.map(timeSlot => {
                    const hasSlot = schedule[day]?.some(slot => slot.timeSlot === timeSlot);
                    if (hasSlot) return null;
                    
                    const dropZoneId = `${day}-${timeSlot}`;
                    const isHighlighted = dragOverSlot === dropZoneId;
                    
                    return (
                      <div
                        key={timeSlot}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, day, timeSlot)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, day, timeSlot)}
                        className={`border-2 border-dashed p-2 rounded text-center text-sm transition-all duration-200 ${
                          isHighlighted 
                            ? 'border-blue-500 bg-blue-50 scale-105' 
                            : 'border-gray-300 text-gray-500 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {timeSlot}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DragDropSchedule;
