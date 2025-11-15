
import React from 'react';
import type { Fixture } from '../types';

interface FixtureTableProps {
    data: Fixture;
}

const FixtureTable: React.FC<FixtureTableProps> = ({ data }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
                <thead className="bg-[#267d87] text-white">
                    <tr>
                        <th className="p-4 text-left font-semibold text-sm">TARİH</th>
                        <th className="p-4 text-left font-semibold text-sm">RAKİP</th>
                        <th className="p-4 text-center font-semibold text-sm">SKOR</th>
                        <th className="p-4 text-center font-semibold text-sm">KONUM</th>
                    </tr>
                </thead>
                <tbody>
                    {data.matches.map((match, index) => (
                        <tr key={index} className="border-b border-gray-200 last:border-b-0">
                            <td className="p-4 text-gray-700">{match.date}</td>
                            <td className="p-4 text-gray-900 font-medium">{match.opponent}</td>
                            <td className="p-4 text-center text-gray-900 font-bold">{match.score}</td>
                            <td className="p-4 text-center">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${match.location === 'Ev' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
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
