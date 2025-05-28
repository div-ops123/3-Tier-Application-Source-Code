// const API_URL = process.env.REACT_APP_API_URL?.trim() || 'http://localhost:8000/api';
const API_URL = process.env.REACT_APP_API_URL?.trim() || "/api";
if (!process.env.REACT_APP_API_URL) {
  console.warn("REACT_APP_API_URL not set, defaulting to /api");
}

export default API_URL;
