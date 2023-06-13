import cheerio from 'cheerio';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import fetch from 'node-fetch';
import nodeHtmlToImage from 'node-html-to-image';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/:dag.jpeg', async function (req, res) {
	const { dag } = req.params;
	if (!fs.existsSync(`./grasspop-${dag}.jpeg`)) await downloadDag(dag);
	res.sendFile(`./grasspop-${dag}.jpeg`, { root: __dirname });
});

app.listen(process.env.PORT || 5000);

async function downloadDag(dag) {
	var url = `https://www.graspop.be/nl/line-up/${dag}/print`;

	//Fetch the website
	const response = await fetch(url);

	//Get the HTML as text
	const body = await response.text();

	//Load the HTML into cheerio
	const $ = cheerio.load(body);

	//Remove popup
	$('script').remove();
	$('.header').remove();
	$('style').append(
		'.page { margin-top: 0 !important; top: 40px !important; } body { padding: 0; margin: 0; }'
	);

	//Remove the header
	const html = $.html();

	//Convert the HTML to an image
	await nodeHtmlToImage({
		quality: 100,
		type: 'jpeg',
		html: html,
		puppeteerArgs: {
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
			headless: true,
			defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 4 },
		},
		output: `./grasspop-${dag}.jpeg`,
	});
}
