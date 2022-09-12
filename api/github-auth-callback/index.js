/**
 * @file github auth callback
 * @author netcon
 */

const got = require('got');

const HOST_NAME = 'github.paypal.com';
const CLIENT_ID = '47c7a48b91fd42410b0d';
const CLIENT_SECRET = '6e578e8ce9d3ff1b31766051ec472f5205956f6e';
// allow origins should split by ','
const ALLOWED_ORIGINS = 'http://localhost:5000';

// return the data to the opener window by postMessage API,
// and close current window then
const getResponseHtml = (dataStr) => `
<script>
'${ALLOWED_ORIGINS}'.split(',').forEach(function(allowedOrigin) {
	window.opener.postMessage(${dataStr}, allowedOrigin);
});
setTimeout(() => window.close(), 50);
</script>
`;

const MISSING_CODE_ERROR = {
	error: 'request_invalid',
	error_description: 'Missing code',
};
const UNKNOWN_ERROR = {
	error: 'internal_error',
	error_description: 'Unknown error',
};

module.exports = async (req, res) => {
	const code = req.query.code;
	const sendResponseHtml = (status, data) => {
		res.writeHead(status);
		const responseData = { type: 'authorizing', payload: data };
		res.write(getResponseHtml(JSON.stringify(responseData)));
		console.log(getResponseHtml(JSON.stringify(responseData)));
		res.end();
	};

	if (!code) {
		return sendResponseHtml(401, MISSING_CODE_ERROR);
	}

	try {
		// https://docs.github.com/en/developers/apps/authorizing-oauth-apps#2-users-are-redirected-back-to-your-site-by-github
		const response = await got.post('https://github.paypal.com/login/oauth/access_token', {
			json: { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code },
			responseType: 'json',
		});
		return sendResponseHtml(response.statusCode, response.body);
	} catch (e) {
		// the error is responded by GitHub
		if (e.response) {
			return sendResponseHtml(e.response.statusCode, e.response.body);
		}
		return sendResponseHtml(500, UNKNOWN_ERROR);
	}
};
