// Sri Vellingiri Engineering Works - Frontend Configuration
// Keys and API URLs

window.EMAILJS_CONFIG = {
  publicKey:  "htT5-m-vYCQt7qLOt",
  serviceId:  "service_fifq1xu",
  templateId: "template_m15dyg3",
  // Backend API URL (defaults to /api for same-origin or localhost:5000/api when testing cross-origin)
  apiBaseUrl: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
    ? "http://localhost:5000/api" 
    : "/api"
};
