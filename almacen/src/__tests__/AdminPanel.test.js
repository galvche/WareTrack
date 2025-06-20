import { render, screen } from '@testing-library/react';
import AdminPanel from '../components/AdminPanel';

test('renderiza el panel de administración', () => {
  render(<AdminPanel objetos={[]} backendLogs={[]} frontendLogs={[]} setFrontendLogs={() => {}} />);
  expect(screen.getByText(/panel/i)).toBeInTheDocument();
});
