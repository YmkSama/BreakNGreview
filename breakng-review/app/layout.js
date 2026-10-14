import './globals.css';

export const metadata = {
  title: 'BreakNG Tables — Production Review',
  description: 'Timestamped video review for the BreakNG Tables production team',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
