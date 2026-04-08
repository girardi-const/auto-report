import { Search, Calendar, X } from 'lucide-react';

interface User {
    uid: string;
    email: string | null;
    name?: string;
}

interface HistoricoFiltersProps {
    rawSearch: string;
    setRawSearch: (val: string) => void;
    handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    creatorFilter: string;
    setCreatorFilter: (val: string) => void;
    dateFrom: string;
    setDateFrom: (val: string) => void;
    dateTo: string;
    setDateTo: (val: string) => void;
    clearFilters: () => void;
    hasFilters: boolean;
    isAdmin: boolean;
    users: User[];
    setPage: (val: number) => void;
}

export function HistoricoFilters({
    rawSearch,
    handleSearchChange,
    creatorFilter,
    setCreatorFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    clearFilters,
    hasFilters,
    isAdmin,
    users,
    setPage
}: HistoricoFiltersProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-3 items-center flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                    id="report-search"
                    type="text"
                    value={rawSearch}
                    onChange={handleSearchChange}
                    placeholder="Buscar por título ou cliente…"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border-2 border-gray-100 focus:border-primary outline-none transition-all font-medium text-gray-700 placeholder:text-gray-300"
                />
            </div>

            {/* Creator Filter */}
            {users.length > 0 && (
                <div className="relative min-w-[200px]">
                    <select
                        value={creatorFilter}
                        onChange={(e) => { setCreatorFilter(e.target.value); setPage(1); }}
                        className="w-full px-4 py-2.5 text-sm rounded-lg border-2 border-gray-100 focus:border-primary outline-none transition-all font-medium text-gray-700 bg-white appearance-none"
                    >
                        <option value="">Todos os usuários</option>
                        {users.map(u => (
                            <option key={u.uid} value={u.name || (u.email ?? u.uid)}>{u.name || u.email}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Date From */}
            <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    className="pl-9 pr-3 py-2.5 text-sm rounded-lg border-2 border-gray-100 focus:border-primary outline-none transition-all font-medium text-gray-700 bg-white"
                />
            </div>

            {/* Date To */}
            <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    className="pl-9 pr-3 py-2.5 text-sm rounded-lg border-2 border-gray-100 focus:border-primary outline-none transition-all font-medium text-gray-700 bg-white"
                />
            </div>

            {/* Clear */}
            {hasFilters && (
                <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors whitespace-nowrap px-2"
                >
                    <X size={14} /> Limpar
                </button>
            )}
        </div>
    );
}
