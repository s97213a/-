/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { registrants, Registrant } from './data';
import { Download, Search, UserCheck } from 'lucide-react';
import * as XLSX from 'xlsx';

interface CheckedInRegistrant extends Registrant {
  checkInTime: Date;
}

export default function App() {
  const [phone, setPhone] = useState('');
  const [searchResult, setSearchResult] = useState<Registrant | null | undefined>(
    undefined
  );


  const [checkedInSearch, setCheckedInSearch] = useState('');
  const [checkedIn, setCheckedIn] = useState<CheckedInRegistrant[]>([]);

  const handleSearch = () => {
    const found = registrants.find((r) => r.phone === phone);
    setSearchResult(found || null);
  };

    const handleCheckIn = (clearAfterCheckIn = true) => {
    if (searchResult) {
      // Prevent double check-ins
      if (checkedIn.some((r) => r.id === searchResult.id)) {
        alert('此民眾已報到！');
        return;
      }
      const now = new Date();
      setCheckedIn([...checkedIn, { ...searchResult, checkInTime: now }]);
      if (clearAfterCheckIn) {
        setSearchResult(undefined);
        setPhone('');
      }
    }
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

    XLSX.writeFile(wb, '報到名單.xlsx');
  };

      



  const isCheckedIn = (registrant: Registrant | null | undefined) => {
    if (!registrant) return false;
    return checkedIn.some((r) => r.id === registrant.id);
  };

  const filteredCheckedIn = checkedIn.filter(
    (r) =>
      r.name.toLowerCase().includes(checkedInSearch.toLowerCase()) ||
      r.phone.includes(checkedInSearch) ||
      r.id.toLowerCase().includes(checkedInSearch.toLowerCase())
  );

  return (
                <div className="min-h-screen font-serif text-[#1a1a1a] bg-[#f5f5f0]">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <header className="text-center py-12">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#5A5A40]">🌸 2026 世界腎臟日健走 🌸</h1>
        <p className="text-lg mt-2 text-gray-600">開春護腎迎健康</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 p-4 sm:p-8 max-w-7xl mx-auto">
        {/* Left Side: Check-in Area */}
        <div className="w-full lg:w-1/3
        lg:sticky lg:top-8 self-start">

                                                                              <main className="bg-white rounded-3xl p-6 sm:p-8">
          <div className="search-section mb-6">
            <h2 className="text-2xl font-semibold mb-4">報到櫃檯</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="請輸入手機號碼"
                className="flex-grow px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5A5A40] transition"
              />
              <button
                onClick={handleSearch}
                className="bg-[#5A5A40] text-white px-6 py-3 rounded-full hover:bg-[#4a4a30] transition-colors duration-300 flex items-center justify-center gap-2"
              >
                <Search size={20} />
                <span className="whitespace-nowrap">查詢</span>
              </button>
            </div>
          </div>

          <div className="result-section min-h-[150px]">
            {searchResult === undefined && (
              <div className="text-center text-gray-500 pt-8">
                請輸入手機號碼查詢報名狀況。
              </div>
            )}
                        {searchResult === null && (
              <div className="text-center text-red-500 font-bold pt-8">
                查無此人，請確認手機號碼是否正確。
              </div>
            )}
            {searchResult && (
              <div className="bg-[#f5f5f0] rounded-2xl p-6 text-center animate-fade-in">
                <p className="text-lg"><strong>姓名：</strong> {searchResult.name}</p>
                <p className="text-lg mt-2"><strong>身分證號：</strong> {searchResult.id}</p>
                <div className="mt-6">
                  {isCheckedIn(searchResult) ? (
                    <p className="text-green-600 font-bold text-xl">✓ 已報到</p>
                  ) : (
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                      <button 
                        onClick={() => handleCheckIn(true)}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-full hover:bg-emerald-700 transition-colors duration-300 flex items-center justify-center gap-2"
                      >
                        <UserCheck size={20} />
                        <span>確認報到</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
        </div>

        {/* Right Side: Checked-in List */}
        <div className="w-full lg:sticky lg:top-8 self-start">
                                                                                                                                                                <aside className="bg-white rounded-3xl">
            <div className="p-6 sm:p-8">
                            <h2 className="text-xl font-semibold mb-4">已報到名單 ({checkedIn.length} 人)</h2>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="搜尋已報到名單..."
                  value={checkedInSearch}
                  onChange={(e) => setCheckedInSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5A5A40] transition"
                />
              </div>
              <div className="max-h-[60vh] overflow-y-auto pr-2 border-t pt-4">
                  <ul>
                      {filteredCheckedIn.length > 0 ? filteredCheckedIn.map((r) => (
                          <li key={r.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                              <span>{r.name}</span>
                              <span className="text-sm text-gray-500">{r.checkInTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</span>
                          </li>
                      )) : <li className='text-center text-gray-500 py-4'>尚無報到記錄</li>}
                  </ul>
              </div>
              <div className="w-full">
                  <button 
                      onClick={handleExport}
                      className="bg-gray-700 text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors duration-300 flex items-center justify-center gap-2 mx-auto"
                  >
                      <Download size={20} />
                      <span>匯出報到名單 (Excel)</span>
                  </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
