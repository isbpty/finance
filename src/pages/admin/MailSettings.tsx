import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Save, Send } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { isAdmin } from '../../lib/admin';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface MailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  from_email: string;
  from_name: string;
  encryption: 'none' | 'tls' | 'ssl';
}

const defaultConfig: MailConfig = {
  smtp_host: '',
  smtp_port: 587,
  smtp_user: '',
  smtp_pass: '',
  from_email: '',
  from_name: '',
  encryption: 'tls'
};

const MailSettings: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<MailConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

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
        .eq('key', 'mail_config')
        .maybeSingle();

      if (error) throw error;
      
      if (data?.value) {
        setConfig(data.value);
      } else {
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error('Error loading mail config:', error);
      toast.error('Failed to load mail configuration');
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
          key: 'mail_config',
          value: config,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key',
        });

      if (error) throw error;
      toast.success('Mail configuration saved successfully');
    } catch (error) {
      console.error('Error saving mail config:', error);
      toast.error('Failed to save mail configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const validateConfig = () => {
    const requiredFields = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass'];
    const missingFields = requiredFields.filter(field => !config[field as keyof MailConfig]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate port number
    if (typeof config.smtp_port !== 'number' || config.smtp_port <= 0 || config.smtp_port > 65535) {
      throw new Error('Invalid SMTP port number');
    }

    // Basic hostname validation
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-._]*\.[a-zA-Z]{2,}$/.test(config.smtp_host)) {
      throw new Error('Invalid SMTP hostname format');
    }
  };

  const handleTestEmail = async () => {
    setIsTesting(true);
    setTestError(null);
    try {
      // Validate configuration before sending
      validateConfig();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(data?.message || 'Test email sent successfully');
      
      if (data?.details) {
        console.log('Test email details:', data.details);
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      const errorMessage = error.message || 'Failed to send test email';
      setTestError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsTesting(false);
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mail Server Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure email server settings for system notifications</p>
      </div>

      <Card title="SMTP Configuration" icon={<Mail className="h-5 w-5" />}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SMTP Host</label>
              <input
                type="text"
                value={config.smtp_host}
                onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
                placeholder="smtp.example.com"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SMTP Port</label>
              <input
                type="number"
                value={config.smtp_port}
                onChange={(e) => setConfig({ ...config, smtp_port: parseInt(e.target.value) })}
                placeholder="587"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Encryption</label>
              <select
                value={config.encryption}
                onChange={(e) => setConfig({ ...config, encryption: e.target.value as 'none' | 'tls' | 'ssl' })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
              >
                <option value="none">None</option>
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SMTP Username</label>
              <input
                type="text"
                value={config.smtp_user}
                onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })}
                placeholder="username@example.com"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SMTP Password</label>
              <input
                type="password"
                value={config.smtp_pass}
                onChange={(e) => setConfig({ ...config, smtp_pass: e.target.value })}
                placeholder="••••••••"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">From Email</label>
              <input
                type="email"
                value={config.from_email}
                onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
                placeholder="noreply@example.com"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">From Name</label>
              <input
                type="text"
                value={config.from_name}
                onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
                placeholder="System Notifications"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
              />
            </div>
          </div>

          {testError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{testError}</p>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={handleTestEmail}
              disabled={isTesting}
              icon={isTesting ? <RefreshCw className="animate-spin" /> : <Send size={16} />}
            >
              {isTesting ? 'Sending...' : 'Send Test Email'}
            </Button>

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
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Common SMTP Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white">Gmail</h4>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Host: smtp.gmail.com</li>
                <li>Port: 587</li>
                <li>Encryption: TLS</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white">Outlook/Office 365</h4>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Host: smtp.office365.com</li>
                <li>Port: 587</li>
                <li>Encryption: TLS</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white">Amazon SES</h4>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Host: email-smtp.region.amazonaws.com</li>
                <li>Port: 587</li>
                <li>Encryption: TLS</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MailSettings;