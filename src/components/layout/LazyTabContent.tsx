import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load heavy components
const LeadManager = lazy(() => import('@/components/LeadManager'));
const CustomerManager = lazy(() => import('@/components/CustomerManager'));
const ProjectManager = lazy(() => import('@/components/ProjectManager'));
const TeamManager = lazy(() => import('@/components/TeamManager'));
const VendorManager = lazy(() => import('@/components/VendorManager'));
const PermitManager = lazy(() => import('@/components/permits/PermitManager'));
const ReportsManager = lazy(() => import('@/components/ReportsManager'));
const EstimatorDashboard = lazy(() => import('@/components/pricing/EstimatorDashboard').then(module => ({ default: module.EstimatorDashboard })));
const FAQManagement = lazy(() => import('@/components/admin/FAQManagement').then(module => ({ default: module.FAQManagement })));
const BulletinBoard = lazy(() => import('@/components/BulletinBoard').then(module => ({ default: module.BulletinBoard })));

interface LazyTabContentProps {
  component: string;
}

export function LazyTabContent({ component }: LazyTabContentProps) {
  const renderComponent = () => {
    switch (component) {
      case 'leads':
        return <LeadManager />;
      case 'customers':
        return <CustomerManager />;
      case 'projects':
        return <ProjectManager />;
      case 'team':
        return <TeamManager />;
      case 'vendors':
        return <VendorManager />;
      case 'permits':
        return <PermitManager />;
      case 'reports':
        return <ReportsManager />;
      case 'pricing':
        return <EstimatorDashboard />;
      case 'faq':
        return <FAQManagement />;
      case 'bulletin':
        return <BulletinBoard />;
      default:
        return <div>Component not found</div>;
    }
  };

  return (
    <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." />}>
      {renderComponent()}
    </Suspense>
  );
}