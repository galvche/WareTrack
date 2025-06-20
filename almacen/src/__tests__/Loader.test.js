import { render, screen } from '@testing-library/react';
import Loader from '../components/Loader';

test('renderiza el loader con el logo', () => {
  render(<Loader />);
  expect(screen.getByAltText(/logo/i)).toBeInTheDocument();
});
