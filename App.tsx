

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// FIX: Use namespace import for firebase/app to resolve module export issues.
import * as firebaseApp from "firebase/app";
// FIX: Use namespace import for firebase/auth to resolve module export issues.
import * as firebaseAuth from "firebase/auth";
import { getFirestore, collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { RecordData, FarmRecord, UserRole, Filters } from './types';
import { USER_ROLE_KEY, USER_FARM_KEY, STATIC_FARM_LIST } from './constants';
import { getCalendarWeekNumber, formatDate, exportToCSV } from './utils/helpers';
import AuthModals from './components/AuthModals';
import Header from './components/Header';
import RecordForm from './components/RecordForm';
import WeeklySummary from './components/WeeklySummary';
import HistorySection from './components/HistorySection';
import ConfirmationModal from './components/ConfirmationModal';

const App: React.FC = () => {
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [userFarm, setUserFarm] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [allRecords, setAllRecords] = useState<FarmRecord[]>([]);
    const [db, setDb] = useState<any>(null);
    // FIX: Use the User type from the firebaseAuth namespace.
    const [user, setUser] = useState<firebaseAuth.User | null>(null);
    const [editingRecord, setEditingRecord] = useState<FarmRecord | null>(null);
    const [deletingRecord, setDeletingRecord] = useState<{ id: string; date: string; houseName: string; } | null>(null);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

    const [filters, setFilters] = useState<Filters>({
        house: 'All',
        ageWeek: 'All',
        cwoy: 'All'
    });
    
    // Firebase configuration from environment (injected by the runtime)
    // @ts-ignore
    const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

    useEffect(() => {
        const role = localStorage.getItem(USER_ROLE_KEY) as UserRole;
        const farm = localStorage.getItem(USER_FARM_KEY);
        
        if (role && STATIC_FARM_LIST.includes(farm || '')) {
            setUserRole(role);
            setUserFarm(farm);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (userRole && userFarm) {
            try {
                if (Object.keys(firebaseConfig).length === 0) {
                     throw new Error("Firebase configuration is missing.");
                }
                // FIX: Use initializeApp from the firebaseApp namespace.
                const app = firebaseApp.initializeApp(firebaseConfig);
                const firestore = getFirestore(app);
                // FIX: Use getAuth from the firebaseAuth namespace.
                const auth = firebaseAuth.getAuth(app);
                setDb(firestore);

                // FIX: Use onAuthStateChanged from the firebaseAuth namespace.
                firebaseAuth.onAuthStateChanged(auth, (currentUser) => {
                    if (currentUser) {
                        setUser(currentUser);
                    } else {
                        // FIX: Use signInAnonymously from the firebaseAuth namespace.
                        firebaseAuth.signInAnonymously(auth).catch((error) => console.error("Anonymous sign-in failed:", error));
                    }
                });
            } catch (error) {
                console.error("Firebase Initialization Error:", error);
                setMessage({ text: "Error: Could not connect to the database.", type: 'error' });
            }
        }
    }, [userRole, userFarm, firebaseConfig]);

    useEffect(() => {
        if (!db || !user) return;
        
        // @ts-ignore
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-broiler-app';
        const RECORDS_COLLECTION_PATH = `artifacts/${appId}/public/data/broiler_records`;

        const q = query(collection(db, RECORDS_COLLECTION_PATH), orderBy('date', 'desc'), orderBy('timestamp', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const records: FarmRecord[] = [];
            snapshot.forEach(doc => {
                records.push({ id: doc.id, ...doc.data() } as FarmRecord);
            });
            setAllRecords(records);
        }, (error) => {
            console.error("Error fetching documents:", error);
            setMessage({ text: 'Error loading data from the database.', type: 'error' });
        });

        return () => unsubscribe();
    }, [db, user]);


    const handleSetMessage = (text: string, type: 'success' | 'error' | 'info') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleRoleSelect = (role: UserRole) => {
        localStorage.setItem(USER_ROLE_KEY, role);
        setUserRole(role);
    };

    const handleFarmSelect = (farm: string) => {
        localStorage.setItem(USER_FARM_KEY, farm);
        setUserFarm(farm);
    };
    
    const farmRecords = useMemo(() => allRecords.filter(r => r.farmName === userFarm), [allRecords, userFarm]);

    const filteredRecords = useMemo(() => {
        return farmRecords.filter(record => {
            const houseMatch = filters.house === 'All' || record.houseName === filters.house;
            const ageWeekMatch = filters.ageWeek === 'All' || record.ageWk === Number(filters.ageWeek);
            const cwoyMatch = filters.cwoy === 'All' || getCalendarWeekNumber(record.date) === Number(filters.cwoy);
            return houseMatch && ageWeekMatch && cwoyMatch;
        });
    }, [farmRecords, filters]);

    const handleCancelEdit = () => {
        setEditingRecord(null);
        handleSetMessage('Editing cancelled.', 'info');
    };

    const recalculateSubsequentRecords = useCallback(async (editedRecord: FarmRecord) => {
        if (!db) return;
        
        handleSetMessage('Inventory change detected. Recalculating future records...', 'info');

        const houseRecords = allRecords
            .filter(r => r.houseName === editedRecord.houseName && r.farmName === userFarm)
            .sort((a, b) => a.date.localeCompare(b.date));

        const startIndex = houseRecords.findIndex(r => r.date === editedRecord.date) + 1;

        if (startIndex >= houseRecords.length) {
            handleSetMessage('Record updated successfully. No subsequent records to adjust.', 'success');
            return;
        }

        let previousRecord = editedRecord;
        // @ts-ignore
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-broiler-app';
        const RECORDS_COLLECTION_PATH = `artifacts/${appId}/public/data/broiler_records`;

        for (let i = startIndex; i < houseRecords.length; i++) {
            const currentRecord = houseRecords[i];
            
            const calculatedFemalePcs = Number(previousRecord.femaleFlockSize) - Number(previousRecord.femaleMortality) - Number(previousRecord.femaleCulls);
            const calculatedMalePcs = Number(previousRecord.maleFlockSize) - Number(previousRecord.maleMortality) - Number(previousRecord.maleCulls);

            if (calculatedFemalePcs !== Number(currentRecord.femaleFlockSize) || calculatedMalePcs !== Number(currentRecord.maleFlockSize)) {
                const updatedData = {
                    femaleFlockSize: calculatedFemalePcs,
                    maleFlockSize: calculatedMalePcs,
                };
                const docRef = doc(db, RECORDS_COLLECTION_PATH, currentRecord.id);
                await updateDoc(docRef, updatedData);
                
                currentRecord.femaleFlockSize = calculatedFemalePcs;
                currentRecord.maleFlockSize = calculatedMalePcs;
            }
            
            previousRecord = currentRecord;
        }

        handleSetMessage('Record updated and subsequent inventory counts corrected!', 'success');
    }, [db, allRecords, userFarm]);


    const handleSaveRecord = async (recordData: RecordData, editingId: string | null) => {
        if (!db || !user) {
            handleSetMessage('Database connection not ready.', 'error');
            return;
        }
        // @ts-ignore
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-broiler-app';
        const RECORDS_COLLECTION_PATH = `artifacts/${appId}/public/data/broiler_records`;

        try {
            if (editingId) {
                const docRef = doc(db, RECORDS_COLLECTION_PATH, editingId);
                await updateDoc(docRef, recordData);
                const updatedRecord = { id: editingId, ...recordData } as FarmRecord;
                await recalculateSubsequentRecords(updatedRecord);
                setEditingRecord(null);
            } else {
                await addDoc(collection(db, RECORDS_COLLECTION_PATH), { ...recordData, timestamp: serverTimestamp() });
                handleSetMessage(`Record for ${recordData.houseName} on ${recordData.date} saved.`, 'success');
            }
        } catch (error) {
            console.error("Error saving record:", error);
            handleSetMessage(`Error saving record: ${error.message}`, 'error');
        }
    };

    const confirmDelete = async () => {
        if (!deletingRecord || !db) return;
        if (userRole !== 'Manager') {
            handleSetMessage('Permission Denied: Only Managers can delete records.', 'error');
            setDeletingRecord(null);
            return;
        }
        // @ts-ignore
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-broiler-app';
        const RECORDS_COLLECTION_PATH = `artifacts/${appId}/public/data/broiler_records`;

        try {
            await deleteDoc(doc(db, RECORDS_COLLECTION_PATH, deletingRecord.id));
            handleSetMessage('Record deleted successfully. Inventory recalculation will occur on the next update.', 'success');
        } catch (error) {
            console.error("Error deleting document:", error);
            handleSetMessage('Error deleting record.', 'error');
        } finally {
            setDeletingRecord(null);
        }
    };
    
    const handleDownload = () => {
        if (!userRole || userRole === 'Worker') {
            handleSetMessage('Permission Denied to download data.', 'error');
            return;
        }
        exportToCSV(filteredRecords, userFarm || 'Export');
        handleSetMessage(`Exported ${filteredRecords.length} records successfully.`, 'success');
    }

    if (isLoading) {
        return <div className="text-center mt-20 text-gray-500 text-lg">Loading application...</div>;
    }

    if (!userRole || !userFarm) {
        return <AuthModals userRole={userRole} onRoleSelect={handleRoleSelect} onFarmSelect={handleFarmSelect} />;
    }

    return (
        <div className="p-4 md:p-8 min-h-screen bg-gray-50">
            <main className="max-w-7xl mx-auto">
                <Header userRole={userRole} userFarm={userFarm} />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <RecordForm 
                            key={editingRecord?.id || 'new'}
                            userRole={userRole}
                            userFarm={userFarm}
                            allRecords={allRecords}
                            editingRecord={editingRecord}
                            onSave={handleSaveRecord}
                            onCancelEdit={handleCancelEdit}
                            onSetMessage={handleSetMessage}
                        />
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                        <WeeklySummary
                             records={farmRecords}
                             filters={filters}
                        />

                        <HistorySection
                            records={farmRecords}
                            filteredRecords={filteredRecords}
                            filters={filters}
                            setFilters={setFilters}
                            userRole={userRole}
                            onEdit={setEditingRecord}
                            onDelete={setDeletingRecord}
                            onDownload={handleDownload}
                        />
                    </div>
                </div>

                {deletingRecord && (
                    <ConfirmationModal
                        recordInfo={deletingRecord}
                        onCancel={() => setDeletingRecord(null)}
                        onConfirm={confirmDelete}
                    />
                )}
                 {message && (
                    <div className="fixed bottom-5 right-5 z-50">
                        <div className={`px-6 py-3 rounded-lg shadow-lg text-white font-semibold ${message.type === 'success' ? 'bg-green-500' : message.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>
                           {message.text}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;