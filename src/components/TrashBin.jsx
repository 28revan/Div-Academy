import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Search, RotateCcw, X, AlertCircle } from 'lucide-react';

export default function TrashBin() {
  const [trashItems, setTrashItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/trash');
      const data = await res.json();
      setTrashItems(data);
    } catch (error) {
      console.error('Error fetching trash:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm('Bu ödənişi/istifadəçini geri qaytarmaq istədiyinizə əminsiniz?')) return;
    try {
      await fetch(`/api/admin/trash/${id}/restore`, { method: 'POST' });
      fetchTrash();
    } catch (error) {
      console.error('Restore error:', error);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Bu məlumatı həmişəlik silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz!')) return;
    try {
      await fetch(`/api/admin/trash/${id}`, { method: 'DELETE' });
      fetchTrash();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const filteredItems = trashItems.filter(item => {
    if (search && !JSON.stringify(item.data).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-[#E2E2E2] uppercase tracking-tighter flex items-center gap-3">
              <Trash2 className="text-red-500" />
              Zibil Qutusu
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
              Silinmiş məlumatların arxivi
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#121214] border border-[#2C2C30] rounded-2xl p-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Zibil qutusunda axtar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#1E1E21] border border-[#2C2C30] text-[#E2E2E2] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all text-sm font-medium placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-[#121214] border border-[#2C2C30] rounded-2xl p-8 text-center text-sm text-gray-500 font-mono">
            Yüklənir...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-[#121214] border border-[#2C2C30] rounded-2xl p-12 text-center text-gray-500">
            <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm font-bold uppercase tracking-widest">Zibil qutusu boşdur</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mobile/Tablet Card View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
              <AnimatePresence>
                {filteredItems.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#121214] border border-[#2C2C30] rounded-2xl p-4 flex flex-col gap-3 shadow-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                       <span className="px-3 py-1 bg-[#2C2C30] text-[#E2E2E2] rounded-full text-[10px] font-black tracking-widest uppercase">
                         {item.type}
                       </span>
                       <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRestore(item.id)}
                            className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-colors shadow-sm"
                            title="Geri Qaytar"
                          >
                            <RotateCcw size={16} />
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(item.id)}
                            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors shadow-sm"
                            title="Həmişəlik Sil"
                          >
                            <X size={16} />
                          </button>
                       </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#E2E2E2] break-words">
                        {item.data.name || item.data.email || item.data.title || JSON.stringify(item.data).slice(0, 50)}...
                      </p>
                      <p className="text-xs text-gray-500 mt-1 font-mono break-all">
                        ID: {item.data.uid || item.data.id || 'N/A'}
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400 font-mono mt-auto pt-3 border-t border-[#2C2C30]">
                      <span className="truncate pr-2">Silən: <span className="text-[#E2E2E2]">{item.deletedBy}</span></span>
                      <div className="flex flex-col items-end whitespace-nowrap">
                        <span>{new Date(item.deletedAt).toLocaleDateString('az-AZ')}</span>
                        <span className="text-[10px]">{new Date(item.deletedAt).toLocaleTimeString('az-AZ')}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-[#121214] border border-[#2C2C30] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#2C2C30] bg-[#1E1E21]/50">
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Növ</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Silinən Məlumat</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Silən Şəxs</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Tarix / Saat</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right whitespace-nowrap">Əməliyyat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2C2C30]">
                    <AnimatePresence>
                      {filteredItems.map(item => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="hover:bg-[#1E1E21]/50 transition-colors group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 bg-[#2C2C30] text-[#E2E2E2] rounded-full text-[10px] font-black tracking-widest uppercase">
                              {item.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-[#E2E2E2] truncate max-w-xs xl:max-w-md">
                              {item.data.name || item.data.email || item.data.title || JSON.stringify(item.data).slice(0, 50)}...
                            </p>
                            <p className="text-xs text-gray-500 mt-1 font-mono truncate max-w-xs xl:max-w-md">
                              ID: {item.data.uid || item.data.id || 'N/A'}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono text-gray-400">
                              {item.deletedBy}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-[#E2E2E2]">
                                {new Date(item.deletedAt).toLocaleDateString('az-AZ')}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono mt-0.5">
                                {new Date(item.deletedAt).toLocaleTimeString('az-AZ')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleRestore(item.id)}
                                className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-colors group/btn relative"
                                title="Geri Qaytar"
                              >
                                <RotateCcw size={16} />
                              </button>
                              <button
                                onClick={() => handlePermanentDelete(item.id)}
                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                                title="Həmişəlik Sil"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
