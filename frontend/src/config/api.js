// API Configuration for production readiness
// Change this to your production URL when deploying

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
    BASE: API_BASE_URL,
    API_V1: `${API_BASE_URL}/api/v1`,
    
    // Analysis endpoints
    ANALYSIS: `${API_BASE_URL}/api/v1/analysis`,
    ANALYSIS_UPLOAD: `${API_BASE_URL}/api/v1/analysis/upload`,
    
    // Live endpoints
    LIVE: `${API_BASE_URL}/api/v1/live`,
    LIVE_WS: (callId, agentId) => `ws://${API_BASE_URL.replace(/^https?:\/\//, '')}/api/v1/live/ws/${callId}/${agentId}`,
    
    // SOP endpoints
    SOP: `${API_BASE_URL}/api/v1/sop`,
    
    // Agent endpoints
    AGENT: `${API_BASE_URL}/api/v1/agent`,
    
    // Buddy endpoints
    BUDDY: `${API_BASE_URL}/api/v1/buddy`,
    
    // Recommendations endpoints
    RECOMMENDATIONS: `${API_BASE_URL}/api/v1/recommendations`,
    
    // Coaching endpoints
    COACHING: `${API_BASE_URL}/api/v1/coaching`,
};

export default API_ENDPOINTS;
