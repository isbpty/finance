import React, { useState, useEffect } from 'react';
import { Table, Download, Save, Plus, Trash2, AlertCircle, Check, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { HeaderMapping, systemFields, saveHeaderMappings, loadHeaderMappings } from '../lib/headerMappings';
import toast from 'react-hot-toast';

const ExcelSchema: React.FC = () => {
  const [headerMappings, setHeaderMappings] = useState<HeaderMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    try {
      const mappings = await loadHeaderMappings();
      setHeaderMappings(mappings);
    } catch (error) {
      console.error('Error loading mappings:', error);
      toast.error('Failed to load header mappings');
    } finally {
      setIsLoading(false);
    }
  };

  const validateMappings = () => {
    const newErrors: Record<string, string> = {};
    const usedFields = new Set<string>();

    headerMappings.forEach((mapping, index) => {
      if (!mapping.excelHeader) {
        newErrors[`${mapping.id}-header`] = 'Excel header is required';
      }
      if (!mapping.systemField) {
        newErrors[`${mapping.id}-field`] = 'System field is required';
      } else if (usedFields.has(mapping.systemField)) {
        newErrors[`${mapping.id}-field`] = 'This system field is already mapped';
      } else {
        usedFields.add(mapping.systemField);
      }
    });

    // Check required system fields
    const requiredFields = ['date', 'description', 'amount'];
    requiredFields.forEach(field => {
      if (!headerMappings.some(m => m.systemField === field)) {
        newErrors['general'] = 'Date, Description, and Amount fields are required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addMapping = () => {
    const newId = String(Date.now());
    setHeaderMappings([
      ...headerMappings,
      { id: newId, excelHeader: '', systemField: '', isRequired: false }
    ]);
  };

  const removeMapping = (id: string) => {
    setHeaderMappings(headerMappings.filter(mapping => mapping.id !== id));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${id}-header`];
      delete newErrors[`${id}-field`];
      return newErrors;
    });
  };

  const updateMapping = (id: string, field: keyof HeaderMapping, value: string | boolean) => {
    setHeaderMappings(headerMappings.map(mapping => 
      mapping.id === id ? { ...mapping, [field]: value } : mapping
    ));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${id}-${field}`];
      delete newErrors['general'];
      return newErrors;
    });
  };

  const handleSave = async () => {
    if (!validateMappings()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await saveHeaderMappings(headerMappings);
      if (error) throw error;
      toast.success('Header mappings saved successfully');
    } catch (error) {
      console.error('Error saving mappings:', error);
      toast.error('Failed to save header mappings');
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
        <h1 className="text-2xl font-bold text-gray-900">Excel Template Format</h1>
        <p className="text-gray-600">Configure how Excel headers map to system fields</p>
      </div>

      <div className="grid gap-6">
        <Card title="Header Mappings" icon={<Table className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Map your Excel headers to the corresponding system fields
              </p>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addMapping}
                  icon={<Plus size={14} />}
                >
                  Add Mapping
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  icon={isSaving ? <div className="animate-spin">⌛</div> : <Save size={14} />}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Mappings'}
                </Button>
              </div>
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
                <AlertCircle size={16} className="mr-2" />
                {errors.general}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Excel Header
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      System Field
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Required
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Format
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {headerMappings.map((mapping) => {
                    const selectedField = systemFields.find(f => f.value === mapping.systemField);
                    return (
                      <tr key={mapping.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={mapping.excelHeader}
                              onChange={(e) => updateMapping(mapping.id, 'excelHeader', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors[`${mapping.id}-header`] ? 'border-red-300' : 'border-gray-300'
                              }`}
                              placeholder="Excel column header"
                            />
                            {errors[`${mapping.id}-header`] && (
                              <p className="text-sm text-red-600">{errors[`${mapping.id}-header`]}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <select
                              value={mapping.systemField}
                              onChange={(e) => updateMapping(mapping.id, 'systemField', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors[`${mapping.id}-field`] ? 'border-red-300' : 'border-gray-300'
                              }`}
                            >
                              <option value="">Select field</option>
                              {systemFields.map((field) => (
                                <option key={field.value} value={field.value}>
                                  {field.label}
                                </option>
                              ))}
                            </select>
                            {errors[`${mapping.id}-field`] && (
                              <p className="text-sm text-red-600">{errors[`${mapping.id}-field`]}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {mapping.isRequired ? (
                              <Check size={16} className="text-green-500" />
                            ) : (
                              <X size={16} className="text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {selectedField?.format || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeMapping(mapping.id)}
                            icon={<Trash2 size={14} />}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        <Card title="Download Template" icon={<Download className="h-5 w-5" />}>
          <p className="text-gray-600 mb-4">
            Download our Excel template to ensure your data is formatted correctly.
          </p>
          <a 
            href="https://docs.google.com/spreadsheets/d/1-0X-QxbFm_D9kukLbus4gy4WvqMcOyqh/edit?usp=sharing&ouid=100891042656582574661&rtpof=true&sd=true"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <Download size={16} className="mr-2" />
            Download Excel Template
          </a>
        </Card>

        <Card title="System Fields Reference" icon={<Table className="h-5 w-5" />}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Example
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {systemFields.map((field) => (
                  <tr key={field.value}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {field.label}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {field.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {field.format}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {field.example}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ExcelSchema;