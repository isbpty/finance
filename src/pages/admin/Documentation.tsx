import React from 'react';
import { BookOpen, Server, Database, Code, Settings, FileText } from 'lucide-react';
import Card from '../../components/ui/Card';

const Documentation: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
        <p className="text-gray-600">System documentation and setup guides</p>
      </div>

      <div className="space-y-6">
        <Card title="Installation Guide" icon={<Server className="h-5 w-5" />}>
          <div className="prose max-w-none">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Prerequisites</h3>
            <ul className="list-disc pl-5 mb-4">
              <li>Node.js 18 or higher</li>
              <li>npm 8 or higher</li>
              <li>PostgreSQL 14 or higher</li>
              <li>Supabase account</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 mb-4">Installation Steps</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Clone the repository:
                <pre className="bg-gray-50 p-3 rounded-md mt-2">
                  git clone https://github.com/yourusername/financial-statement-analyzer.git
                </pre>
              </li>
              <li>Install dependencies:
                <pre className="bg-gray-50 p-3 rounded-md mt-2">
                  cd financial-statement-analyzer{'\n'}
                  npm install
                </pre>
              </li>
              <li>Create a .env file with your Supabase credentials:
                <pre className="bg-gray-50 p-3 rounded-md mt-2">
                  VITE_SUPABASE_URL=your_supabase_url{'\n'}
                  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
                </pre>
              </li>
              <li>Start the development server:
                <pre className="bg-gray-50 p-3 rounded-md mt-2">
                  npm run dev
                </pre>
              </li>
            </ol>
          </div>
        </Card>

        <Card title="Database Setup" icon={<Database className="h-5 w-5" />}>
          <div className="prose max-w-none">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Database Schema</h3>
            <p className="mb-4">The application uses the following tables:</p>

            <div className="mb-6">
              <h4 className="font-medium text-gray-900">transactions</h4>
              <pre className="bg-gray-50 p-3 rounded-md mt-2">
                {`CREATE TABLE transactions (
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
);`}
              </pre>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-900">credit_cards</h4>
              <pre className="bg-gray-50 p-3 rounded-md mt-2">
                {`CREATE TABLE credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userid uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  last_four text,
  created_at timestamptz DEFAULT now()
);`}
              </pre>
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-4">Row Level Security</h3>
            <p className="mb-4">The following policies are required:</p>

            <pre className="bg-gray-50 p-3 rounded-md mt-2">
              {`-- Enable RLS
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
  USING (auth.uid() = userid);`}
            </pre>
          </div>
        </Card>

        <Card title="Configuration" icon={<Settings className="h-5 w-5" />}>
          <div className="prose max-w-none">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Environment Variables</h3>
            <p className="mb-4">Required environment variables:</p>
            <ul className="list-disc pl-5 mb-4">
              <li><code>VITE_SUPABASE_URL</code> - Your Supabase project URL</li>
              <li><code>VITE_SUPABASE_ANON_KEY</code> - Your Supabase anonymous key</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 mb-4">Default Categories</h3>
            <p className="mb-4">The system comes with predefined transaction categories that can be customized in <code>src/lib/categories.ts</code>:</p>
            <ul className="list-disc pl-5">
              <li>Groceries</li>
              <li>Dining Out</li>
              <li>Entertainment</li>
              <li>Transportation</li>
              <li>Shopping</li>
              <li>Travel</li>
              <li>Housing</li>
              <li>Utilities</li>
              <li>Healthcare</li>
              <li>Education</li>
              <li>Gifts</li>
              <li>Services</li>
              <li>Subscriptions</li>
              <li>Other</li>
            </ul>
          </div>
        </Card>

        <Card title="Excel Import Format" icon={<FileText className="h-5 w-5" />}>
          <div className="prose max-w-none">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Required Columns</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Column</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm">Date</td>
                  <td className="px-6 py-4 text-sm">Transaction date</td>
                  <td className="px-6 py-4 text-sm">DD/MM/YYYY or MM/DD/YYYY</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm">Description</td>
                  <td className="px-6 py-4 text-sm">Transaction description</td>
                  <td className="px-6 py-4 text-sm">Text</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm">Amount</td>
                  <td className="px-6 py-4 text-sm">Transaction amount</td>
                  <td className="px-6 py-4 text-sm">Number (positive or negative)</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm">Category</td>
                  <td className="px-6 py-4 text-sm">Transaction category (optional)</td>
                  <td className="px-6 py-4 text-sm">Text (must match system categories)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="API Documentation" icon={<Code className="h-5 w-5" />}>
          <div className="prose max-w-none">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Authentication</h3>
            <p className="mb-4">All API endpoints require authentication using Supabase Auth. The system uses JWT tokens for authentication.</p>

            <h3 className="text-lg font-medium text-gray-900 mb-4">Available Endpoints</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Transactions</h4>
                <ul className="list-disc pl-5">
                  <li>GET /transactions - List transactions</li>
                  <li>POST /transactions - Create transaction</li>
                  <li>PUT /transactions/:id - Update transaction</li>
                  <li>DELETE /transactions/:id - Delete transaction</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Credit Cards</h4>
                <ul className="list-disc pl-5">
                  <li>GET /credit-cards - List credit cards</li>
                  <li>POST /credit-cards - Create credit card</li>
                  <li>PUT /credit-cards/:id - Update credit card</li>
                  <li>DELETE /credit-cards/:id - Delete credit card</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Documentation;