
import React, { useMemo } from 'react';
import { FarmRecord, Filters, UserRole } from '../types';
import { STATIC_HOUSE_LIST } from '../constants';
import { getCalendarWeekNumber } from '../utils/helpers';

interface HistorySectionProps {
    records: FarmRecord[];
    filteredRecords: FarmRecord[];
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    userRole: UserRole;
    onEdit: (record: FarmRecord) => void;
    onDelete: (record: { id: string; date: string; houseName: string; }) => void;
    onDownload: () => void;
}

const HistorySection: React.FC<HistorySectionProps> = ({ records, filteredRecords, filters, setFilters, userRole, onEdit, onDelete, onDownload }) => {
    
    const { uniqueWeeks, uniqueCWOYs } = useMemo(() => {
        const weekSet = new Set<number>();
        const cwoySet = new Set<number>();
        records.forEach(r => {
            if (r.ageWk > 0) weekSet.add(r.ageWk);
            const cwoy = getCalendarWeekNumber(r.date);
            if(cwoy > 0) cwoySet.add(cwoy);
        });
        return {
            uniqueWeeks: Array.from(weekSet).sort((a, b) => a - b),
            uniqueCWOYs: Array.from(cwoySet).sort((a, b) => a - b)
        };
    }, [records]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.id.replace('Filter', '')]: e.target.value }));
    }

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700 mb-3 md:mb-0">History</h2>
                <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 items-end">
                    <div className="flex space-x-4 w-full md:w-auto">
                        <div>
                            <label htmlFor="houseFilter" className="block text-sm font-medium text-gray-700">Filter by House</label>
                            <select id="houseFilter" value={filters.house} onChange={handleFilterChange} className="mt-1 block w-full md:w-40 rounded-lg border-gray-300 shadow-sm p-2 border focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50">
                                <option value="All">All Houses</option>
                                {STATIC_HOUSE_LIST.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="ageWeekFilter" className="block text-sm font-medium text-gray-700">Filter by Age (WK)</label>
                            <select id="ageWeekFilter" value={filters.ageWeek} onChange={handleFilterChange} className="mt-1 block w-full md:w-40 rounded-lg border-gray-300 shadow-sm p-2 border focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50">
                                <option value="All">All Weeks</option>
                                {uniqueWeeks.map(w => <option key={w} value={w}>WK {w}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="cwoyFilter" className="block text-sm font-medium text-gray-700">Filter by Calendar Week</label>
                            <select id="cwoyFilter" value={filters.cwoy} onChange={handleFilterChange} className="mt-1 block w-full md:w-40 rounded-lg border-gray-300 shadow-sm p-2 border focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50">
                                <option value="All">All Calendar Weeks</option>
                                {uniqueCWOYs.map(w => <option key={w} value={w}>CW {w}</option>)}
                            </select>
                        </div>
                    </div>
                    {userRole !== 'Worker' && (
                        <button onClick={onDownload} className="w-full md:w-auto py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 font-medium bg-white hover:bg-gray-50 transition duration-150 ease-in-out">
                            Download Filtered Data (.csv)
                        </button>
                    )}
                </div>
            </div>
            {/* FIX: Changed prop name from `records` to `filteredRecords` to match component's expected props. */}
            <HistoryTable
                filteredRecords={filteredRecords}
                userRole={userRole}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        </div>
    );
};

// FIX: Renamed destructured prop from `records` to `filteredRecords` and aliased it to `records` for internal use, matching the prop type.
const HistoryTable: React.FC<Omit<HistorySectionProps, 'records' | 'filters' | 'setFilters' | 'onDownload'>> = ({ filteredRecords: records, userRole, onEdit, onDelete }) => {
    
    const canEdit = userRole === 'Supervisor' || userRole === 'Manager';
    const canDelete = userRole === 'Manager';
    
    const displayIfPositive = (val: any) => (Number(val) > 0 ? Number(val).toLocaleString() : ' - ');
    const formatDecimal = (val: any, decimals = 1, suffix = '') => (Number(val) > 0 ? `${Number(val).toFixed(decimals)}${suffix}` : ' - ');

    if (!records.length) {
        return <div className="text-center py-10 text-gray-500">No records found matching your filter selection.</div>;
    }
    
    return (
         <div className="overflow-x-auto rounded-lg border border-gray-300">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-700 text-white">
                    <tr>
                        {['Date', 'House', 'Age (WK)', 'Female Pcs', 'Male Pcs', 'Female Mort.', 'Male Mort.', 'Female Culls', 'Male Culls', 'Female Mort. %', 'Male Mort. %', 'Female BW (g)', 'Male BW (g)', 'Female Uni. %', 'Male Uni. %', 'Water Intake (L)', 'M:F Ratio (%)', 'Female Feed/Bird (g)', 'Male Feed/Bird (g)', 'W:F Ratio (L/Kg)', 'Actions'].map(h => (
                             <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {records.map(r => {
                         const femaleFlockSize = Number(r.femaleFlockSize || 0);
                         const maleFlockSize = Number(r.maleFlockSize || 0);
                         const femaleFeedIntake = Number(r.femaleFeedIntake || 0);
                         const maleFeedIntake = Number(r.maleFeedIntake || 0);
                         const totalFeedIntakeKg = femaleFeedIntake + maleFeedIntake;
                         const waterIntake = Number(r.waterIntake || 0);
                         
                         const mfRatio = femaleFlockSize > 0 ? (maleFlockSize / femaleFlockSize) * 100 : 0;
                         const femaleMortalityPercent = femaleFlockSize > 0 ? (Number(r.femaleMortality) / femaleFlockSize) * 100 : 0;
                         const maleMortalityPercent = maleFlockSize > 0 ? (Number(r.maleMortality) / maleFlockSize) * 100 : 0;
                         const femaleFeedPerBirdGrams = femaleFlockSize > 0 ? (femaleFeedIntake * 1000) / femaleFlockSize : 0;
                         const maleFeedPerBirdGrams = maleFlockSize > 0 ? (maleFeedIntake * 1000) / maleFlockSize : 0;
                         const wfRatio = totalFeedIntakeKg > 0 ? waterIntake / totalFeedIntakeKg : 0;

                        return (
                        <tr key={r.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{r.date}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{r.houseName}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-semibold">{displayIfPositive(r.ageWk)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-pink-600">{displayIfPositive(femaleFlockSize)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600">{displayIfPositive(maleFlockSize)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-red-700 font-bold">{displayIfPositive(r.femaleMortality)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-red-700 font-bold">{displayIfPositive(r.maleMortality)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-red-700">{displayIfPositive(r.femaleCulls)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-red-700">{displayIfPositive(r.maleCulls)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-yellow-700">{formatDecimal(femaleMortalityPercent, 3, '%')}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-yellow-700">{formatDecimal(maleMortalityPercent, 3, '%')}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">{displayIfPositive(r.femaleBodyWeight)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">{displayIfPositive(r.maleBodyWeight)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">{formatDecimal(r.femaleUniformity, 1, '%')}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">{formatDecimal(r.maleUniformity, 1, '%')}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 font-semibold">{displayIfPositive(waterIntake)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-yellow-700">{formatDecimal(mfRatio, 1, '%')}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-yellow-700">{formatDecimal(femaleFeedPerBirdGrams, 1)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-yellow-700">{formatDecimal(maleFeedPerBirdGrams, 1)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-yellow-700">{formatDecimal(wfRatio, 2)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                {canEdit && <button onClick={() => onEdit(r)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>}
                                {canDelete && <button onClick={() => onDelete({id: r.id, date: r.date, houseName: r.houseName})} className="text-red-600 hover:text-red-900">Delete</button>}
                                {!canEdit && !canDelete && <span className="text-gray-400">View Only</span>}
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
        </div>
    );
};

export default HistorySection;