
import React from 'react';
import type { SiteSettings } from '../types';

interface ContactPageProps {
    siteSettings: SiteSettings;
}

const ContactPage: React.FC<ContactPageProps> = ({ siteSettings }) => {
    // Construct map query from address or fallback
    const mapQuery = siteSettings.address 
        ? encodeURIComponent(siteSettings.address) 
        : encodeURIComponent("Çan, Çanakkale");

    return (
        <div className="bg-gray-50 py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-800">İletişim</h1>
                    <p className="text-lg text-gray-600 mt-2">Bize ulaşın, sorularınızı yanıtlamaktan memnuniyet duyarız.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    {/* Contact Info */}
                    <div className="bg-white p-8 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">İletişim Bilgileri</h2>
                        <div className="space-y-4 text-gray-700">
                            {siteSettings.address && (
                                <div className="flex items-start">
                                    <i className="fas fa-map-marker-alt text-[var(--primary-color)] mt-1 mr-4"></i>
                                    <div>
                                        <h3 className="font-semibold">Adres</h3>
                                        <p>{siteSettings.address}</p>
                                    </div>
                                </div>
                            )}
                             {siteSettings.email && (
                                <div className="flex items-start">
                                    <i className="fas fa-envelope text-[var(--primary-color)] mt-1 mr-4"></i>
                                    <div>
                                        <h3 className="font-semibold">E-posta</h3>
                                        <p>{siteSettings.email}</p>
                                    </div>
                                </div>
                             )}
                            {siteSettings.phone && (
                                <div className="flex items-start">
                                    <i className="fas fa-phone text-[var(--primary-color)] mt-1 mr-4"></i>
                                    <div>
                                        <h3 className="font-semibold">Telefon</h3>
                                        <p>{siteSettings.phone}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Google Map */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden h-96">
                        <iframe 
                            width="100%" 
                            height="100%" 
                            frameBorder="0" 
                            style={{ border: 0 }}
                            src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                            allowFullScreen
                            title="Konum Haritası"
                        ></iframe>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
