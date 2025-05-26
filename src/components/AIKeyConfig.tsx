
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Key, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { aiAnalyticsService } from '@/services/aiAnalyticsService';

interface AIKeyConfigProps {
  onKeyConfigured: () => void;
}

const AIKeyConfig: React.FC<AIKeyConfigProps> = ({ onKeyConfigured }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(aiAnalyticsService.hasApiKey());

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      aiAnalyticsService.setApiKey(apiKey.trim());
      setIsConfigured(true);
      onKeyConfigured();
    }
  };

  const handleRemoveKey = () => {
    localStorage.removeItem('openai_api_key');
    setIsConfigured(false);
    setApiKey('');
  };

  if (isConfigured) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">AI Analytics Configured</span>
              <Badge className="bg-green-500 text-white">Active</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleRemoveKey}>
              Remove Key
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-800">
          <Key className="w-5 h-5 mr-2" />
          Configure AI Analytics
        </CardTitle>
        <CardDescription>
          Enter your OpenAI API key to enable real AI-powered attendance analytics and insights.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">OpenAI API Key</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Button onClick={handleSaveKey} disabled={!apiKey.trim()} className="bg-blue-600 hover:bg-blue-700">
            Configure AI Analytics
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
              Get API Key <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        </div>
        
        <p className="text-xs text-gray-600">
          Your API key is stored locally and used only for generating attendance insights.
        </p>
      </CardContent>
    </Card>
  );
};

export default AIKeyConfig;
