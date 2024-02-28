const defaultAuthConfig = {
	cacheLocation: 'localstorage',
};

const config = {
	auth: {
		...defaultAuthConfig,
		domain: 'myorg.cic-demo-platform.auth0app.com',
		clientId: 'L5w1HedRLFdI51nFcDxffl8JVFVf3Fgq',
		// UNCOMMENT the following line to test the private API
		// audience: ['api://authrocks/'],
	},
	app: {
		enableSilentAuth: false,
		port: 3000,
	},
	server: {
		permissions: ['authRocks'],
	},
};

export default config;
