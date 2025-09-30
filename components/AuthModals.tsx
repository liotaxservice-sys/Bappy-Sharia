
import React from 'react';
import { UserRole } from '../types';
import { STATIC_FARM_LIST } from '../constants';

interface AuthModalsProps {
    userRole: UserRole | null;
    onRoleSelect: (role: UserRole) => void;
    onFarmSelect: (farm: string) => void;
}

const AuthModals: React.FC<AuthModalsProps> = ({ userRole, onRoleSelect, onFarmSelect }) => {
    if (!userRole) {
        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg w-full transform transition-all duration-300 text-center">
                    <h3 className="text-2xl font-bold text-green-700 mb-4">Welcome to Breeder Farm Log</h3>
                    <p className="text-gray-600 mb-6">Please select your role. This choice will be saved locally.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => onRoleSelect('Worker')} className="bg-gray-200 text-gray-800 hover:bg-gray-300 py-3 rounded-lg font-semibold">Worker</button>
                        <button onClick={() => onRoleSelect('Supervisor')} className="bg-blue-500 text-white hover:bg-blue-600 py-3 rounded-lg font-semibold">Supervisor</button>
                        <button onClick={() => onRoleSelect('Manager')} className="bg-purple-600 text-white hover:bg-purple-700 py-3 rounded-lg font-semibold">Manager</button>
                        <button onClick={() => onRoleSelect('Boss')} className="bg-red-600 text-white hover:bg-red-700 py-3 rounded-lg font-semibold">Boss</button>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">You will only see this screen once.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg w-full transform transition-all duration-300 text-center">
                <h3 className="text-2xl font-bold text-green-700 mb-4">Select Farm Location</h3>
                <p className="text-gray-600 mb-6">Which farm are you working on today?</p>
                <div className="grid grid-cols-2 gap-4">
                    {STATIC_FARM_LIST.map(farm => (
                        <button key={farm} onClick={() => onFarmSelect(farm)} className="bg-green-500 text-white hover:bg-green-600 py-3 rounded-lg font-semibold">{farm}</button>
                    ))}
                </div>
                <p className="text-xs text-gray-400 mt-4">This choice will filter all data to your selected farm.</p>
            </div>
        </div>
    );
};

export default AuthModals;
