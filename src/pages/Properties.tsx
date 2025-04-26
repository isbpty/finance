import React, { useState, useEffect } from 'react';
import { User, CreditCard, Tag, Mail, Lock, Save, RefreshCw } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import useStore from '../store';
import CategoryModal from '../components/CategoryModal';
import CreditCardModal from '../components/CreditCardModal';
import { CreditCard as CreditCardType } from '../types';
import { getCreditCards, createCreditCard, deleteCreditCard } from '../lib/api';
import toast from 'react-hot-toast';

const Properties: React.FC = () => {
  const { userid } = useStore();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCreditCardModalOpen, setIsCreditCardModalOpen] = useState(false);
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    address: ''
  });
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (userid) {
      loadUserData();
    }
  }, [userid]);

  const loadUserData = async () => {
    try {
      // Load credit cards
      const { data: cardsData } = await getCreditCards(userid);
      if (cardsData) {
        setCreditCards(cardsData);
      }

      // Load user email and profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentEmail(user.email);
      }

      // Load profile data
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userid)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist yet, create one with default values
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: userid,
              full_name: '',
              phone: '',
              address: '',
            })
            .select()
            .single();

          if (insertError) throw insertError;

          if (newProfile) {
            setProfileId(newProfile.id);
            setProfile({
              full_name: '',
              phone: '',
              address: ''
            });
          }
        } else {
          throw error;
        }
      } else if (profileData) {
        // Profile exists, use its data
        setProfileId(profileData.id);
        setProfile({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          address: profileData.address || ''
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileId) {
      toast.error('Profile ID not found');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...profile,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail) {
      toast.error('Please enter a new email address');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      
      if (error) throw error;

      toast.success('Email update request sent. Please check your inbox.');
      setNewEmail('');
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error('Failed to update email');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;

      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCreditCard = async (creditCard: Omit<CreditCardType, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await createCreditCard({
        ...creditCard,
        userid,
      });

      if (error) throw error;

      if (data) {
        setCreditCards([...creditCards, data[0]]);
        setIsCreditCardModalOpen(false);
        toast.success('Credit card added successfully');
      }
    } catch (error) {
      console.error('Error saving credit card:', error);
      toast.error('Failed to save credit card');
    }
  };

  const handleDeleteCreditCard = async (id: string) => {
    if (confirm('Are you sure you want to delete this credit card?')) {
      try {
        const { error } = await deleteCreditCard(id);
        
        if (error) throw error;

        setCreditCards(creditCards.filter(card => card.id !== id));
        toast.success('Credit card deleted successfully');
      } catch (error) {
        console.error('Error deleting credit card:', error);
        toast.error('Failed to delete credit card');
      }
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
        <h1 className="text-2xl font-bold text-gray-900">Account Properties</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="space-y-6">
        <Card title="Personal Information" icon={<User className="h-5 w-5" />}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="123 Main St, City, State 12345"
              />
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleSaveProfile}
                disabled={isSaving}
                icon={isSaving ? <RefreshCw className="animate-spin" /> : <Save size={16} />}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Credit Cards" icon={<CreditCard className="h-5 w-5" />}>
          <div className="space-y-4">
            <Button 
              onClick={() => setIsCreditCardModalOpen(true)}
              variant="primary"
              icon={<CreditCard size={16} />}
            >
              Add Credit Card
            </Button>
            
            {creditCards.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Your Credit Cards</h3>
                <div className="space-y-2">
                  {creditCards.map((card) => (
                    <div 
                      key={card.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                        <span>{card.name} {card.last_four && `(${card.last_four})`}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCreditCard(card.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card title="Categories" icon={<Tag className="h-5 w-5" />}>
          <div className="space-y-4">
            <p className="text-gray-600">
              Customize transaction categories to better organize your financial data.
            </p>
            <Button 
              onClick={() => setIsCategoryModalOpen(true)}
              variant="primary"
              icon={<Tag size={16} />}
            >
              Manage Categories
            </Button>
          </div>
        </Card>

        <Card title="Email Settings" icon={<Mail className="h-5 w-5" />}>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Change Email Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700">Current Email</label>
                  <input
                    type="email"
                    value={currentEmail}
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">New Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="primary"
                  onClick={handleUpdateEmail}
                  disabled={isSaving || !newEmail}
                  icon={isSaving ? <RefreshCw className="animate-spin" /> : <Save size={16} />}
                >
                  Update Email
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Security" icon={<Lock className="h-5 w-5" />}>
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <Button
                  variant="primary"
                  onClick={handleUpdatePassword}
                  disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
                  icon={isSaving ? <RefreshCw className="animate-spin" /> : <Save size={16} />}
                >
                  Update Password
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      <CreditCardModal
        isOpen={isCreditCardModalOpen}
        onClose={() => setIsCreditCardModalOpen(false)}
        onSave={handleSaveCreditCard}
      />
    </div>
  );
};

export default Properties;