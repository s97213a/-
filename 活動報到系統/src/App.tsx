/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
// 移除靜態匯入: import { registrants } from './data'; 
import { Download, Search, UserCheck, Smartphone, CreditCard, Upload, Users } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Registrant {
  id: string;
  name: string;
  phone: string;
}

interface CheckedInRegistrant extends Registrant {
  checkInTime: Date;
}

export default function App() {
  // 核心數據狀態
  const [registrants, setRegistrants] = useState<Registrant[]>([]); // 原始名單
  const [checkedIn, setCheckedIn] = useState<CheckedInRegistrant[]>([]); // 已報到名單
  
  // 搜尋相關狀態
  const [inputValue, setInputValue] = useState('');
  const [searchType, setSearchType] = useState<'phone' | 'id'>('phone');
  const [searchResults, setSearchResults] = useState<Registrant[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [checkedInSearch, setCheckedInSearch] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 功能：匯入 Excel 名單
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet) as any[];

      // 轉換 Excel 欄位名稱 (對應 姓名/身分證/電話)
      const importedData: Registrant[] = json.map((row) => ({
        id: (row['身分證字號'] || row['身分證'] || row['ID'] || '').toString().trim(),
        name: (row['姓名'] || row['Name'] || '').toString().trim(),
        phone: (row['電話'] || row['手機'] || row['Phone'] || '').toString().trim(),
      })).filter(r => r.id && r.name); // 過濾掉空行

      if (importedData.length > 0) {
        setRegistrants(importedData);
        alert(`成功匯入 ${importedData.length} 筆名單！`);
      } else {
        alert('匯入失敗，請檢查 Excel 欄位名稱是否包含「姓名」、「身分證字號」、「電話」。');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSearch = () => {
    if (registrants.length === 0) {
      alert('請先匯入原始報名名單！');
      return;
    }
    setHasSearched(true);
    const term = inputValue.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }

    let found = registrants.filter((r) => 
      searchType === 'phone' 
        ? r.phone.endsWith(term) 
        : r.id.toUpperCase() === term.toUpperCase()
    );
    setSearchResults(found);
  };

  const handleCheckIn = (person: Registrant) => {
    if (checkedIn.some((r) => r.id === person.id)) {
      alert('此民眾已報到！');
      return;
    }
    setCheckedIn([...checkedIn, { ...person, checkInTime: new Date() }]);
    setSearchResults([]);
    setInputValue('');
    setHasSearched(false);
  };

  const handleExport = () => {
    if (checkedIn.length === 0) return alert('目前沒有報到資料。');
    const ws = XLSX.utils.json_to_sheet(checkedIn.map(r => ({
      '身分證字號': r.id,
      '姓名': r.name,
      '電話': r.phone,
      '報到時間': r.checkInTime.toLocaleString('zh-TW'),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '報到名單');
    XLSX.writeFile(wb, '2026世界腎臟日_實時報到名單.xlsx');
  };

  return (
    <div className="min-h-screen font-sans text-[#1a1a1a] bg-[#f5f5f0] p-4 sm:p-8">
      {/* 頂部功能列 */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#5A5A40]">🌸 2026 世界腎臟日</h1>
          <p className="text-gray-500">當前名單總數：{registrants.length} 人</p>
        </div>
        
        <div className="flex gap-3">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImport}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-white border-2 border-[#5A5A40] text-[#5A5A40] px-4 py-2 rounded-xl hover:bg-[#5A5A40] hover:text-white transition-all"
          >
            <Upload size={18} /> 匯入原始名單
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-black transition-all"
          >
            <Download size={18} /> 匯出結果
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
        {/* 左側：查詢區 */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-[#f5f5f0] rounded-lg text-[#5A5A40]"><Users size={20}/></div>
              <h2 className="text-xl font-bold text-gray-700">櫃檯報到</h2>
            </div>

            <div className="flex mb-5 bg-gray-100 p-1 rounded-2xl">
              <button onClick={() => setSearchType('phone')} className={`flex-1 py-2 rounded-xl text-sm transition-all ${searchType === 'phone' ? 'bg-white shadow-sm text-[#5A5A40] font-bold' : 'text-gray-400'}`}>手機末三碼</button>
              <button onClick={() => setSearchType('id')} className={`flex-1 py-2 rounded-xl text-sm transition-all ${searchType === 'id' ? 'bg-white shadow-sm text-[#5A5A40] font-bold' : 'text-gray-400'}`}>身分證字號</button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={searchType === 'phone' ? "輸入手機末 3 碼" : "輸入完整身分證"}
                className="flex-grow px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#5A5A40] outline-none"
              />
              <button onClick={handleSearch} className="bg-[#5A5A40] text-white p-3 rounded-2xl hover:opacity-90"><Search /></button>
            </div>

            <div className="mt-6 space-y-3">
              {hasSearched && searchResults.length === 0 && (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-2xl">未找到相符名單</div>
              )}
              {searchResults.map(person => (
                <div key={person.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">{person.name}</p>
                    <p className="text-xs font-mono text-emerald-600 mt-1 uppercase bg-emerald-50 inline-block px-1 rounded">{person.id}</p>
                    <p className="text-xs text-gray-400">{person.phone}</p>
                  </div>
                  {checkedIn.some(c => c.id === person.id) ? (
                    <span className="text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1 rounded-full">已完成</span>
                  ) : (
                    <button onClick={() => handleCheckIn(person)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700">確認報到</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右側：名單顯示 */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-gray-50">
              <h2 className="text-xl font-bold text-gray-700">已報到即時名單</h2>
              <input
                type="text"
                placeholder="搜尋已報到人員..."
                value={checkedInSearch}
                onChange={(e) => setCheckedInSearch(e.target.value)}
                className="w-full mt-4 px-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-gray-200 outline-none"
              />
            </div>
            <div className="flex-grow overflow-y-auto p-6">
              <table className="w-full">
                <thead className="text-xs text-gray-400 border-b">
                  <tr>
                    <th className="pb-3 text-left">姓名</th>
                    <th className="pb-3 text-left">身分證</th>
                    <th className="pb-3 text-right">報到時間</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {checkedIn.filter(c => c.name.includes(checkedInSearch) || c.id.includes(checkedInSearch)).map(r => (
                    <tr key={r.id}>
                      <td className="py-4 font-medium text-gray-700">{r.name}</td>
                      <td className="py-4 text-xs font-mono text-gray-400 uppercase">{r.id}</td>
                      <td className="py-4 text-right text-xs text-gray-400">{r.checkInTime.toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}