import './links.css';
import { Space_Grotesk, Poppins, Fraunces } from 'next/font/google';

const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--f-grotesk', display: 'swap' });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '600', '800'], variable: '--f-poppins', display: 'swap' });
const serif = Fraunces({ subsets: ['latin'], variable: '--f-serif', display: 'swap' });

export const metadata = {
  title: 'Links',
  description: 'All our links in one place.',
};

export default function LinksLayout({ children }) {
  return (
    <div className={`lh ${grotesk.variable} ${poppins.variable} ${serif.variable}`}>
      {children}
    </div>
  );
}
