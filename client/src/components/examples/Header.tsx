import { Header } from '../Header';
import { ThemeProvider } from '../ThemeProvider';

export default function HeaderExample() {
  return (
    <ThemeProvider>
      <Header userRole="creator" onSearch={(q) => console.log('Search:', q)} />
    </ThemeProvider>
  );
}
