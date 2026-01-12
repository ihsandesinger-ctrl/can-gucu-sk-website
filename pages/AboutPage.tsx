import React from 'react';
import type { StaffMember, MissionVision } from '../types';

interface AboutPageProps {
  staff: StaffMember[];
  content: MissionVision;
}

const AboutPage: React.FC<AboutPageProps> = ({ staff, content }) => {
  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-800">Hakkımızda</h1>
          <p className="text-lg text-gray-600 mt-2">ÇANGÜCÜ SK: Bir Kulüpten Daha Fazlası</p>
        </div>

        {/* Misyon & Vizyon */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-orange-600 mb-4">Misyonumuz</h2>
            <p className="text-gray-700 leading-relaxed">{content.mission}</p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#267d87] mb-4">Vizyonumuz</h2>
            <p className="text-gray-700 leading-relaxed">{content.vision}</p>
          </div>
        </section>

        {/* Yönetim ve Teknik Ekip */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Yönetim ve Teknik Ekip</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {staff.map((member) => (
              <div key={member.id} className="text-center">
                <img src={member.imageUrl} alt={member.name} className="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-lg" />
                <h3 className="font-bold text-lg text-gray-900">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;