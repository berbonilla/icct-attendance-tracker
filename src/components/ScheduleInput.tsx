
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ScheduleInputProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: Record<string, string[]>) => void;
  studentName: string;
}

const ScheduleInput: React.FC<ScheduleInputProps> = ({ isOpen, onClose, onSave, studentName }) => {
  const [schedule, setSchedule] = useState<Record<string, string[]>>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });
  const [currentDay, setCurrentDay] = useState<string>('monday');
  const [timeSlot, setTimeSlot] = useState<string>('');

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const addTimeSlot = () => {
    if (!timeSlot.trim()) {
      toast({
        title: "Error",
        description: "Please enter a time slot",
        variant: "destructive"
      });
      return;
    }

    // Validate time slot format (HH:MM-HH:MM)
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(timeSlot)) {
      toast({
        title: "Invalid Format",
        description: "Please use format HH:MM-HH:MM (e.g., 08:00-09:30)",
        variant: "destructive"
      });
      return;
    }

    setSchedule(prev => ({
      ...prev,
      [currentDay]: [...prev[currentDay], timeSlot]
    }));
    setTimeSlot('');
  };

  const removeTimeSlot = (day: string, index: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    // Filter out days with no time slots
    const filteredSchedule = Object.fromEntries(
      Object.entries(schedule).filter(([_, timeSlots]) => timeSlots.length > 0)
    );

    if (Object.keys(filteredSchedule).length === 0) {
      toast({
        title: "No Schedule",
        description: "Please add at least one time slot for any day",
        variant: "destructive"
      });
      return;
    }

    onSave(filteredSchedule);
    toast({
      title: "Schedule Saved",
      description: `Schedule for ${studentName} has been saved successfully`,
      duration: 3000
    });
    onClose();
  };

  const getTotalClasses = () => {
    return Object.values(schedule).reduce((total, slots) => total + slots.length, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-dark-blue flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Set Schedule for {studentName}
          </DialogTitle>
          <DialogDescription>
            Add class time slots for each day of the week. Use format HH:MM-HH:MM (e.g., 08:00-09:30)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add Time Slot Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold text-dark-blue">Add Time Slot</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="day-select">Day</Label>
                <select
                  id="day-select"
                  value={currentDay}
                  onChange={(e) => setCurrentDay(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-light-blue"
                >
                  {days.map(day => (
                    <option key={day} value={day}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time-slot">Time Slot</Label>
                <Input
                  id="time-slot"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  placeholder="08:00-09:30"
                  pattern="[0-9]{2}:[0-9]{2}-[0-9]{2}:[0-9]{2}"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={addTimeSlot}
                  className="w-full bg-light-blue hover:bg-dark-blue text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Schedule Overview */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-dark-blue">Schedule Overview</h3>
              <Badge variant="outline">
                Total Classes: {getTotalClasses()}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {days.map(day => (
                <div key={day} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      {schedule[day].length} classes
                    </Badge>
                  </div>
                  <div className="space-y-1 min-h-[60px] p-2 border rounded bg-white">
                    {schedule[day].length > 0 ? (
                      schedule[day].map((slot, index) => (
                        <div key={index} className="flex items-center justify-between bg-light-blue/10 px-2 py-1 rounded text-sm">
                          <span className="font-mono">{slot}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeTimeSlot(day, index)}
                            className="h-6 w-6 p-0 text-red hover:bg-red hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm italic">No classes</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-dark-blue hover:bg-light-blue text-white"
            >
              Save Schedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleInput;
