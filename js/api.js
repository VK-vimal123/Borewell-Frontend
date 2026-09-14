// API Client for Sri Vellingiri Engineering Works

const API = {
  get baseUrl() {
    if (window.EMAILJS_CONFIG && window.EMAILJS_CONFIG.apiBaseUrl) {
      return window.EMAILJS_CONFIG.apiBaseUrl;
    }
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:5000/api';
    }
    return 'https://borewell-be.vercel.app/api';
  },

  // Helper for safe JSON responses
  async _safeJson(res) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      return {
        success: res.ok,
        message: res.ok ? 'Success' : `Request failed with status ${res.status}`
      };
    }
  },

  // Check health and MongoDB connection
  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (!res.ok) throw new Error('Health check failed');
      return await this._safeJson(res);
    } catch (err) {
      console.warn('API Health check warning:', err.message);
      return { status: 'offline', database: { isConnected: false } };
    }
  },

  // Fetch Services from backend
  async getServices() {
    try {
      const res = await fetch(`${this.baseUrl}/services`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await this._safeJson(res);
      return data.data || [];
    } catch (err) {
      console.warn('API: Falling back to local services cache:', err.message);
      return this.getLocalServicesFallback();
    }
  },

  // Fetch Gallery Items from backend
  async getGallery(category = 'all') {
    try {
      const url = category && category !== 'all' 
        ? `${this.baseUrl}/gallery?category=${encodeURIComponent(category)}`
        : `${this.baseUrl}/gallery`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await this._safeJson(res);
      return data.data || [];
    } catch (err) {
      console.warn('API: Falling back to local gallery cache:', err.message);
      return this.getLocalGalleryFallback(category);
    }
  },

  // Submit Service Request to backend (MongoDB)
  async submitServiceRequest(formData) {
    try {
      const res = await fetch(`${this.baseUrl}/service-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await this._safeJson(res);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit request');
      }
      return data;
    } catch (err) {
      console.error('API Error submitting service request:', err);
      throw err;
    }
  },

  // Owner PIN Authentication
  async verifyOwnerPin(pin) {
    const cleanPin = String(pin || '').trim();
    const VALID_PINS = ['9344', 'admin123', '9344604042'];

    try {
      const res = await fetch(`${this.baseUrl}/gallery/verify-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin: cleanPin }),
      });

      const data = await this._safeJson(res);
      if (data && res.ok && data.success) {
        return data;
      }
      if (data && !res.ok && data.message) {
        throw new Error(data.message);
      }
    } catch (err) {
      console.warn('Backend PIN verification note:', err.message);
    }

    // Direct owner validation fallback
    if (VALID_PINS.includes(cleanPin)) {
      return {
        success: true,
        message: 'Owner authenticated successfully',
        ownerName: 'Nathan',
        token: 'owner_session_' + Date.now()
      };
    }

    throw new Error('Invalid Owner PIN. Please enter your registered workshop PIN.');
  },

  // Owner Upload Gallery Photo (FormData multipart)
  async uploadGalleryPhoto(formData) {
    try {
      const res = await fetch(`${this.baseUrl}/gallery/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await this._safeJson(res);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload photo');
      }
      return data;
    } catch (err) {
      console.error('API Error uploading photo:', err);
      throw err;
    }
  },

  // Owner Update Gallery Item
  async updateGalleryItem(id, payload) {
    try {
      const res = await fetch(`${this.baseUrl}/gallery/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await this._safeJson(res);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update gallery item');
      }
      return data;
    } catch (err) {
      console.error('API Error updating gallery item:', err);
      throw err;
    }
  },

  // Owner Delete Gallery Item
  async deleteGalleryItem(id) {
    try {
      const res = await fetch(`${this.baseUrl}/gallery/${id}`, {
        method: 'DELETE',
      });
      const data = await this._safeJson(res);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete gallery item');
      }
      return data;
    } catch (err) {
      console.error('API Error deleting gallery item:', err);
      throw err;
    }
  },

  // Local fallback data in case DB server is not yet booted
  getLocalServicesFallback() {
    return [
      {
        slug: 'lathe-works',
        icon: 'bi-gear-fill',
        image: 'assets/images/service-lathe.png',
        title: { en: 'Heavy Lathe Works', ta: 'கனரக லேத் வேலைகள்', hi: 'हैवी लेथ कार्य' },
        shortDescription: {
          en: 'Precision turning, facing, boring, spindle machining, and bearing seat restoration for borewell rig components.',
          ta: 'போர்வெல் ரிக் உதிரிபாகங்களுக்கான துல்லியமான டர்னிங், போரிங், ஸ்பிண்டில் மெஷினிங் மற்றும் பேரிங் சீட் சீரமைப்பு.',
          hi: 'बोरवेल रिग घटकों के लिए प्रिसिजन टर्निंग, बोरिंग, स्पिंडल मशीनिंग और बेयरिंग सीट रीस्टोरेशन।'
        },
        features: {
          en: ['Spindle & shaft turning', 'Precision boring', 'Bearing seat sleeves', 'Custom bolt & thread cutting'],
          ta: ['நீண்ட ஷாப்ட் டர்னிங்', 'உள் & வெளி போரிங்', 'பேரிங் ஸ்லீவ் தயாரிப்பு', 'தனிப்பயன் த்ரெட் கட்டிங்'],
          hi: ['शाफ्ट एवं स्पिंडल टर्निंग', 'प्रिसिजन बोरिंग', 'बेयरिंग स्लीव निर्माण', 'कस्टम थ्रेड कटिंग']
        }
      },
      {
        slug: 'welding-works',
        icon: 'bi-fire',
        image: 'assets/images/service-welding.png',
        title: { en: 'Rig Welding & Fabrication', ta: 'ரிக் வெல்டிங் மற்றும் ஃபேப்ரிகேஷன்', hi: 'रिग वेल्डिंग एवं फैब्रिकेशन' },
        shortDescription: {
          en: 'Heavy structural welding, mast crack repair, chassis reinforcement, and hardfacing for abrasive wear protection.',
          ta: 'கனரக கட்டமைப்பு வெல்டிங், மாஸ்ட் விரிசல் பழுது, சேஸ் வலுவூட்டல் மற்றும் தேய்மான பாதுகாப்பு வெல்டிங்.',
          hi: 'भारी संरचनात्मक वेल्डिंग, मास्ट क्रैक रिपेयर, चेसिस सुदृढ़ीकरण और हार्डफेसिंग वेल्डिंग।'
        },
        features: {
          en: ['Mast & derrick welding', 'Chassis reinforcement', 'Wear-resistant hardfacing', 'Heavy bracket fabrication'],
          ta: ['மாஸ்ட் கட்டமைப்பு வெல்டிங்', 'சேஸ் வலுவூட்டல்', 'தேய்மான தடுப்பு ஹார்ட்பேசிங்', 'கனரக பிராக்கெட் தயாரிப்பு'],
          hi: ['மாஸ்ட் संरचनात्मक वेल्डिंग', 'चेसिस रीइन्फोर्समेंट', 'घिसाव रोधी हार्डफेसिंग', 'हैवी ब्रैकेट फैब्रिकेशन']
        }
      },
      {
        slug: 'borewell-rig-service',
        icon: 'bi-truck',
        image: 'assets/images/Complete Borewel/lorry1.png',
        title: { en: 'Borewell Rig Overhaul', ta: 'போர்வெல் ரிக் முழு சர்வீஸ்', hi: 'बोरवेल रिग ओवरहाल सर्विस' },
        shortDescription: {
          en: 'Complete hydraulic mast overhaul, rotary head rebuild, winch drum servicing, and guide rail alignment.',
          ta: 'ஹைட்ராலிக் மாஸ்ட் சீரமைப்பு, ரோட்டரி ஹெட் பழுது, வின்ச் டிரம் மற்றும் கைடு ரெயில் சர்வீஸ்.',
          hi: 'हाइड्रोलिक मास्ट ओवरहाल, रोटरी हेड रीबिल्ड, विंच ड्रम सर्विस और गाइड रेल एलाइनमेंट।'
        },
        features: {
          en: ['Rotary head gearbox overhaul', 'Hydraulic cylinder repacking', 'Mast leveling & guide rails', 'Winch drum servicing'],
          ta: ['ரோட்டரி ஹெட் கியர்பாக்ஸ் சர்வீஸ்', 'ஹைட்ராலிக் சிலிண்டர் பேக்கிங்', 'மாஸ்ட் சீரமைப்பு', 'வின்ச் மற்றும் கயிறு பராமரிப்பு'],
          hi: ['रोटरी हेड ओवरहाल', 'हाइड्रोलिक सिलेंडर रिपैकिंग', 'मास्ट लेवलिंग', 'विंच मेंटेनेंस']
        }
      },
      {
        slug: 'drilling-rod-works',
        icon: 'bi-tools',
        image: 'assets/images/Complete Borewel/rod1.png',
        title: { en: 'Drilling Rod Works & Threading', ta: 'டிரில்லிங் ராடு வேலைகள் & த்ரெட்டிங்', hi: 'ड्रिलिंग रॉड कार्य एवं थ्रेडिंग' },
        shortDescription: {
          en: 'API regular and IF thread re-cutting, friction welded tool joint repair, rod straightening, and sub adapters.',
          ta: 'ஏபிஐ த்ரெட் ரீ-கட்டிங், டூல் ஜாய்ன்ட் பழுது, ராடு நேராக்குதல் மற்றும் அடாப்டர் தயாரிப்பு.',
          hi: 'एपीआई थ्रेड री-कटिंग, टूल जॉइंट रिपेयर, रॉड सीधा करना और सब-अडैप्टर निर्माण।'
        },
        features: {
          en: ['API Reg / IF thread machining', 'Hydraulic rod bend straightening', 'Friction joint repair', 'Custom bit crossover subs'],
          ta: ['துல்லியமான API த்ரெட் கட்டிங்', 'ஹைட்ராலிக் ராடு நேராக்குதல்', 'ஜாய்ன்ட் ஸ்லீவ் வெல்டிங்', 'கிராஸ்ஓவர் அடாப்டர்கள்'],
          hi: ['एपीआई थ्रेड मशीनिंग', 'हाइड्रोलिक रॉड सीधा करना', 'जॉइंट स्लीव वेल्डिंग', 'कस्टम बिट अडैप्टर']
        }
      }
    ];
  },

  getLocalGalleryFallback(category) {
    const list = [
      {
        title: { en: 'Heavy-Duty Lathe Turning Area', ta: 'கனரக லேத் டர்னிங் பகுதி', hi: 'हैवी लेथ टर्निंग सेक्शन' },
        category: 'workshop',
        imageUrl: 'assets/images/gallery-lathe-1.png',
        description: { en: 'Precision machining of rotary head drive spindle on heavy bed lathe.', ta: 'ரோட்டரி ஹெட் டிரைவ் ஸ்பிண்டில் துல்லியமாக மெஷினிங் செய்தல்.', hi: 'रोटरी हेड ड्राइव स्पिंडल की प्रिसिजन मशीनिंग।' }
      },
      {
        title: { en: 'Rig Mast Lattice Structural Welding', ta: 'ரிக் மாஸ்ட் கட்டமைப்பு வெல்டிங்', hi: 'रिग मास्ट संरचनात्मक वेल्डिंग' },
        category: 'welding',
        imageUrl: 'assets/images/gallery-welding-1.png',
        description: { en: 'Reinforcing heavy cross braces on drill rig mast.', ta: 'ரிக் மாஸ்டில் உயர்தர ஆர்க் வெல்டிங் வேலைகள்.', hi: 'ड्रिल रिग मास्ट पर स्ट्रक्चरल वेल्डिंग।' }
      },
      {
        title: { en: 'Truck-Mounted Borewell Rig Servicing', ta: 'லாரி போர்வெல் ரிக் சர்வீஸ் பணித்தளம்', hi: 'ट्रक-माउंटेड बोरवेल रिग सर्विस' },
        category: 'rig',
        imageUrl: 'assets/images/gallery-rig-1.svg',
        description: { en: 'Hydraulic cylinder overhaul and mast alignment in workshop bay.', ta: 'ஹைட்ராலிக் சிலிண்டர் சீரமைப்பு மற்றும் மாஸ்ட் அலைன்மென்ட் பணிகள்.', hi: 'हाइड्रोलिक सिलेंडर ओवरहाल और मास्ट एलाइनमेंट कार्य।' }
      },
      {
        title: { en: '4.5" & 6" Drill Rod Threading & Inspection', ta: '4.5" & 6" டிரில்லிங் ராடு த்ரெட் கட்டிங்', hi: '4.5" और 6" ड्रिलिंग रॉड थ्रेडिंग' },
        category: 'drilling_rods',
        imageUrl: 'assets/images/uploads/rod2.png',
        description: { en: 'API thread cutting on hardened drill pipe tool joints.', ta: 'டிரில்லிங் பைப்புகளில் துல்லியமான API த்ரெட் வெட்டுதல்.', hi: 'ड्रिल पाइप्स पर सटीक एपीआई थ्रेड कटिंग।' }
      },
      {
        title: { en: 'High-Pressure Compressor Maintenance', ta: 'உயர் அழுத்த கம்ப்ரஸர் பராமரிப்பு', hi: 'हाई-प्रेशर कंप्रेसर मेंटेनेंस' },
        category: 'compressor',
        imageUrl: 'assets/images/gallery-compressor-1.svg',
        description: { en: 'Screw compressor air-end alignment and valve inspection.', ta: 'ஸ்க்ரூ கம்ப்ரஸர் ஏர்-எண்ட் அலைன்மென்ட் மற்றும் ஆய்வு.', hi: 'स्क्रू कंप्रेसर एयर-एंड एलाइनमेंट और वाल्व इंस्पेक्शन।' }
      },
      {
        title: { en: 'Workshop Machine Shop & Tooling Bay', ta: 'பட்டறை இயந்திர தளம்', hi: 'वर्कशॉप मशीन शॉप फ्लोर' },
        category: 'workshop',
        imageUrl: 'assets/images/Complete Borewel/resent1.png',
        description: { en: 'Spacious workshop floor equipped with overhead cranes.', ta: 'ஓவர்ஹெட் கிரேன் வசதி கொண்ட விசாலமான பட்டறை தளம்.', hi: 'ओवरहेड क्रेन युक्त विस्तृत वर्कशॉप फ्लोर।' }
      },
      {
        title: { en: 'Hardfacing on Rig Stabilizer Pads', ta: 'ரிக் ஸ்டெபிலைசர் பேட்களில் ஹார்ட்பேசிங்', hi: 'रिग स्टेबलाइजर पैड्स पर हार्डफेसिंग' },
        category: 'welding',
        imageUrl: 'assets/images/gallery-welding-2.svg',
        description: { en: 'Wear-resistant hardfacing electrode deposit on ground pads.', ta: 'ஸ்டெபிலைசர் பேட்களில் தேய்மான எதிர்ப்பு வெல்டிங்.', hi: 'स्टेबलाइजर पैड्स पर घिसाव रोधी वेल्डिंग।' }
      },
      {
        title: { en: 'Hydraulic Rotary Head Assembly Rebuild', ta: 'ஹைட்ராலிக் ரோட்டரி ஹெட் சீரமைப்பு', hi: 'हाइड्रोलिक रोटरी हेड रीबिल्ड' },
        category: 'rig',
        imageUrl: 'assets/images/gallery-rig-2.svg',
        description: { en: 'High torque motor mounting, oil seal & bearing fitting.', ta: 'ரோட்டரி மோட்டார் பொருத்துதல் மற்றும் ஆயில் சீல் மாற்றம்.', hi: 'हाई टॉर्क मोटर माउंटिंग और बेयरिंग फिटिंग।' }
      },
      {
        title: { en: 'Drill Pipe Crossover Adapter Subs', ta: 'டிரில் பைப் கிராஸ்ஓவர் அடாப்டர் சப்', hi: 'ड्रिल पाइप क्रॉसओवर अडैप्टर सब' },
        category: 'drilling_rods',
        imageUrl: 'assets/images/gallery-rods-2.svg',
        description: { en: 'Precision manufactured transition and saver subs.', ta: 'பிரத்யேக டிரான்சிஷன் மற்றும் சேவர் சப் தயாரிப்பு.', hi: 'निर्मित ट्रांजिशन और सेवर सब अडैप्टर।' }
      },
      {
        title: { en: 'Compressor Valve Bank & Intercooler Test', ta: 'கம்ப்ரஸர் வால்வு பேங்க் சோதனை', hi: 'कंप्रेसर वाल्व टेस्टिंग' },
        category: 'compressor',
        imageUrl: 'assets/images/gallery-compressor-2.svg',
        description: { en: 'Pressure testing of safety relief valves and intercooler coils.', ta: 'அழுத்த பாதுகாப்பு வால்வுகள் சோதனை செய்தல்.', hi: 'सुरक्षा वाल्व का हाइड्रोस्टैटिक प्रेशर टेस्ट।' }
      }
    ];

    if (category && category !== 'all') {
      return list.filter(item => item.category === category);
    }
    return list;
  }
};
