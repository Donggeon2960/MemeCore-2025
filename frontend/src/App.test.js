import { render, screen } from '@testing-library/react';
import App from './App';

test('비로그인 상태에서 로그인 화면이 보인다', () => {
  localStorage.clear();
  render(<App />);
  expect(screen.getByRole('heading', { name: 'MemeQuest' })).toBeInTheDocument();
  expect(screen.getByLabelText('아이디')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /지갑으로 로그인/ })).toBeInTheDocument();
});
