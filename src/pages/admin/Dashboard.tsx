import React from 'react';
import { Users, Database, FileText, BookOpen, Settings } from 'lucide-react';
import Card from '../../components/ui/Card';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const modules = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      link: '/admin/users'
    },
    {
      title: 'Database Management',
      description: 'View and manage database configuration',
      icon: Database,
      link: '/admin/database'
    },
    {
      title: 'Excel Schema',
      description: 'Configure import/export templates',
      icon: FileText,
      link: '/admin/schema'
    },
    {
      title: 'Documentation',
      description: 'System documentation and guides',
      icon: BookOpen,
      link: '/admin/docs'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings',
      icon: Settings,
      link: '/admin/settings'
    }
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">System administration and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.link} to={module.link}>
              <Card className="h-full transition-all hover:shadow-md">
                <div className="flex items-start">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{module.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{module.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        <Card title="System Status">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-green-600 text-sm font-medium">System Status</div>
              <div className="mt-1 text-2xl font-semibold">Operational</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-blue-600 text-sm font-medium">Active Users</div>
              <div className="mt-1 text-2xl font-semibold">0</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-purple-600 text-sm font-medium">Database Size</div>
              <div className="mt-1 text-2xl font-semibold">0 MB</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;