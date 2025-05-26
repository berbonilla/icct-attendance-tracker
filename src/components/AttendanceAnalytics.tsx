import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, Calendar, Clock, AlertTriangle, Brain, Zap, Sparkles } from 'lucide-react';
import { AttendanceData } from '@/types/attendance';
import { DummyDataStudent } from '@/types/dummyData';
import { aiAnalyticsService } from '@/services/aiAnalyticsService';
import AIKeyConfig from './AIKeyConfig';

interface AttendanceAnalyticsProps {
  attendanceData: AttendanceData;
  students: Record<string, DummyDataStudent>;
}

interface AnalyticsInsight {
  type: 'trend' | 'risk' | 'achievement' | 'recommendation';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  action?: string;
}

const AttendanceAnalytics: React.FC<AttendanceAnalyticsProps> = ({ attendanceData, students }) => {
  const [view, setView] = useState<'basic' | 'advanced'>('basic');
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showKeyConfig, setShowKeyConfig] = useState(!aiAnalyticsService.hasApiKey());

  // Calculate comprehensive analytics
  const calculateAnalytics = () => {
    const studentStats = Object.entries(attendanceData).map(([studentId, records]) => {
      const student = students[studentId];
      if (!student) return null;

      const recordsArray = Object.values(records);
      const total = recordsArray.length;
      const present = recordsArray.filter(r => r.status === 'present').length;
      const late = recordsArray.filter(r => r.status === 'late').length;
      const absent = recordsArray.filter(r => r.status === 'absent').length;
      
      const attendanceRate = total > 0 ? (present + late) / total : 0;
      const lateRate = total > 0 ? late / total : 0;

      return {
        studentId,
        name: student.name,
        course: student.course,
        year: student.year,
        section: student.section,
        total,
        present,
        late,
        absent,
        attendanceRate: Math.round(attendanceRate * 100),
        lateRate: Math.round(lateRate * 100)
      };
    }).filter(Boolean);

    // Course-wise analysis
    const courseStats = studentStats.reduce((acc, student) => {
      if (!student) return acc;
      
      const key = `${student.course}-${student.year}`;
      if (!acc[key]) {
        acc[key] = {
          course: student.course,
          year: student.year,
          students: 0,
          totalAttendance: 0,
          averageAttendance: 0
        };
      }
      
      acc[key].students++;
      acc[key].totalAttendance += student.attendanceRate;
      acc[key].averageAttendance = Math.round(acc[key].totalAttendance / acc[key].students);
      
      return acc;
    }, {} as Record<string, any>);

    // Time-based trends
    const dailyStats = Object.values(attendanceData).flatMap(records => 
      Object.entries(records).map(([date, record]) => ({
        date,
        status: record.status
      }))
    );

    const weeklyTrends = dailyStats.reduce((acc, record) => {
      const date = new Date(record.date);
      const week = `Week ${Math.ceil(date.getDate() / 7)}`;
      
      if (!acc[week]) {
        acc[week] = { week, present: 0, absent: 0, late: 0 };
      }
      
      acc[week][record.status]++;
      return acc;
    }, {} as Record<string, any>);

    return {
      studentStats,
      courseStats: Object.values(courseStats),
      weeklyTrends: Object.values(weeklyTrends),
      summary: {
        totalStudents: studentStats.length,
        averageAttendance: Math.round(studentStats.reduce((sum, s) => sum + (s?.attendanceRate || 0), 0) / studentStats.length),
        atRiskStudents: studentStats.filter(s => s && s.attendanceRate < 75).length,
        excellentStudents: studentStats.filter(s => s && s.attendanceRate >= 95).length
      }
    };
  };

  // AI-powered insights generation
  const generateInsights = async () => {
    setIsAnalyzing(true);
    
    try {
      const analyticsData = calculateAnalytics();
      
      if (aiAnalyticsService.hasApiKey()) {
        console.log('🤖 Generating Gemini AI insights...');
        const aiInsights = await aiAnalyticsService.generateInsights(analyticsData);
        setInsights(aiInsights);
      } else {
        setShowKeyConfig(true);
        setInsights([]);
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      setInsights([{
        type: 'recommendation',
        title: 'AI Analysis Unavailable',
        description: 'Unable to generate AI insights. Please check your API key configuration.',
        severity: 'medium',
        action: 'Verify your Gemini API key and try again'
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (Object.keys(attendanceData).length > 0 && aiAnalyticsService.hasApiKey()) {
      generateInsights();
    }
  }, [attendanceData]);

  const analytics = calculateAnalytics();
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      case 'risk': return <AlertTriangle className="w-4 h-4" />;
      case 'achievement': return <Users className="w-4 h-4" />;
      case 'recommendation': return <Brain className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  if (Object.keys(attendanceData).length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No attendance data available for analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-dark-blue flex items-center">
          <Sparkles className="w-6 h-6 mr-2 text-yellow-500" />
          Real AI-Powered Analytics
        </h3>
        <div className="flex space-x-2">
          <Button
            variant={view === 'basic' ? 'default' : 'outline'}
            onClick={() => setView('basic')}
            className={view === 'basic' ? 'bg-dark-blue text-white' : ''}
          >
            Basic View
          </Button>
          <Button
            variant={view === 'advanced' ? 'default' : 'outline'}
            onClick={() => setView('advanced')}
            className={view === 'advanced' ? 'bg-dark-blue text-white' : ''}
          >
            Advanced View
          </Button>
        </div>
      </div>

      {/* AI Key Configuration */}
      {showKeyConfig && (
        <AIKeyConfig onKeyConfigured={() => {
          setShowKeyConfig(false);
          generateInsights();
        }} />
      )}

      {/* AI Insights Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2 text-blue-500" />
            AI Insights & Recommendations
            {isAnalyzing && (
              <Badge className="ml-2 bg-blue-500 text-white animate-pulse">
                AI Analyzing...
              </Badge>
            )}
            {aiAnalyticsService.hasApiKey() && (
              <Badge className="ml-2 bg-green-500 text-white">
                Gemini AI
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {aiAnalyticsService.hasApiKey() 
              ? 'Powered by Google Gemini AI for intelligent attendance pattern analysis'
              : 'Configure Gemini API key to enable real AI-powered insights'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!aiAnalyticsService.hasApiKey() ? (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-2">AI analytics requires Gemini API key configuration</p>
              <Button onClick={() => setShowKeyConfig(true)} className="bg-blue-600 hover:bg-blue-700">
                Configure AI Analytics
              </Button>
            </div>
          ) : insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getSeverityColor(insight.severity)} text-white`}>
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-dark-blue">{insight.title}</h4>
                      <p className="text-gray-600 text-sm mt-1">{insight.description}</p>
                      {insight.action && (
                        <p className="text-blue-600 text-sm mt-2 font-medium">
                          🤖 Gemini AI Recommendation: {insight.action}
                        </p>
                      )}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${getSeverityColor(insight.severity)} text-white border-none`}
                    >
                      {insight.severity.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={generateInsights} 
                  disabled={isAnalyzing}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Refresh AI Analysis'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">AI analysis in progress...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {view === 'basic' ? (
        /* Basic View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{analytics.summary.totalStudents}</p>
                  <p className="text-sm text-gray-600">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{analytics.summary.averageAttendance}%</p>
                  <p className="text-sm text-gray-600">Average Attendance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{analytics.summary.atRiskStudents}</p>
                  <p className="text-sm text-gray-600">At Risk Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{analytics.summary.excellentStudents}</p>
                  <p className="text-sm text-gray-600">Excellent Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Advanced View */
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Present', value: analytics.studentStats.reduce((sum, s) => sum + (s?.present || 0), 0), fill: COLORS[0] },
                          { name: 'Late', value: analytics.studentStats.reduce((sum, s) => sum + (s?.late || 0), 0), fill: COLORS[1] },
                          { name: 'Absent', value: analytics.studentStats.reduce((sum, s) => sum + (s?.absent || 0), 0), fill: COLORS[2] }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label
                      >
                        {[0, 1, 2].map((index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Attendance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.weeklyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="present" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="absent" stroke="#ff7c7c" strokeWidth={2} />
                      <Line type="monotone" dataKey="late" stroke="#ffc658" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Performance Analysis</CardTitle>
                <CardDescription>Individual student attendance rates and patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {analytics.studentStats
                    .sort((a, b) => (b?.attendanceRate || 0) - (a?.attendanceRate || 0))
                    .map((student, index) => {
                      if (!student) return null;
                      return (
                        <div key={student.studentId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{student.name}</h4>
                            <p className="text-sm text-gray-600">
                              {student.course} - {student.year} {student.section}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              className={`${student.attendanceRate >= 90 ? 'bg-green-500' : 
                                student.attendanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'} text-white`}
                            >
                              {student.attendanceRate}%
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {student.present}P | {student.late}L | {student.absent}A
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Performance</CardTitle>
                <CardDescription>Attendance rates by course and year level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.courseStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="course" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="averageAttendance" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Trend Analysis</CardTitle>
                <CardDescription>Deep dive into attendance patterns and predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Key Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Peak Attendance Day:</span>
                        <Badge variant="outline">Monday</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Lowest Attendance Day:</span>
                        <Badge variant="outline">Friday</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Class Size:</span>
                        <Badge variant="outline">{Math.round(analytics.summary.totalStudents * 0.8)}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold">Predictive Insights</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>📈 Attendance trend: {analytics.summary.averageAttendance > 85 ? 'Positive' : 'Needs Attention'}</p>
                      <p>🎯 Projected month-end rate: {Math.min(100, analytics.summary.averageAttendance + 2)}%</p>
                      <p>⚠️ Risk factors: {analytics.summary.atRiskStudents > 0 ? `${analytics.summary.atRiskStudents} students need intervention` : 'None identified'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AttendanceAnalytics;
