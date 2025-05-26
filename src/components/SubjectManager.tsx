
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface SubjectManagerProps {
  subjects: Subject[];
  onSubjectsChange: (subjects: Subject[]) => void;
}

const SubjectManager: React.FC<SubjectManagerProps> = ({ subjects, onSubjectsChange }) => {
  const [newSubject, setNewSubject] = useState({ name: '', code: '' });
  
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800',
    'bg-red-100 text-red-800',
    'bg-orange-100 text-orange-800'
  ];

  const addSubject = () => {
    if (!newSubject.name.trim() || !newSubject.code.trim()) {
      toast({
        title: "Error",
        description: "Please enter both subject name and code",
        variant: "destructive"
      });
      return;
    }

    const subject: Subject = {
      id: Date.now().toString(),
      name: newSubject.name.trim(),
      code: newSubject.code.trim().toUpperCase(),
      color: colors[subjects.length % colors.length]
    };

    onSubjectsChange([...subjects, subject]);
    setNewSubject({ name: '', code: '' });
  };

  const removeSubject = (id: string) => {
    onSubjectsChange(subjects.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <BookOpen className="w-5 h-5" />
        <h3 className="font-semibold">Subjects</h3>
      </div>
      
      {/* Add new subject */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div>
          <Label htmlFor="subject-code">Subject Code</Label>
          <Input
            id="subject-code"
            value={newSubject.code}
            onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
            placeholder="CS101"
            maxLength={10}
          />
        </div>
        <div>
          <Label htmlFor="subject-name">Subject Name</Label>
          <Input
            id="subject-name"
            value={newSubject.name}
            onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
            placeholder="Computer Science"
            maxLength={50}
          />
        </div>
        <div className="flex items-end">
          <Button onClick={addSubject} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </Button>
        </div>
      </div>

      {/* Subject list */}
      {subjects.length > 0 && (
        <div className="space-y-2">
          <Label>Current Subjects:</Label>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <Badge key={subject.id} variant="secondary" className={`${subject.color} flex items-center space-x-2`}>
                <span>{subject.code} - {subject.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeSubject(subject.id)}
                  className="h-4 w-4 p-0 hover:bg-red-200"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManager;
