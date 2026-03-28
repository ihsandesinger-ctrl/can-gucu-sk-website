
import React from 'react';
import type { Fixture } from '../types';

interface FixtureTableProps {
    data: Fixture;
}

const FixtureTable: React.FC<FixtureTableProps> = ({ data }) => {
    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
            <table className="w-full min-w-[600px] md:min-w-full">
                <thead className="bg-[#267d87] text-white">
                    <tr>
                        <th className="p-3 md:p-4 text-left font-semibold text-xs md:text-sm uppercase tracking-wider">TARİH</th>
                        <th className="p-3 md:p-4 text-left font-semibold text-xs md:text-sm uppercase tracking-wider">RAKİP</th>
                        <th className="p-3 md:p-4 text-center font-semibold text-xs md:text-sm uppercase tracking-wider">SKOR</th>
                        <th className="p-3 md:p-4 text-center font-semibold text-xs md:text-sm uppercase tracking-wider">KONUM</th>
                    </tr>
                </thead>
                <tbody>
                    {data.matches.map((match, index) => (
                        <tr key={index} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                            <td className="p-3 md:p-4 text-gray-600 text-sm whitespace-nowrap">{formatDate(match.date)}</td>
                            <td className="p-3 md:p-4 text-gray-900 font-medium text-sm">{match.opponent}</td>
                            <td className="p-3 md:p-4 text-center text-gray-900 font-bold text-sm">{match.score}</td>
                            <td className="p-3 md:p-4 text-center">
                                <span className={`px-2 md:px-3 py-1 text-[10px] md:text-xs font-bold rounded-full uppercase ${match.location === 'Ev' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                    {match.location}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FixtureTable;
