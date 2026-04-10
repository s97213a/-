/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import LoginPage from './LoginPage';
import { Search, UserCheck, Smartphone, CreditCard, FileUp, FileDown, Users, Trash2, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';

// --- 引入 Firebase 配置 ---
import { db } from './firebase'; 
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  writeBatch,
  getDocs
} from 'firebase/firestore';

// 定義資料結構
interface Registrant {
  id: string;
  name: string;
  phone: string;
}

interface CheckedInRegistrant extends Registrant {
  firebaseId?: string; // Firestore 的文件 ID
  checkInTime: string; 
  status: '已報到' | '放棄領取';
}

export default function App() {
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [checkedIn, setCheckedIn] = useState<CheckedInRegistrant[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchType, setSearchType] = useState<'phone' | 'id'>('phone');
  const [searchResults, setSearchResults] = useState<Registrant[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [checkedInSearch, setCheckedInSearch] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. Firebase 即時資料監聽 ---
  useEffect(() => {
    if (!isAuthenticated) return;

    // 監聽原始名單
    const unsubRegistrants = onSnapshot(collection(db, "registrants"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data() } as Registrant));
      setRegistrants(data);
    });

    // 監聽報到紀錄 (按時間降冪排序)
    const qCheckedIn = query(collection(db, "checkedIn"), orderBy("checkInTime", "desc"));
    const unsubCheckedIn = onSnapshot(qCheckedIn, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        firebaseId: doc.id, 
        ...(doc.data() as any)
      }));
      setCheckedIn(data);
    });

    return () => {
      unsubRegistrants();
      unsubCheckedIn();
    };
  }, [isAuthenticated]);

  const handleLogin = () => setIsAuthenticated(true);

  // --- 2. 雲端清空功能 (使用 Batch 處理) ---
  const handleReset = async () => {
    if (window.confirm("確定要清空雲端所有資料嗎？這將刪除目前匯入的名單與所有報到紀錄。")) {
      try {
        const batch = writeBatch(db);
        
        // 刪除所有名單
        const regSnap = await getDocs(collection(db, "registrants"));
        regSnap.forEach((d) => batch.delete(d.ref));
        
        // 刪除所有報到紀錄
        const checkSnap = await getDocs(collection(db, "checkedIn"));
        checkSnap.forEach((d) => batch.delete(d.ref));

        await batch.commit();
        setSearchResults([]);
        setHasSearched(false);
        alert("雲端資料已完全清空");
      } catch (e) {
        alert("清空失敗，請檢查權限");
      }
    }
  };

  // --- 3. 匯入 Excel 並同步至 Firebase ---
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet) as any[];

      const importedData: Registrant[] = json.map((row) => ({
        id: (row['身分證字號'] || row['身分證'] || row['ID'] || '').toString().trim(),
        name: (row['姓名'] || row['Name'] || '').toString().trim(),
        phone: (row['電話'] || row['手機'] || row['Phone'] || '').toString().trim(),
      })).filter(r => r.id && r.name);

      if (importedData.length > 0) {
        try {
          const batch = writeBatch(db);
          importedData.forEach((item) => {
            const docRef = doc(db, "registrants", item.id);
            batch.set(docRef, item);
          });
          await batch.commit();
          alert(`成功同步 ${importedData.length} 筆名單至雲端！`);
        } catch (e) {
          alert("上傳雲端失敗，請確認 Firebase Rules 設定。");
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- 4. 搜尋邏輯 ---
  const handleSearch = () => {
    if (registrants.length === 0) return alert('雲端尚無名單，請先匯入！');
    setHasSearched(true);
    const term = inputValue.trim();
    if (!term) return setSearchResults([]);

    let found = registrants.filter((r) => 
      searchType === 'phone' 
        ? r.phone.endsWith(term) 
        : r.id.toUpperCase() === term.toUpperCase()
    );
    setSearchResults(found);
  };

  // --- 5. 報到/放棄 (寫入雲端) ---
  const handleAction = async (person: Registrant, status: '已報到' | '放棄領取') => {
    if (checkedIn.some((r) => r.id === person.id)) return alert('此民眾已有紀錄！');
    
    try {
      await addDoc(collection(db, "checkedIn"), {
        ...person,
        checkInTime: new Date().toISOString(),
        status
      });
      setSearchResults([]);
      setInputValue('');
      setHasSearched(false);
    } catch (e) {
      alert("儲存至雲端失敗");
    }
  };

  // --- 6. 刪除雲端單筆紀錄 ---
  const removeRecord = async (firebaseId: string) => {
    if (window.confirm("確定要刪除此筆紀錄嗎？")) {
      try {
        await deleteDoc(doc(db, "checkedIn", firebaseId));
      } catch (e) {
        alert("刪除失敗");
      }
    }
  };

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
    XLSX.writeFile(wb, '報到紀錄.xlsx');
  };

  if (!isAuthenticated) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="min-h-screen font-sans text-[#1a1a1a] bg-[#f5f5f0] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#5A5A40]">報到系統</h1>
          <p className="text-gray-500">雲端名單：{registrants.length} | 已處理：{checkedIn.length}</p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={handleReset} className="flex items-center gap-2 bg-white border-2 border-red-200 text-red-500 px-4 py-2 rounded-xl hover:bg-red-50 transition-all">
            <RotateCcw size={18} /> 重置雲端
          </button>
          <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleImport} />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-white border-2 border-[#5A5A40] text-[#5A5A40] px-4 py-2 rounded-xl hover:bg-[#5A5A40] hover:text-white transition-all">
            <FileUp size={18} /> 匯入名單
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-black transition-all">
            <FileDown size={18} /> 匯出結果
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
        {/* 查詢區 */}
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
              <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder={searchType === 'phone' ? "輸入末三碼" : "輸入完整字號"} className="flex-grow px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#5A5A40] outline-none" />
              <button onClick={handleSearch} className="bg-[#5A5A40] text-white p-4 rounded-2xl hover:opacity-90"><Search /></button>
            </div>
            <div className="mt-6 space-y-3">
              {hasSearched && searchResults.length === 0 && <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-2xl">未找到名單</div>}
              {searchResults.map(person => {
                const record = checkedIn.find(c => c.id === person.id);
                return (
                  <div key={person.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800 text-lg">{person.name}</p>
                        <p className="text-xs font-mono text-emerald-600 mt-1 uppercase bg-emerald-50 inline-block px-1 rounded">{person.id}</p>
                      </div>
                      {record && <span className={`text-xs font-bold px-2 py-1 rounded-lg ${record.status === '已報到' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>{record.status}</span>}
                    </div>
                    {!record && (
                      <div className="flex gap-2">
                        <button onClick={() => handleAction(person, '放棄領取')} className="flex-1 bg-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-300">放棄領取</button>
                        <button onClick={() => handleAction(person, '已報到')} className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md">確認報到</button>
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
              <h2 className="text-xl font-bold text-gray-700">即時處理名單 (雲端)</h2>
              <input type="text" placeholder="搜尋姓名、手機或身分證..." value={checkedInSearch} onChange={(e) => setCheckedInSearch(e.target.value)} className="w-full mt-4 px-4 py-2 bg-gray-50 border-none rounded-xl text-sm outline-none" />
            </div>
            <div className="flex-grow overflow-y-auto p-6">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-400 border-b">
                  <tr>
                    <th className="pb-3 text-left">姓名/狀態</th>
                    <th className="pb-3 text-left">資訊</th>
                    <th className="pb-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {checkedIn.filter(c => c.name.includes(checkedInSearch) || c.phone.includes(checkedInSearch) || c.id.toUpperCase().includes(checkedInSearch.toUpperCase())).map(r => (
                    <tr key={r.id}>
                      <td className="py-4">
                        <p className="font-medium text-gray-700">{r.name}</p>
                        <span className={`text-[10px] px-1 rounded ${r.status === '已報到' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                      </td>
                      <td className="py-4 text-xs">
                        <p className="text-gray-600">{r.phone}</p>
                        <p className="text-gray-400 uppercase font-mono">{r.id}</p>
                      </td>
                      <td className="py-4 text-right">
                        <button onClick={() => r.firebaseId && removeRecord(r.firebaseId)} className="text-gray-300 hover:text-red-500 transition-colors">
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