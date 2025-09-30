
import React from 'react';
import { UserRole } from '../types';

interface HeaderProps {
    userRole: UserRole;
    userFarm: string;
}

const Header: React.FC<HeaderProps> = ({ userRole, userFarm }) => {
    return (
        <header className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-green-700">Daily Record of Breeder Farm</h1>
            <p className="text-lg text-gray-500 mt-1">Mortality, Feed, and Water Intake Tracking (Growing Period)</p>
            <p className="text-sm font-semibold text-gray-600 mt-2">
                Logged in as: <span className="text-green-800">{userRole}</span> at <span className="text-green-800">{userFarm}</span>
            </p>
        </header>
    );
};

export default Header;
