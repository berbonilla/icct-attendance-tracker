
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import SubjectManager from './SubjectManager';
import DragDropSchedule from './DragDropSchedule';

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

interface ScheduleInputProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: Record<string, any>) => void;
  studentName: string;
}

const ScheduleInput: React.FC<ScheduleInputProps> = ({ isOpen, onClose, onSave, studentName }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedule, setSchedule] = useState<Record<string, ScheduleSlot[]>>({});

  const handleSave = () => {
    if (subjects.length === 0) {
      toast({
        title: "No Subjects",
        description: "Please add at least one subject",
        variant: "destructive"
      });
      return;
    }

    const hasSchedule = Object.keys(schedule).length > 0;
    if (!hasSchedule) {
      toast({
        title: "No Schedule",
        description: "Please add at least one class to the schedule",
        variant: "destructive"
      });
      return;
    }

    // Convert schedule to the format expected by Firebase
    const firebaseSchedule: Record<string, any> = {
      subjects: subjects.reduce((acc, subject) => {
        acc[subject.id] = {
          name: subject.name,
          code: subject.code,
          color: subject.color
        };
        return acc;
      }, {} as Record<string, any>),
      timeSlots: {}
    };

    // Convert schedule slots to Firebase format
    Object.entries(schedule).forEach(([day, slots]) => {
      if (slots.length > 0) {
        firebaseSchedule.timeSlots[day] = slots.map(slot => ({
          timeSlot: slot.timeSlot,
          subjectId: slot.subjectId
        }));
      }
    });

    onSave(firebaseSchedule);
    toast({
      title: "Schedule Saved",
      description: `Schedule for ${studentName} has been saved successfully`,
      duration: 3000
    });
    onClose();
  };

  const resetForm = () => {
    setSubjects([]);
    setSchedule({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-dark-blue flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Set Schedule for {studentName}
          </DialogTitle>
          <DialogDescription>
            Add subjects first, then drag them to time slots to create the weekly schedule
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Subject Management */}
          <SubjectManager 
            subjects={subjects}
            onSubjectsChange={setSubjects}
          />

          {/* Drag and Drop Schedule */}
          <DragDropSchedule
            subjects={subjects}
            schedule={schedule}
            onScheduleChange={setSchedule}
          />

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={resetForm}
              className="flex-1"
            >
              Reset
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
