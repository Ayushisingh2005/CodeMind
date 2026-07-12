import './globals.css';

export const metadata = {
  title: 'CodeMind — Chat With Your Codebase',
  description: 'Ask any GitHub repo a question and get a sourced answer, powered by AI-native code search.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
