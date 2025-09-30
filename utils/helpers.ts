
import { FarmRecord } from './types';

export function formatDate(date: Date): string {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

export function getCalendarWeekNumber(dateString: string): number {
    if (!dateString) return 0;
    const d = new Date(dateString + 'T00:00:00');
    const year = d.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    
    let firstSunday = new Date(startOfYear);
    while (firstSunday.getDay() !== 0) {
        firstSunday.setDate(firstSunday.getDate() + 1);
    }

    const diffInTime = d.getTime() - firstSunday.getTime();
    const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));

    if (diffInDays < 0) return 1;
    
    return Math.floor(diffInDays / 7) + 1;
}

export const exportToCSV = (recordsToExport: FarmRecord[], farmName: string) => {
    if (recordsToExport.length === 0) {
        alert('No records to export.');
        return;
    }

    const headers = [
        "Farm Name", "House Name", "Date", "Age (WK)",
        "Female Pcs", "Male Pcs",
        "Female Mortality", "Male Mortality",
        "Female Culls", "Male Culls",
        "Female Mort. %", "Male Mort. %",
        "Female BW (g)", "Male BW (g)",
        "Female Uniformity (%)", "Male Uniformity (%)",
        "Female Feed (Kg)", "Male Feed (Kg)",
        "Water Intake (L)",
        "M:F Ratio (%)",
        "Female Feed/Bird (g)", "Male Feed/Bird (g)",
        "Water/Bird (ml)",
        "W:F Ratio (L/Kg)",
        "Record ID"
    ];

    const csvRows = [headers.join(',')];

    recordsToExport.forEach(record => {
        const femaleFlockSize = Number(record.femaleFlockSize || 0);
        const maleFlockSize = Number(record.maleFlockSize || 0);
        const femaleMortality = Number(record.femaleMortality || 0);
        const maleMortality = Number(record.maleMortality || 0);
        const femaleCulls = Number(record.femaleCulls || 0);
        const maleCulls = Number(record.maleCulls || 0);
        const femaleFeedIntake = Number(record.femaleFeedIntake || 0);
        const maleFeedIntake = Number(record.maleFeedIntake || 0);
        const waterIntake = Number(record.waterIntake || 0);

        const totalFlockSize = femaleFlockSize + maleFlockSize;
        const totalFeedIntakeKg = femaleFeedIntake + maleFeedIntake;

        const mfRatio = femaleFlockSize > 0 ? (maleFlockSize / femaleFlockSize) * 100 : 0;
        const femaleMortalityPercent = femaleFlockSize > 0 ? (femaleMortality / femaleFlockSize) * 100 : 0;
        const maleMortalityPercent = maleFlockSize > 0 ? (maleMortality / maleFlockSize) * 100 : 0;
        const femaleFeedPerBirdGrams = femaleFlockSize > 0 ? (femaleFeedIntake * 1000) / femaleFlockSize : 0;
        const maleFeedPerBirdGrams = maleFlockSize > 0 ? (maleFeedIntake * 1000) / maleFlockSize : 0;
        const waterPerBirdMl = totalFlockSize > 0 ? (waterIntake * 1000) / totalFlockSize : 0;
        const wfRatio = totalFeedIntakeKg > 0 ? waterIntake / totalFeedIntakeKg : 0;

        const row = [
            record.farmName,
            record.houseName,
            record.date,
            record.ageWk,
            femaleFlockSize,
            maleFlockSize,
            femaleMortality,
            maleMortality,
            femaleCulls,
            maleCulls,
            femaleMortalityPercent.toFixed(3),
            maleMortalityPercent.toFixed(3),
            Number(record.femaleBodyWeight || 0),
            Number(record.maleBodyWeight || 0),
            Number(record.femaleUniformity || 0).toFixed(1),
            Number(record.maleUniformity || 0).toFixed(1),
            femaleFeedIntake.toFixed(1),
            maleFeedIntake.toFixed(1),
            waterIntake.toFixed(1),
            mfRatio.toFixed(1),
            femaleFeedPerBirdGrams.toFixed(1),
            maleFeedPerBirdGrams.toFixed(1),
            waterPerBirdMl.toFixed(1),
            wfRatio.toFixed(2),
            record.id
        ];
        csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${farmName}_Breeder_Log_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
