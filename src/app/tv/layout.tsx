import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TV Shows',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
