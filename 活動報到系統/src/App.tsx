/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { registrants, Registrant } from './data';
import { Download, Search, UserCheck, Smartphone, CreditCard } from 'lucide-react';
import * as XLSX from 'xlsx';

interface CheckedInRegistrant extends Registrant {
  checkInTime: Date;
}

export default function App() {
  const [inputValue, setInputValue] = useState('');
  // 功能 2: 新增搜尋類型狀態 (手機末三碼 或 身分證)
  const [searchType, setSearchType] = useState<'phone' | 'id'>('phone');
  // 功能 1: 支援多筆結果 (處理末三碼重複的情況)
  const [searchResults, setSearchResults] = useState<Registrant[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [checkedInSearch, setCheckedInSearch] = useState('');
  const [checkedIn, setCheckedIn] = useState<CheckedInRegistrant[]>([]);

  // 功能 1: 核心搜尋邏輯更新
  const handleSearch = () => {
    setHasSearched(true);
    const term = inputValue.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }

    let found: Registrant[] = [];
    if (searchType === 'phone') {
      // 搜尋手機末三碼 (使用 endsWith)
      found = registrants.filter((r) => r.phone.endsWith(term));
    } else {
      // 搜尋身分證字號 (不分大小寫完全比對)
      found = registrants.filter((r) => r.id.toUpperCase() === term.toUpperCase());
    }
    setSearchResults(found);
  };

  // 功能 3: 報到後自動清除搜尋狀態
  const handleCheckIn = (person: Registrant) => {
    if (checkedIn.some((r) => r.id === person.id)) {
      alert('此民眾已報到！');
      return;
    }
    const now = new Date();
    setCheckedIn([...checkedIn, { ...person, checkInTime: now }]);
    
    // 清除狀態，準備接待下一位
    setSearchResults([]);
    setInputValue('');
    setHasSearched(false);
  };

  const handleExport = () => {
    if (checkedIn.length === 0) {
      alert('目前沒有已報到的民眾可匯出。');
      return;
    }
    const dataToExport = checkedIn.map((r) => ({
      '身分證字號': r.id,
      '姓名': r.name,
      '電話': r.phone,
      '報到時間': r.checkInTime.toLocaleString('zh-TW'),
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '報到名單');
    XLSX.writeFile(wb, '2026世界腎臟日報到名單.xlsx');
  };

  const isCheckedIn = (id: string) => checkedIn.some((r) => r.id === id);

  const filteredCheckedIn = checkedIn.filter(
    (r) =>
      r.name.toLowerCase().includes(checkedInSearch.toLowerCase()) ||
      r.phone.includes(checkedInSearch) ||
      r.id.toLowerCase().includes(checkedInSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen font-sans text-[#1a1a1a] bg-[#f5f5f0]">
      <header className="text-center py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#5A5A40]">🌸 2026 世界腎臟日健走 🌸</h1>
        <p className="text-sm mt-2 text-gray-500 tracking-widest">STAFF ONLY | 報到管理系統</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 p-4 sm:p-8 max-w-7xl mx-auto">
        {/* 左側：搜尋與報到區 */}
        <div className="w-full lg:w-5/12">
          <main className="bg-white rounded-3xl p-6 shadow-sm sticky top-8">
            <h2 className="text-xl font-bold mb-6 text-gray-700">櫃檯報到查詢</h2>
            
            {/* 功能 2: 搜尋類型切換 Tab */}
            <div className="flex mb-5 bg-gray-100 p-1 rounded-2xl">
              <button 
                onClick={() => { setSearchType('phone'); setInputValue(''); setHasSearched(false); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${searchType === 'phone' ? 'bg-white shadow-sm text-[#5A5A40] font-bold' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Smartphone size={18} /> 手機末三碼
              </button>
              <button 
                onClick={() => { setSearchType('id'); setInputValue(''); setHasSearched(false); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${searchType === 'id' ? 'bg-white shadow-sm text-[#5A5A40] font-bold' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <CreditCard size={18} /> 身分證字號
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={searchType === 'phone' ? "請輸入末三碼 (如: 098)" : "請輸入完整身分證字號"}
                  className="w-full pl-5 pr-12 py-4 border-2 border-gray-100 rounded-2xl focus:border-[#5A5A40] focus:outline-none transition-all"
                />
                <button 
                  onClick={handleSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#5A5A40] text-white rounded-xl hover:bg-[#4a4a30] transition-colors"
                >
                  <Search size={20} />
                </button>
              </div>

              {/* 搜尋結果顯示區 */}
              <div className="mt-6">
                {hasSearched && searchResults.length === 0 && (
                  <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                    <p className="text-red-400 font-medium">查無報名資料，請重新輸入</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  {searchResults.map((person) => (
                    <div key={person.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                      <div>
                        <div className="flex flex-col gap-1">
            {/* 姓名顯示 */}
            <span className="font-bold text-lg text-gray-800">{person.name}</span>
            {/* 完整身分證字號與電話 */}
            <div className="text-sm space-y-1">
              <p className="text-emerald-700 font-mono bg-emerald-50 inline-block px-2 py-0.5 rounded">
                身分證：{person.id.toUpperCase()}
              </p>
              <p className="text-gray-400">電話：{person.phone}</p>
            </div>
          </div>
        </div>
        
        {isCheckedIn(person.id) ? (
          <div className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-full">
            <UserCheck size={16} /> <span className="text-sm">已完成報到</span>
          </div>
        ) : (
          <button 
            onClick={() => handleCheckIn(person)}
            className="bg-emerald-600 text-white px-5 py-3 rounded-xl hover:bg-emerald-700 shadow-sm shadow-emerald-100 transition-transform active:scale-95 font-medium"
          >
            確認報到
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* 右側：名單彙整區 */}
        <div className="w-full lg:w-7/12">
          <aside className="bg-white rounded-3xl shadow-sm h-full flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">已報到名單</h2>
                <p className="text-sm text-gray-400">目前共計 {checkedIn.length} 人</p>
              </div>
              <button 
                onClick={handleExport}
                className="bg-gray-800 text-white px-5 py-2.5 rounded-xl hover:bg-black transition-all flex items-center gap-2 text-sm font-medium"
              >
                <Download size={18} /> 匯出 Excel
              </button>
            </div>
            
            <div className="p-6 pb-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="快速搜尋名單..."
                  value={checkedInSearch}
                  onChange={(e) => setCheckedInSearch(e.target.value)}
                  className="w-full bg-gray-50 border-none px-5 py-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none"
                />
              </div>
            </div>

            <div className="flex-grow p-6 overflow-y-auto custom-scrollbar">
              <table className="w-full">
                <thead className="text-xs text-gray-400 uppercase tracking-wider border-b">
                  <tr>
                    <th className="pb-3 text-left font-medium">姓名 / 電話</th>
                    <th className="pb-3 text-right font-medium">時間</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCheckedIn.length > 0 ? filteredCheckedIn.map((r) => (
                    <tr key={r.id} className="group">
                      <td className="py-4">
                        <p className="font-bold text-gray-700">{r.name}</p>
                        <p className="text-xs text-gray-400">{r.phone}</p>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-sm font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">
                          {r.checkInTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={2} className="py-20 text-center text-gray-300 italic">尚未有報到紀錄</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}