
import React, { useState, useEffect, useCallback } from 'react';
import { RecordData, FarmRecord, UserRole } from '../types';
import { STATIC_HOUSE_LIST, MIN_HOUSES_FOR_ADVANCE } from '../constants';
import { formatDate } from '../utils/helpers';

interface RecordFormProps {
    userRole: UserRole;
    userFarm: string;
    allRecords: FarmRecord[];
    editingRecord: FarmRecord | null;
    onSave: (recordData: RecordData, editingId: string | null) => void;
    onCancelEdit: () => void;
    onSetMessage: (text: string, type: 'success' | 'error' | 'info') => void;
}

const RecordForm: React.FC<RecordFormProps> = ({ userRole, userFarm, allRecords, editingRecord, onSave, onCancelEdit, onSetMessage }) => {
    const [formData, setFormData] = useState<Partial<RecordData>>({
        date: formatDate(new Date()),
        houseName: '',
        ageWk: undefined,
        femaleBodyWeight: undefined,
        maleBodyWeight: undefined,
        femaleUniformity: undefined,
        maleUniformity: undefined,
        femaleFlockSize: undefined,
        maleFlockSize: undefined,
        femaleMortality: 0,
        maleMortality: 0,
        femaleCulls: 0,
        maleCulls: 0,
        femaleFeedIntake: undefined,
        maleFeedIntake: undefined,
        waterIntake: undefined,
    });
    const [isPcsLocked, setIsPcsLocked] = useState(false);

    const isEditing = !!editingRecord;
    const isBoss = userRole === 'Boss';
    const isWorker = userRole === 'Worker';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const populateFormWithCarryover = useCallback((houseName: string, recordDate: string) => {
        if (!houseName || isEditing) return;

        const recordsForFarm = allRecords.filter(r => r.farmName === userFarm);
        const recordsForHouse = recordsForFarm.filter(r => r.houseName === houseName);

        const recordToBaseCarryover = recordsForHouse
            .filter(r => r.date < recordDate)
            .sort((a, b) => b.date.localeCompare(a.date))[0];

        // FIX: Changed waterIntake from '' to undefined to match the number type.
        const resetDailyInputs = { femaleMortality: 0, maleMortality: 0, femaleCulls: 0, maleCulls: 0, waterIntake: undefined };

        if (!recordToBaseCarryover) {
            // FIX: Changed empty strings to undefined for number fields to prevent type errors.
            setFormData(prev => ({ ...prev, houseName, ...resetDailyInputs, ageWk: undefined, femaleFlockSize: undefined, maleFlockSize: undefined, femaleBodyWeight: undefined, maleBodyWeight: undefined, femaleUniformity: undefined, maleUniformity: undefined, femaleFeedIntake: undefined, maleFeedIntake: undefined }));
            return;
        }

        const latest = recordToBaseCarryover;
        const calculatedFemaleBalance = Number(latest.femaleFlockSize || 0) - Number(latest.femaleMortality || 0) - Number(latest.femaleCulls || 0);
        const calculatedMaleBalance = Number(latest.maleFlockSize || 0) - Number(latest.maleMortality || 0) - Number(latest.maleCulls || 0);

        const currentDate = new Date(recordDate + 'T00:00:00');
        const currentDayOfWeek = currentDate.getDay();

        let newFormData: Partial<RecordData> = { ...resetDailyInputs, ageWk: latest.ageWk, femaleFlockSize: calculatedFemaleBalance, maleFlockSize: calculatedMaleBalance };

        if (currentDayOfWeek === 0) { // Sunday
            // FIX: Changed empty strings to undefined for number fields to prevent type errors.
            newFormData = { ...newFormData, femaleBodyWeight: undefined, maleBodyWeight: undefined, femaleUniformity: undefined, maleUniformity: undefined, femaleFeedIntake: 0, maleFeedIntake: 0, waterIntake: undefined };
        } else { // Mon-Sat
            // FIX: Removed `|| ''` fallback on number fields to avoid type mismatch.
            newFormData = { ...newFormData, femaleBodyWeight: latest.femaleBodyWeight, maleBodyWeight: latest.maleBodyWeight, femaleUniformity: latest.femaleUniformity, maleUniformity: latest.maleUniformity, femaleFeedIntake: latest.femaleFeedIntake, maleFeedIntake: latest.maleFeedIntake, waterIntake: latest.waterIntake };
        }

        setFormData(prev => ({ ...prev, ...newFormData, houseName, date: recordDate }));

    }, [allRecords, userFarm, isEditing]);

    useEffect(() => {
        populateFormWithCarryover(formData.houseName || '', formData.date || formatDate(new Date()));
    }, [formData.houseName, formData.date, allRecords, userFarm, populateFormWithCarryover]);
    
    useEffect(() => {
        if (editingRecord) {
            setFormData({
                ...editingRecord,
                // FIX: Use undefined instead of '' for number fields when the value is 0 to avoid type errors.
                femaleBodyWeight: editingRecord.femaleBodyWeight === 0 ? undefined : editingRecord.femaleBodyWeight,
                maleBodyWeight: editingRecord.maleBodyWeight === 0 ? undefined : editingRecord.maleBodyWeight,
                femaleUniformity: editingRecord.femaleUniformity === 0 ? undefined : editingRecord.femaleUniformity,
                maleUniformity: editingRecord.maleUniformity === 0 ? undefined : editingRecord.maleUniformity,
            });
        }
    }, [editingRecord]);

    useEffect(() => {
        if (isEditing) {
            setIsPcsLocked(false);
            return;
        }
        const selectedDate = new Date((formData.date || '') + 'T00:00:00');
        const dayOfWeek = selectedDate.getDay();
        const age = Number(formData.ageWk);

        if (dayOfWeek === 0 || age === 1) { // Sunday or Age 1
            setIsPcsLocked(false);
        } else {
            setIsPcsLocked(true);
        }
    }, [formData.date, formData.ageWk, isEditing]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isBoss) {
            onSetMessage('Boss role is view-only.', 'error');
            return;
        }
        if (isWorker && isEditing) {
            onSetMessage('Worker role cannot edit records.', 'error');
            return;
        }

        const dataToSave: RecordData = {
            date: formData.date!,
            houseName: formData.houseName!,
            farmName: userFarm,
            ageWk: Number(formData.ageWk || 0),
            femaleBodyWeight: Number(formData.femaleBodyWeight || 0),
            maleBodyWeight: Number(formData.maleBodyWeight || 0),
            femaleUniformity: Number(formData.femaleUniformity || 0),
            maleUniformity: Number(formData.maleUniformity || 0),
            femaleFlockSize: Number(formData.femaleFlockSize || 0),
            maleFlockSize: Number(formData.maleFlockSize || 0),
            femaleMortality: Number(formData.femaleMortality || 0),
            maleMortality: Number(formData.maleMortality || 0),
            femaleCulls: Number(formData.femaleCulls || 0),
            maleCulls: Number(formData.maleCulls || 0),
            femaleFeedIntake: Number(formData.femaleFeedIntake || 0),
            maleFeedIntake: Number(formData.maleFeedIntake || 0),
            waterIntake: Number(formData.waterIntake || 0),
        };

        // Validation logic
        if (!dataToSave.date || !dataToSave.houseName || dataToSave.ageWk <= 0 || dataToSave.femaleFlockSize <= 0 || dataToSave.maleFlockSize <= 0 || dataToSave.waterIntake <= 0) {
            onSetMessage('Please fill all required fields (Date, House, Age, Pcs, Water).', 'error');
            return;
        }
        if ((dataToSave.femaleMortality + dataToSave.femaleCulls > dataToSave.femaleFlockSize) || (dataToSave.maleMortality + dataToSave.maleCulls > dataToSave.maleFlockSize)) {
            onSetMessage('Total reduction (Mortality + Culls) cannot exceed Bird Pcs.', 'error');
            return;
        }

        const isDuplicate = allRecords.some(r => 
            r.date === dataToSave.date && r.houseName === dataToSave.houseName && r.farmName === userFarm && r.id !== editingRecord?.id
        );
        if (isDuplicate) {
            onSetMessage(`A record for ${dataToSave.houseName} on ${dataToSave.date} already exists.`, 'error');
            return;
        }

        onSave(dataToSave, editingRecord?.id || null);
        if (!isEditing) {
          // Logic for suggesting next day's form state
          const recordsForFarm = allRecords.filter(r => r.farmName === userFarm);
          const recordsForCurrentDate = recordsForFarm.filter(r => r.date === dataToSave.date);
          const uniqueHousesLogged = new Set(recordsForCurrentDate.map(r => r.houseName));
          uniqueHousesLogged.add(dataToSave.houseName);
          
          let nextDate = new Date(dataToSave.date + 'T00:00:00');
          if (uniqueHousesLogged.size >= MIN_HOUSES_FOR_ADVANCE) {
            nextDate.setDate(nextDate.getDate() + 1);
          }

          const nextDateStr = formatDate(nextDate);
          
          // Reset form, but carry over to the next suggested date
          setFormData(prev => ({
            ...prev,
            date: nextDateStr,
            femaleMortality: 0,
            maleMortality: 0,
            femaleCulls: 0,
            maleCulls: 0,
            waterIntake: 0,
          }));
          populateFormWithCarryover(dataToSave.houseName, nextDateStr);
        }
    };
    
    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-green-200">
            <h2 className="text-2xl font-semibold text-green-600 mb-4">{isEditing ? 'Edit Daily Metrics' : 'Record Daily Metrics'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <fieldset disabled={isBoss}>
                    <div>
                        <label htmlFor="recordDate" className="block text-sm font-medium text-gray-700">Date</label>
                        <input type="date" id="recordDate" value={formData.date || ''} onChange={handleInputChange} max={formatDate(new Date())} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50" />
                    </div>
                    <div>
                        <label htmlFor="houseName" className="block text-sm font-medium text-gray-700">House Name/Number</label>
                        <select id="houseName" value={formData.houseName || ''} onChange={handleInputChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50">
                            <option value="" disabled>Select House</option>
                            {STATIC_HOUSE_LIST.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="ageWk" className="block text-sm font-medium text-gray-700">Bird Age (WK)</label>
                        <input type="number" id="ageWk" value={formData.ageWk || ''} onChange={handleInputChange} required min="1" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50" placeholder="e.g., 25" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="femaleBodyWeight" className="block text-sm font-medium text-gray-700">Female BW (g)</label>
                            <input type="number" id="femaleBodyWeight" value={formData.femaleBodyWeight || ''} onChange={handleInputChange} min="0" step="1" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50" placeholder="e.g., 1850" />
                        </div>
                        <div>
                            <label htmlFor="maleBodyWeight" className="block text-sm font-medium text-gray-700">Male BW (g)</label>
                            <input type="number" id="maleBodyWeight" value={formData.maleBodyWeight || ''} onChange={handleInputChange} min="0" step="1" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50" placeholder="e.g., 2500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="femaleUniformity" className="block text-sm font-medium text-gray-700">Female Uniformity (%)</label>
                            <input type="number" id="femaleUniformity" value={formData.femaleUniformity || ''} onChange={handleInputChange} min="0" max="100" step="0.1" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50" placeholder="e.g., 85" />
                        </div>
                        <div>
                            <label htmlFor="maleUniformity" className="block text-sm font-medium text-gray-700">Male Uniformity (%)</label>
                            <input type="number" id="maleUniformity" value={formData.maleUniformity || ''} onChange={handleInputChange} min="0" max="100" step="0.1" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50" placeholder="e.g., 90" />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="femaleFlockSize" className="block text-sm font-medium text-gray-700">Female Bird Pcs</label>
                            <input type="number" id="femaleFlockSize" value={formData.femaleFlockSize || ''} onChange={handleInputChange} required min="1" readOnly={isPcsLocked} className={`mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 ${isPcsLocked ? 'bg-gray-100' : ''}`} placeholder="e.g., 15000" />
                        </div>
                        <div>
                            <label htmlFor="maleFlockSize" className="block text-sm font-medium text-gray-700">Male Bird Pcs</label>
                            <input type="number" id="maleFlockSize" value={formData.maleFlockSize || ''} onChange={handleInputChange} required min="1" readOnly={isPcsLocked} className={`mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 ${isPcsLocked ? 'bg-gray-100' : ''}`} placeholder="e.g., 1500" />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="femaleMortality" className="block text-sm font-medium text-gray-700">Female Mortality</label>
                            <input type="number" id="femaleMortality" value={formData.femaleMortality || 0} onChange={handleInputChange} required min="0" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50" />
                        </div>
                        <div>
                            <label htmlFor="maleMortality" className="block text-sm font-medium text-gray-700">Male Mortality</label>
                            <input type="number" id="maleMortality" value={formData.maleMortality || 0} onChange={handleInputChange} required min="0" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50" />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="femaleCulls" className="block text-sm font-medium text-gray-700">Female Culls</label>
                            <input type="number" id="femaleCulls" value={formData.femaleCulls || 0} onChange={handleInputChange} required min="0" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50" />
                        </div>
                        <div>
                            <label htmlFor="maleCulls" className="block text-sm font-medium text-gray-700">Male Culls</label>
                            <input type="number" id="maleCulls" value={formData.maleCulls || 0} onChange={handleInputChange} required min="0" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50" />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="femaleFeedIntake" className="block text-sm font-medium text-gray-700">Female Feed Per Day (Kg)</label>
                            <input type="number" id="femaleFeedIntake" value={formData.femaleFeedIntake || ''} onChange={handleInputChange} required min="0" step="0.1" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50" placeholder="e.g., 2000" />
                        </div>
                        <div>
                            <label htmlFor="maleFeedIntake" className="block text-sm font-medium text-gray-700">Male Feed Per Day (Kg)</label>
                            <input type="number" id="maleFeedIntake" value={formData.maleFeedIntake || ''} onChange={handleInputChange} required min="0" step="0.1" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50" placeholder="e.g., 200" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="waterIntake" className="block text-sm font-medium text-gray-700">Water Intake (L)</label>
                        <input type="number" id="waterIntake" value={formData.waterIntake || ''} onChange={handleInputChange} required min="1" step="0.1" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50" placeholder="e.g., 5000" />
                    </div>
                    <button type="submit" className={`w-full py-3 px-4 border border-transparent rounded-lg shadow-md text-white font-medium ${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out`}>
                        {isBoss ? 'View Only Mode' : isEditing ? 'Update Record' : 'Save Daily Record'}
                    </button>
                    {isEditing && (
                        <button type="button" onClick={onCancelEdit} className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 font-medium bg-white hover:bg-gray-50 mt-2 transition duration-150 ease-in-out">
                            Cancel Edit
                        </button>
                    )}
                </fieldset>
            </form>
        </div>
    );
};

export default RecordForm;