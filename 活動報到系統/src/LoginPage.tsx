import { useState } from 'react';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'test01' && password === 'a1234567') {
      setError('');
      onLogin();
    } else {
      setError('帳號或密碼錯誤，請重新輸入');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center font-sans">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-3xl shadow-sm border">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#5A5A40]">【2026 世界腎臟日健走】</h1>
          <p className="text-gray-500 mt-2">報到系統登入</p>
        </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="請輸入帳號"
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl focus:border-[#5A5A40] focus:outline-none transition-all text-center"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl focus:border-[#5A5A40] focus:outline-none transition-all text-center"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-[#5A5A40] text-white rounded-2xl font-bold hover:bg-[#4a4a30] transition-colors"
          >
            登入
          </button>
        </form>
      </div>
    </div>
  );
}
