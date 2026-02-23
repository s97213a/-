/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react'; // 1. 引入 useEffect
import { Search, UserCheck, Smartphone, CreditCard, FileUp, FileDown, Users, Trash2, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';

// 定義資料結構
interface Registrant {
  id: string;
  name: string;
  phone: string;
}

interface CheckedInRegistrant extends Registrant {
  checkInTime: string; // 2. LocalStorage 儲存 Date 會變成字串，改為 string 比較穩
  status: '已報到' | '放棄領取';
}

export default function App() {
  // --- 狀態管理 ---
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [checkedIn, setCheckedIn] = useState<CheckedInRegistrant[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchType, setSearchType] = useState<'phone' | 'id'>('phone');
  const [searchResults, setSearchResults] = useState<Registrant[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [checkedInSearch, setCheckedInSearch] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 3. 新增 LocalStorage 功能 ---
  
  // 初始化：從 LocalStorage 讀取資料
  useEffect(() => {
    const savedRegistrants = localStorage.getItem('kidney_registrants');
    const savedCheckedIn = localStorage.getItem('kidney_checkedIn');
    
    if (savedRegistrants) setRegistrants(JSON.parse(savedRegistrants));
    if (savedCheckedIn) setCheckedIn(JSON.parse(savedCheckedIn));
  }, []);

  // 監聽：當 registrants 或 checkedIn 變動時自動儲存
  useEffect(() => {
    localStorage.setItem('kidney_registrants', JSON.stringify(registrants));
    localStorage.setItem('kidney_checkedIn', JSON.stringify(checkedIn));
  }, [registrants, checkedIn]);

  // 新增清空功能
  const handleReset = () => {
    if (window.confirm("確定要清空所有資料嗎？這將刪除目前匯入的名單與所有報到紀錄。")) {
      setRegistrants([]);
      setCheckedIn([]);
      localStorage.removeItem('kidney_registrants');
      localStorage.removeItem('kidney_checkedIn');
      setSearchResults([]);
      setHasSearched(false);
      alert("資料已清空");
    }
  };

  // --- 匯入 Excel 名單 ---
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

      const importedData: Registrant[] = json.map((row) => ({
        id: (row['身分證字號'] || row['身分證'] || row['ID'] || '').toString().trim(),
        name: (row['姓名'] || row['Name'] || '').toString().trim(),
        phone: (row['電話'] || row['手機'] || row['Phone'] || '').toString().trim(),
      })).filter(r => r.id && r.name);

      if (importedData.length > 0) {
        setRegistrants(importedData);
        alert(`成功匯入 ${importedData.length} 筆名單！`);
      } else {
        alert('匯入失敗，請檢查 Excel 欄位名稱是否正確。');
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- 搜尋邏輯 ---
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

  // --- 報到/放棄領取邏輯 ---
  const handleAction = (person: Registrant, status: '已報到' | '放棄領取') => {
    if (checkedIn.some((r) => r.id === person.id)) {
      alert('此民眾已有紀錄！');
      return;
    }
    // 儲存時間改為 ISO 字串以利傳輸與存儲
    setCheckedIn([{ ...person, checkInTime: new Date().toISOString(), status }, ...checkedIn]);
    setSearchResults([]);
    setInputValue('');
    setHasSearched(false);
  };

  // --- 刪除單筆紀錄 ---
  const removeRecord = (id: string) => {
    if (window.confirm("確定要刪除此筆紀錄嗎？")) {
      setCheckedIn(checkedIn.filter(r => r.id !== id));
    }
  };

  // --- 匯出 Excel ---
  const handleExport = () => {
    if (checkedIn.length === 0) return alert('目前沒有報到資料。');
    const ws = XLSX.utils.json_to_sheet(checkedIn.map(r => ({
      '姓名': r.name,
      '身分證字號': r.id,
      '電話': r.phone,
      '狀態': r.status,
      '紀錄時間': new Date(r.checkInTime).toLocaleString('zh-TW'),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '活動名單');
    XLSX.writeFile(wb, '2026世界腎臟日_報到紀錄.xlsx');
  };

  return (
    <div className="min-h-screen font-sans text-[#1a1a1a] bg-[#f5f5f0] p-4 sm:p-8">
      {/* 頂部功能列 */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#5A5A40]">🌸 2026 世界腎臟日</h1>
          <p className="text-gray-500">總報名：{registrants.length} | 已處理：{checkedIn.length}</p>
        </div>
        
        <div className="flex gap-3">
          {/* 清空按鈕 */}
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 bg-white border-2 border-red-200 text-red-500 px-4 py-2 rounded-xl hover:bg-red-50 transition-all"
            title="清空所有資料"
          >
            <RotateCcw size={18} /> 重置
          </button>

          <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleImport} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-white border-2 border-[#5A5A40] text-[#5A5A40] px-4 py-2 rounded-xl hover:bg-[#5A5A40] hover:text-white transition-all"
          >
            <FileUp size={18} /> 匯入名單
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-black transition-all"
          >
            <FileDown size={18} /> 匯出結果
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
        {/* 左側：查詢區 */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-8">
            <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
              <Users size={20} className="text-[#5A5A40]"/> 櫃檯報到
            </h2>

            <div className="flex mb-5 bg-gray-100 p-1 rounded-2xl">
              <button onClick={() => setSearchType('phone')} className={`flex-1 py-2 rounded-xl text-sm transition-all ${searchType === 'phone' ? 'bg-white shadow-sm text-[#5A5A40] font-bold' : 'text-gray-400'}`}>
                <Smartphone size={16} className="inline mr-1"/>手機末三碼
              </button>
              <button onClick={() => setSearchType('id')} className={`flex-1 py-2 rounded-xl text-sm transition-all ${searchType === 'id' ? 'bg-white shadow-sm text-[#5A5A40] font-bold' : 'text-gray-400'}`}>
                <CreditCard size={16} className="inline mr-1"/>身分證字號
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={searchType === 'phone' ? "輸入末三碼" : "輸入完整字號"}
                className="flex-grow px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#5A5A40] outline-none"
              />
              <button onClick={handleSearch} className="bg-[#5A5A40] text-white p-4 rounded-2xl hover:opacity-90"><Search /></button>
            </div>

            <div className="mt-6 space-y-3">
              {hasSearched && searchResults.length === 0 && (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-2xl">未找到名單</div>
              )}
              {searchResults.map(person => {
                const record = checkedIn.find(c => c.id === person.id);
                return (
                  <div key={person.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800 text-lg">{person.name}</p>
                        <p className="text-xs font-mono text-emerald-600 mt-1 uppercase bg-emerald-50 inline-block px-1 rounded">{person.id}</p>
                        <p className="text-xs text-gray-400">{person.phone}</p>
                      </div>
                      {record && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${record.status === '已報到' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                          {record.status}
                        </span>
                      )}
                    </div>
                    
                    {!record && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAction(person, '放棄領取')} 
                          className="flex-1 bg-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-300"
                        >
                          放棄領取
                        </button>
                        <button 
                          onClick={() => handleAction(person, '已報到')} 
                          className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md shadow-emerald-100"
                        >
                          確認報到
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右側：名單顯示 */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-gray-50">
              <h2 className="text-xl font-bold text-gray-700">即時處理名單</h2>
              <input
                type="text"
                placeholder="搜尋姓名、手機或身分證..."
                value={checkedInSearch}
                onChange={(e) => setCheckedInSearch(e.target.value)}
                className="w-full mt-4 px-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-gray-200 outline-none"
              />
            </div>
            <div className="flex-grow overflow-y-auto p-6">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-400 border-b">
                  <tr>
                    <th className="pb-3 text-left">姓名/狀態</th>
                    <th className="pb-3 text-left">資訊 (手機/身分證)</th>
                    <th className="pb-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {checkedIn.filter(c => 
                    c.name.includes(checkedInSearch) || 
                    c.phone.includes(checkedInSearch) || 
                    c.id.toUpperCase().includes(checkedInSearch.toUpperCase())
                  ).map(r => (
                    <tr key={r.id}>
                      <td className="py-4">
                        <p className="font-medium text-gray-700">{r.name}</p>
                        <span className={`text-[10px] px-1 rounded ${r.status === '已報到' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                      </td>
                      <td className="py-4">
                        <p className="text-sm font-medium text-gray-600">{r.phone}</p>
                        <p className="text-[10px] font-mono text-gray-400 uppercase">{r.id}</p>
                      </td>
                      <td className="py-4 text-right">
                        <button onClick={() => removeRecord(r.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
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