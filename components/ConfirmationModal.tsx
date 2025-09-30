
import React from 'react';

interface ConfirmationModalProps {
    recordInfo: { id: string; date: string; houseName: string; };
    onCancel: () => void;
    onConfirm: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ recordInfo, onCancel, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full transform transition-all duration-300">
                <h3 className="text-xl font-bold text-red-600 mb-3">Confirm Deletion</h3>
                <p className="text-gray-600 mb-6">
                    Are you sure you want to permanently delete the record for <strong>{recordInfo.houseName} on {recordInfo.date}</strong>?
                </p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition duration-150 ease-in-out">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
