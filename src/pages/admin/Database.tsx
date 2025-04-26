import React, { useState, useEffect } from 'react';
import { Database, Copy, RefreshCw, Play, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { generateTestData, cleanupTestData } from '../../lib/testData';
import toast from 'react-hot-toast';
import { isAdmin } from '../../lib/admin';
import { useNavigate } from 'react-router-dom';

const DatabasePage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreatingTables, setIsCreatingTables] = useState(false);
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  const [isCleaningData, setIsCleaningData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbConfig, setDbConfig] = useState({
    host: 'db.supabase.co',
    port: '5432',
    database: 'postgres',
    schema: 'public'
  });

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

      setIsLoading(false);
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast.error('Error verifying admin access');
      navigate('/');
    }
  };

  const createRequiredTables = async () => {
    setIsCreatingTables(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const isUserAdmin = await isAdmin(session.user.id);
      if (!isUserAdmin) {
        throw new Error('Not authorized');
      }

      // Create transactions table
      const { error: transactionsError } = await supabase.rpc('create_transactions_table');
      if (transactionsError) throw transactionsError;

      // Create credit cards table
      const { error: creditCardsError } = await supabase.rpc('create_credit_cards_table');
      if (creditCardsError) throw creditCardsError;

      // Enable RLS and create policies
      const { error: rlsError } = await supabase.rpc('setup_rls_policies');
      if (rlsError) throw rlsError;

      toast.success('Database tables created successfully');
    } catch (error: any) {
      console.error('Error creating tables:', error);
      toast.error(error.message || 'Failed to create database tables');
    } finally {
      setIsCreatingTables(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleConfigUpdate = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const isUserAdmin = await isAdmin(session.user.id);
      if (!isUserAdmin) {
        throw new Error('Not authorized');
      }

      const { error } = await supabase.rpc('update_db_config', {
        new_config: dbConfig
      });

      if (error) throw error;
      toast.success('Database configuration updated');
    } catch (error: any) {
      console.error('Error updating config:', error);
      toast.error(error.message || 'Failed to update configuration');
    }
  };

  const handleGenerateTestData = async () => {
    setIsGeneratingData(true);
    try {
      const { error } = await generateTestData();
      if (error) throw error;
      toast.success('Test data generated successfully');
    } catch (error: any) {
      console.error('Error generating test data:', error);
      toast.error(error.message || 'Failed to generate test data');
    } finally {
      setIsGeneratingData(false);
    }
  };

  const handleCleanupTestData = async () => {
    if (!confirm('Are you sure you want to delete all test data? This action cannot be undone.')) {
      return;
    }
    
    setIsCleaningData(true);
    try {
      const { error } = await cleanupTestData();
      if (error) throw error;
      toast.success('Test data cleaned up successfully');
    } catch (error: any) {
      console.error('Error cleaning up test data:', error);
      toast.error(error.message || 'Failed to clean up test data');
    } finally {
      setIsCleaningData(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
    </div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Database Management</h1>
        <p className="text-gray-600">Configure and manage database settings</p>
      </div>

      <div className="grid gap-6">
        <Card title="Connection Information" icon={<Database className="h-5 w-5" />}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
              <input
                type="text"
                value={dbConfig.host}
                onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
              <input
                type="text"
                value={dbConfig.port}
                onChange={(e) => setDbConfig({ ...dbConfig, port: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Database</label>
              <input
                type="text"
                value={dbConfig.database}
                onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schema</label>
              <input
                type="text"
                value={dbConfig.schema}
                onChange={(e) => setDbConfig({ ...dbConfig, schema: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setDbConfig({
                host: 'db.supabase.co',
                port: '5432',
                database: 'postgres',
                schema: 'public'
              })}
            >
              Reset
            </Button>
            <Button variant="primary" onClick={handleConfigUpdate}>
              Save Configuration
            </Button>
          </div>
        </Card>

        <Card title="Database Setup" icon={<Play className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Create Required Tables</h3>
                <p className="text-sm text-gray-500">Initialize database with required tables and security policies</p>
              </div>
              <Button
                variant="primary"
                onClick={createRequiredTables}
                disabled={isCreatingTables}
                icon={isCreatingTables ? <RefreshCw className="animate-spin" /> : undefined}
              >
                {isCreatingTables ? 'Creating Tables...' : 'Create Tables'}
              </Button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Required Tables</h4>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                <li>transactions - Store financial transactions</li>
                <li>credit_cards - Store credit card information</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Security Features</h4>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                <li>Row Level Security (RLS) enabled on all tables</li>
                <li>User-specific data isolation</li>
                <li>Secure authentication policies</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card title="Test Data" icon={<Database className="h-5 w-5" />}>
          <div className="space-y-4">
            <p className="text-gray-600">
              Generate or clean up test data for development and testing purposes.
            </p>
            
            <div className="flex space-x-4">
              <Button
                variant="primary"
                onClick={handleGenerateTestData}
                disabled={isGeneratingData}
                icon={isGeneratingData ? <RefreshCw className="animate-spin" /> : undefined}
              >
                {isGeneratingData ? 'Generating...' : 'Generate Test Data'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleCleanupTestData}
                disabled={isCleaningData}
                icon={<Trash2 size={16} />}
                className="text-red-600 hover:text-red-700"
              >
                {isCleaningData ? 'Cleaning...' : 'Clean Up Test Data'}
              </Button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Test Data Includes:</h4>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                <li>100 random transactions</li>
                <li>Mix of different merchants and categories</li>
                <li>Random dates within the last year</li>
                <li>Mix of expenses and refunds</li>
                <li>Some recurring transactions</li>
                <li>Various payment methods</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card title="SQL Schema" icon={<Database className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-900">Transactions Table</h3>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Copy size={14} />}
                  onClick={() => handleCopy(transactionsTableSQL)}
                >
                  Copy
                </Button>
              </div>
              <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-x-auto">
                <code className="text-sm">{transactionsTableSQL}</code>
              </pre>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-900">Credit Cards Table</h3>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Copy size={14} />}
                  onClick={() => handleCopy(creditCardsTableSQL)}
                >
                  Copy
                </Button>
              </div>
              <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-x-auto">
                <code className="text-sm">{creditCardsTableSQL}</code>
              </pre>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-900">Security Policies</h3>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Copy size={14} />}
                  onClick={() => handleCopy(securityPoliciesSQL)}
                >
                  Copy
                </Button>
              </div>
              <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-x-auto">
                <code className="text-sm">{securityPoliciesSQL}</code>
              </pre>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const transactionsTableSQL = `CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userid uuid NOT NULL REFERENCES auth.users(id),
  date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL,
  credit_card_id uuid REFERENCES credit_cards(id),
  learned_category text,
  merchant text GENERATED ALWAYS AS (
    CASE 
      WHEN position(' - ' in description) > 0 
      THEN split_part(description, ' - ', 1)
      ELSE description
    END
  ) STORED,
  is_recurring boolean DEFAULT false,
  createdat timestamptz DEFAULT now()
);`;

const creditCardsTableSQL = `CREATE TABLE IF NOT EXISTS credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userid uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  last_four text,
  created_at timestamptz DEFAULT now()
);`;

const securityPoliciesSQL = `-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

-- Transactions policies
CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = userid);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = userid)
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = userid);

-- Credit cards policies
CREATE POLICY "Users can read own credit cards"
  ON credit_cards FOR SELECT
  TO authenticated
  USING (auth.uid() = userid);

CREATE POLICY "Users can insert own credit cards"
  ON credit_cards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can update own credit cards"
  ON credit_cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = userid)
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can delete own credit cards"
  ON credit_cards FOR DELETE
  TO authenticated
  USING (auth.uid() = userid);`;

export default DatabasePage;