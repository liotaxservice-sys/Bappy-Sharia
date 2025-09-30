
import React, { useMemo } from 'react';
import { FarmRecord, Filters } from '../types';
import { getCalendarWeekNumber } from '../utils/helpers';

interface WeeklySummaryProps {
    records: FarmRecord[];
    filters: Filters;
}

const SummaryItem: React.FC<{ label: string; value: string | number; }> = ({ label, value }) => (
    <div className="p-3 bg-yellow-50 rounded-lg shadow-sm">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold text-yellow-800">{value}</p>
    </div>
);

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ records, filters }) => {
    const summaryData = useMemo(() => {
        let targetRecords = records;
        if (filters.house !== 'All') {
            targetRecords = targetRecords.filter(r => r.houseName === filters.house);
        }
        if (targetRecords.length === 0) return null;

        let reportingWeekValue;
        let reportingWeekType: 'CWOY' | 'AgeWK';
        
        if (filters.cwoy !== 'All') {
            reportingWeekValue = Number(filters.cwoy);
            reportingWeekType = 'CWOY';
        } else if (filters.ageWeek !== 'All') {
            reportingWeekValue = Number(filters.ageWeek);
            reportingWeekType = 'AgeWK';
        } else {
            reportingWeekValue = Math.max(...targetRecords.map(r => Number(r.ageWk || 0)).filter(wk => wk > 0));
            reportingWeekType = 'AgeWK';
        }
        
        if (!reportingWeekValue || reportingWeekValue <= 0) return null;

        const weeklyRecords = targetRecords.filter(r => 
            reportingWeekType === 'CWOY' 
                ? getCalendarWeekNumber(r.date) === reportingWeekValue 
                : Number(r.ageWk) === reportingWeekValue
        );
        
        if (weeklyRecords.length === 0) return null;

        const firstDayRecord = weeklyRecords.sort((a, b) => a.date.localeCompare(b.date))[0];
        const initialFemalePcs = Number(firstDayRecord?.femaleFlockSize || 0);

        let totalFemaleMortPcs = 0, totalMaleMortPcs = 0, totalFemaleBw = 0, femaleBwCount = 0, totalMaleBw = 0, maleBwCount = 0;

        weeklyRecords.forEach(record => {
            totalFemaleMortPcs += Number(record.femaleMortality || 0);
            totalMaleMortPcs += Number(record.maleMortality || 0);
            const femaleBw = Number(record.femaleBodyWeight || 0);
            if (femaleBw > 0) {
                totalFemaleBw += femaleBw;
                femaleBwCount++;
            }
            const maleBw = Number(record.maleBodyWeight || 0);
            if (maleBw > 0) {
                totalMaleBw += maleBw;
                maleBwCount++;
            }
        });

        const cumFemaleMort = initialFemalePcs > 0 ? (totalFemaleMortPcs / initialFemalePcs) * 100 : 0;
        const avgFemaleBw = femaleBwCount > 0 ? totalFemaleBw / femaleBwCount : 0;
        const avgMaleBw = maleBwCount > 0 ? totalMaleBw / maleBwCount : 0;

        let weekText;
        const weekPrefix = reportingWeekType === 'CWOY' ? 'CW' : 'WK';
        if (filters.house !== 'All') {
            weekText = `${filters.house} (${weekPrefix} ${reportingWeekValue})`;
        } else {
            weekText = `${weekPrefix} ${reportingWeekValue} (All Houses)`;
        }

        return {
            weekText,
            cumFemaleMort: `${cumFemaleMort.toFixed(3)}%`,
            totalFemaleMortPcs: totalFemaleMortPcs.toLocaleString(),
            totalMaleMortPcs: totalMaleMortPcs.toLocaleString(),
            avgFemaleBw: `${avgFemaleBw.toFixed(0)} g`,
            avgMaleBw: `${avgMaleBw.toFixed(0)} g`,
        };
    }, [records, filters]);

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-yellow-300">
            <h2 className="text-2xl font-semibold text-yellow-700 mb-4">Weekly Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <SummaryItem label="Reporting Period" value={summaryData?.weekText || '-'} />
                <SummaryItem label="Cum. Female Mort. %" value={summaryData?.cumFemaleMort || '-'} />
                <SummaryItem label="Cum. Female Mort. Pcs" value={summaryData?.totalFemaleMortPcs || '-'} />
                <SummaryItem label="Cum. Male Mort. Pcs" value={summaryData?.totalMaleMortPcs || '-'} />
                <SummaryItem label="Avg. Female BW (g)" value={summaryData?.avgFemaleBw || '-'} />
                <SummaryItem label="Avg. Male BW (g)" value={summaryData?.avgMaleBw || '-'} />
            </div>
        </div>
    );
};

export default WeeklySummary;
