export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const API_ROUTES = {
	login: '/users/login',
	signup: '/users/signup',
	sessions: '/users/research_sessions',
	exportEvents: '/users/export_events',
	runResearch: '/users/run_research_agent',
	runResearchStream: '/users/run_research_agent/stream',
} as const;
