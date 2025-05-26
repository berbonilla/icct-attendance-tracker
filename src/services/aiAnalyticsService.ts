
interface AttendanceInsight {
  type: 'trend' | 'risk' | 'achievement' | 'recommendation';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  action?: string;
}

interface AnalyticsData {
  studentStats: any[];
  courseStats: any[];
  weeklyTrends: any[];
  summary: {
    totalStudents: number;
    averageAttendance: number;
    atRiskStudents: number;
    excellentStudents: number;
  };
}

export class AIAnalyticsService {
  private apiKey: string | null = null;

  constructor() {
    // Check for API key in localStorage (temporary solution)
    this.apiKey = localStorage.getItem('openai_api_key');
  }

  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('openai_api_key', key);
  }

  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  async generateInsights(analyticsData: AnalyticsData): Promise<AttendanceInsight[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const prompt = this.buildAnalyticsPrompt(analyticsData);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an AI analytics expert specializing in educational attendance data. Analyze the provided data and generate actionable insights in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const insights = JSON.parse(data.choices[0].message.content);
      
      return insights.map((insight: any) => ({
        type: insight.type || 'recommendation',
        title: insight.title,
        description: insight.description,
        severity: insight.severity || 'medium',
        action: insight.action
      }));
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return this.getFallbackInsights(analyticsData);
    }
  }

  private buildAnalyticsPrompt(data: AnalyticsData): string {
    return `
Analyze this educational attendance data and provide 3-5 actionable insights in JSON format:

ATTENDANCE SUMMARY:
- Total Students: ${data.summary.totalStudents}
- Average Attendance: ${data.summary.averageAttendance}%
- At-Risk Students (< 75%): ${data.summary.atRiskStudents}
- Excellent Students (≥ 95%): ${data.summary.excellentStudents}

STUDENT PERFORMANCE:
${data.studentStats.slice(0, 10).map(s => 
  `- ${s?.name}: ${s?.attendanceRate}% (${s?.course})`
).join('\n')}

COURSE ANALYSIS:
${data.courseStats.map(c => 
  `- ${c.course} Year ${c.year}: ${c.averageAttendance}% avg (${c.students} students)`
).join('\n')}

WEEKLY TRENDS:
${data.weeklyTrends.slice(0, 4).map(w => 
  `- ${w.week}: ${w.present} present, ${w.absent} absent, ${w.late} late`
).join('\n')}

Return a JSON array of insights with this structure:
[
  {
    "type": "trend|risk|achievement|recommendation",
    "title": "Brief insight title",
    "description": "Detailed analysis (max 100 words)",
    "severity": "low|medium|high",
    "action": "Specific recommended action"
  }
]

Focus on:
1. Attendance trends and patterns
2. At-risk student identification
3. Course-specific issues
4. Actionable recommendations
5. Positive achievements to highlight
`;
  }

  private getFallbackInsights(data: AnalyticsData): AttendanceInsight[] {
    const insights: AttendanceInsight[] = [];

    if (data.summary.averageAttendance < 80) {
      insights.push({
        type: 'trend',
        title: 'Below Average Attendance',
        description: `Overall attendance at ${data.summary.averageAttendance}% needs improvement. Consider reviewing engagement strategies and identifying barriers to attendance.`,
        severity: 'high',
        action: 'Implement student engagement initiatives and conduct attendance surveys'
      });
    }

    if (data.summary.atRiskStudents > 0) {
      insights.push({
        type: 'risk',
        title: 'Students Requiring Intervention',
        description: `${data.summary.atRiskStudents} students have concerning attendance patterns. Early intervention is crucial for academic success.`,
        severity: 'high',
        action: 'Schedule one-on-one meetings with at-risk students'
      });
    }

    if (data.summary.excellentStudents > 0) {
      insights.push({
        type: 'achievement',
        title: 'Outstanding Attendance Performance',
        description: `${data.summary.excellentStudents} students demonstrate excellent attendance habits. Consider peer mentoring programs.`,
        severity: 'low',
        action: 'Recognize high-performing students and create mentorship opportunities'
      });
    }

    return insights;
  }
}

export const aiAnalyticsService = new AIAnalyticsService();
