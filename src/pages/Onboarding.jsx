import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import { setOnboardingComplete, isOnboardingComplete } from '../services/storage/settingsStorage';

export default function Onboarding() {
  const navigate = useNavigate();

  useEffect(() => {
    // If onboarding is already complete, redirect to home
    if (isOnboardingComplete()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleComplete = () => {
    setOnboardingComplete();
    navigate('/', { replace: true });
  };

  return <OnboardingFlow onComplete={handleComplete} />;
}
