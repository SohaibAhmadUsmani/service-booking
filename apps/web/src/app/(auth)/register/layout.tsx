import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | Service Booking',
  description: 'Create your Service Booking account.',
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
