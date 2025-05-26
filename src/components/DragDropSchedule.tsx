
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Trash2 } from 'lucide-react';

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
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  const timeSlots = [
    '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00',
    '17:00-18:00', '18:00-19:00', '19:00-20:00'
  ];

  const handleDragStart = (e: React.DragEvent, subject: Subject) => {
    setDraggedSubject(subject);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent, day: string, timeSlot: string) => {
    e.preventDefault();
    
    if (!draggedSubject) return;

    const newSchedule = { ...schedule };
    if (!newSchedule[day]) {
      newSchedule[day] = [];
    }

    // Check if this time slot already exists
    const existingSlotIndex = newSchedule[day].findIndex(slot => slot.timeSlot === timeSlot);
    
    if (existingSlotIndex >= 0) {
      // Update existing slot
      newSchedule[day][existingSlotIndex].subjectId = draggedSubject.id;
    } else {
      // Add new slot
      newSchedule[day].push({
        id: `${day}-${timeSlot}-${Date.now()}`,
        timeSlot,
        subjectId: draggedSubject.id
      });
    }

    // Sort slots by time
    newSchedule[day].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

    onScheduleChange(newSchedule);
    setDraggedSubject(null);
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

  const getSubjectForSlot = (subjectId: string | null) => {
    return subjects.find(s => s.id === subjectId);
  };

  const getTotalClasses = () => {
    return Object.values(schedule).reduce((total, slots) => total + slots.length, 0);
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
                onDragStart={(e) => handleDragStart(e, subject)}
                className={`${subject.color} px-3 py-2 rounded cursor-move hover:shadow-md transition-shadow`}
              >
                <span className="font-medium">{subject.code}</span>
                <span className="text-sm block">{subject.name}</span>
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
                  return (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between p-2 rounded text-sm ${
                        subject ? subject.color : 'bg-gray-100'
                      }`}
                    >
                      <div>
                        <span className="font-mono font-medium">{slot.timeSlot}</span>
                        {subject && (
                          <span className="ml-2 font-medium">
                            {subject.code} - {subject.name}
                          </span>
                        )}
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

                {/* Drop zones for new time slots */}
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 mt-2">Drop subjects on time slots:</p>
                  {timeSlots.map(timeSlot => {
                    const hasSlot = schedule[day]?.some(slot => slot.timeSlot === timeSlot);
                    if (hasSlot) return null;
                    
                    return (
                      <div
                        key={timeSlot}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, day, timeSlot)}
                        className="border-2 border-dashed border-gray-300 p-2 rounded text-center text-sm text-gray-500 hover:border-blue-300 hover:bg-blue-50 transition-colors"
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
