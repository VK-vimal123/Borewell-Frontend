// Sri Vellingiri Engineering Works - Frontend Configuration
// Keys and API URLs

window.EMAILJS_CONFIG = {
  publicKey:  "htT5-m-vYCQt7qLOt",
  serviceId:  "service_fifq1xu",
  templateId: "template_m15dyg3",
  // Backend API URL: Points to live Vercel backend or local server during testing
  apiBaseUrl: (typeof window !== 'undefined' && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"))
    ? "http://localhost:5000/api" 
    : "https://borewell-be.vercel.app/api"
};
