import './globals.css';

export const metadata = {
  title: 'CodeMind — Chat With Your Codebase',
  description: 'AI-powered semantic search and Q&A over your GitHub repository',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
