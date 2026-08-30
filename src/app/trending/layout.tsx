import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trending',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
