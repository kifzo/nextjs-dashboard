import { Inter, Lusitana } from 'next/font/google';

export const inter = Inter({ subsets: ['latin'] });

export const lusitana = Lusitana({
  weight: ['400', '700'],  // 異なるフォントウェイト指定。 たとえば、(通常) と(太字)
  subsets: ['latin'],
});
