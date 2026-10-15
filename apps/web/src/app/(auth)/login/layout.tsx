import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Service Booking',
  description: 'Sign in to your Service Booking account.',
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
