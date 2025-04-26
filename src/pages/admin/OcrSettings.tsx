import React, { useState, useEffect } from 'react';
import { Image, RefreshCw, Save, ExternalLink } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { isAdmin } from '../../lib/admin';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface OcrConfig {
  api_key: string;
  language: string;
  confidence_threshold: number;
  max_file_size: number;
  allowed_types: string[];
}

const defaultConfig: OcrConfig = {
  api_key: '',
  language: 'eng',
  confidence_threshold: 80,
  max_file_size: 5242880, // 5MB
  allowed_types: ['image/jpeg', 'image/png', 'image/webp']
};

const OcrSettings: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<OcrConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to access this page');
        navigate('/login');
        return;
      }

      const isUserAdmin = await isAdmin(session.user.id);
      if (!isUserAdmin) {
        toast.error('You do not have permission to access this page');
        navigate('/');
        return;
      }

      loadConfig();
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast.error('Error verifying admin access');
      navigate('/');
    }
  };

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'ocr_config')
        .maybeSingle();

      if (error) throw error;
      
      if (data?.value) {
        setConfig(data.value);
      } else {
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error('Error loading OCR config:', error);
      toast.error('Failed to load OCR configuration');
      setConfig(defaultConfig);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'ocr_config',
          value: config,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key',
        });

      if (error) throw error;
      toast.success('OCR configuration saved successfully');
    } catch (error) {
      console.error('Error saving OCR config:', error);
      toast.error('Failed to save OCR configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">OCR Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure OCR settings for receipt processing</p>
      </div>

      <Card title="Getting Started with OCR" icon={<Image className="h-5 w-5" />}>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            To use OCR functionality, you'll need an API key from one of these providers:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                Tesseract.js
                <a 
                  href="https://tesseract.projectnaptha.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink size={14} />
                </a>
              </h4>
              <div className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>• Free and open source</p>
                <p>• No API key required</p>
                <p>• Client-side processing</p>
                <p>• Good for basic OCR needs</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                OCR.Space
                <a 
                  href="https://ocr.space/ocrapi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink size={14} />
                </a>
              </h4>
              <div className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>• Free tier available</p>
                <p>• Cloud-based processing</p>
                <p>• Better accuracy</p>
                <p>• API key required</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-200">How to get an API key:</h4>
            <ol className="mt-2 space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li>1. Visit <a href="https://ocr.space/ocrapi" target="_blank" rel="noopener noreferrer" className="underline">OCR.Space</a> and sign up for a free account</li>
              <li>2. Complete the registration process</li>
              <li>3. Navigate to the API Keys section</li>
              <li>4. Copy your API key and paste it below</li>
            </ol>
          </div>
        </div>
      </Card>

      <Card title="OCR Configuration" icon={<Image className="h-5 w-5" />} className="mt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">API Key</label>
              <input
                type="password"
                value={config.api_key}
                onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                placeholder="Enter your OCR API key"
              />
              <p className="mt-1 text-sm text-gray-500">Leave empty to use Tesseract.js</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
              <select
                value={config.language}
                onChange={(e) => setConfig({ ...config, language: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
              >
                <option value="eng">English</option>
                <option value="spa">Spanish</option>
                <option value="fra">French</option>
                <option value="deu">German</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confidence Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={config.confidence_threshold}
                onChange={(e) => setConfig({ ...config, confidence_threshold: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
              />
              <p className="mt-1 text-sm text-gray-500">Minimum confidence level for OCR results</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Max File Size (MB)
              </label>
              <input
                type="number"
                min="1"
                value={config.max_file_size / 1048576}
                onChange={(e) => setConfig({ ...config, max_file_size: parseInt(e.target.value) * 1048576 })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Allowed File Types
            </label>
            <div className="space-y-2">
              {['image/jpeg', 'image/png', 'image/webp'].map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.allowed_types.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setConfig({
                          ...config,
                          allowed_types: [...config.allowed_types, type]
                        });
                      } else {
                        setConfig({
                          ...config,
                          allowed_types: config.allowed_types.filter(t => t !== type)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    {type.split('/')[1].toUpperCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
              icon={isSaving ? <RefreshCw className="animate-spin" /> : <Save size={16} />}
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">OCR Processing Tips</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white">Best Practices</h4>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Use high-resolution images</li>
                <li>• Ensure good lighting</li>
                <li>• Keep receipts flat and wrinkle-free</li>
                <li>• Avoid blurry or skewed images</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white">Supported Features</h4>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Multiple language support</li>
                <li>• Automatic text detection</li>
                <li>• Receipt amount extraction</li>
                <li>• Date recognition</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OcrSettings;