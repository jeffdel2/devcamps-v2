import * as dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { verifyJwt } from './verifyJwt.js';
import getAudience from './getAudience.js';

import { existsSync } from 'fs';
import bodyParser from 'body-parser';
import config from '../config.js';
import * as db from './sqlite.js';

export const loadEnv = (options) => {
	if (existsSync('.env.local')) {
		dotenv.config({ path: `.env.local`, ...options });
	}

	dotenv.config(options);
};

loadEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { auth, server } = config || {};

const { SERVER_AUTH_PERMISSIONS: AUTH_PERMISSIONS = server?.permissions || [] } = process.env;

const permissions = Array.isArray(AUTH_PERMISSIONS) ? AUTH_PERMISSIONS : AUTH_PERMISSIONS.split(' ');

import data from '../db/data.json';

const app = express();

app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(helmet());
app.use(express.static(join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/api/public', (req, res) => {
	res.json({
		success: true,
		message: 'This is the Public API. Anyone can request this response. Hooray!',
	});
});

app.get('/api/private', verifyJwt({ audience: getAudience(server?.audience || auth?.audience) }), (req, res) =>
	res.json({
		success: true,
		message:
			'This is the private API. Only special folk, indicated by the `audience` configuration, can access it. Awesome!',
	})
);

app.get('/api/scoped', verifyJwt({ claimsToAssert: { 'permissions.includes': permissions } }), (req, res) =>
	res.json({
		success: true,
		message:
			'This is the scoped API. Only a valid access token with both the correct audience AND valid permissions has access. You did it!',
	})
);

app.get('/db/read', verifyJwt({ claimsToAssert: { 'permissions.includes': permissions } }), (req, res) =>
	res.json({
		success: true,
		message:
			'Reading from database backend',
	})
);

app.post('/db/write', verifyJwt({ claimsToAssert: { 'permissions.includes': permissions } }), async (req, res) => {

	const dbCreate = await db.processCreate();

	let crmUser = dbCreate[0].crm_user_id;
	console.log("CRM ID", crmUser);

	res.json({
		success: true,
		crm_id: crmUser,
		message:
			'CRM User has been created',
	})
});

app.post('/db/test/write', async (req, res) => {

	console.log("REQ", req.body.email);

	let userEmail = {
		email: req.body.email
	}

	const dbCreate = await db.processCreate();

	let crmUser = dbCreate[0].crm_user_id;
	console.log("CRM ID", crmUser);

	res.json({
		success: true,
		crm_id: crmUser,
		message:
			'CRM User has been created',
	})

});

app.get('/db/test', async (req, res) => {

	const dbPayload = await db.getOptions();

	let crmUser = dbPayload[0].crm_user_id;
	console.log("CRM ID", crmUser);

	return res.send({ "crmuser": crmUser })

});

// testing testing again
// app.all('*', (req, res) => res.json({ success: true, message: 'This is the home route for this API server!' }))

export const handler = app;
