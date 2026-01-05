import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, UserCircleIcon, CubeIcon, BellIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
}

export default function ClientOnboarding() {
  const { org } = useParams<{ org: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [profileCompleted, setProfileCompleted] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('full_name, phone, department, location, preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const hasProfile = !!(userData.full_name && userData.phone && userData.department);
      setProfileCompleted(hasProfile);

      const onboardingSteps: OnboardingStep[] = [
        {
          id: 'profile',
          title: 'Complete Your Profile',
          description: 'Add your personal information and preferences',
          icon: UserCircleIcon,
          completed: hasProfile
        },
        {
          id: 'first-asset',
          title: 'Check Out Your First Asset',
          description: 'Try checking out an available asset',
          icon: CubeIcon,
          completed: false // We'll check this from checkouts
        },
        {
          id: 'notifications',
          title: 'Set Up Notifications',
          description: 'Configure how you want to be notified',
          icon: BellIcon,
          completed: userData.preferences?.email_notifications ?? false
        }
      ];

      // Check if user has any checkouts
      const { data: checkouts } = await supabase
        .from('checkouts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (checkouts && checkouts.length > 0) {
        onboardingSteps[1].completed = true;
      }

      setSteps(onboardingSteps);
      setLoading(false);

      // If all steps completed, redirect to dashboard
      if (onboardingSteps.every(step => step.completed)) {
        navigate(`/${org}/dashboard`);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setLoading(false);
    }
  };

  const handleStepClick = (stepId: string) => {
    switch (stepId) {
      case 'profile':
        navigate(`/${org}/profile`);
        break;
      case 'first-asset':
        navigate(`/${org}/assets`);
        break;
      case 'notifications':
        navigate(`/${org}/profile`);
        break;
      default:
        break;
    }
  };

  const handleSkipOnboarding = () => {
    navigate(`/${org}/dashboard`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  const completedSteps = steps.filter(step => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Asset Tracker!
          </h1>
          <p className="text-lg text-gray-600">
            Let's get you set up with a few quick steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Setup Progress</span>
            <span className="text-sm text-gray-500">{completedSteps} of {steps.length} completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Onboarding Steps */}
        <div className="space-y-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`bg-white rounded-lg shadow p-6 border-2 transition-all cursor-pointer ${
                step.completed 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
              }`}
              onClick={() => handleStepClick(step.id)}
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  step.completed ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {step.completed ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  ) : (
                    <step.icon className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className={`text-lg font-medium ${
                    step.completed ? 'text-green-900' : 'text-gray-900'
                  }`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    step.completed ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    {step.description}
                  </p>
                </div>
                {step.completed && (
                  <div className="ml-4">
                    <span className="text-sm font-medium text-green-600">✓ Completed</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Skip Option */}
        <div className="text-center mt-8">
          <button
            onClick={handleSkipOnboarding}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Skip onboarding and go to dashboard
          </button>
        </div>

        {/* Quick Tips */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Quick Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Use NFC to quickly scan and check out assets</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Set up notifications to get reminded about due dates</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Check your profile to update personal information</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Contact your administrator if you need help</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}