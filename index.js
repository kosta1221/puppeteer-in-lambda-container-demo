require("dotenv").config();
const { getFileNameBasedOnDate, uploadFileToS3 } = require("./utils");

const chromium = require("chrome-aws-lambda");
const { addExtra } = require("puppeteer-extra");
const puppeteerExtra = addExtra(chromium.puppeteer);
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteerExtra.use(AdblockerPlugin());

const lambdaHandler = async (event = { url: "https://www.kostak.co" }, context) => {
	const executablePath = await chromium.executablePath;
	console.log(`executable path: ${executablePath}`);

	const browser = await puppeteerExtra.launch({
		args: chromium.args,
		defaultViewport: { width: +process.env.WIDTH, height: +process.env.HEIGHT },
		executablePath,
		headless: chromium.headless,
	});

	const page = await browser.newPage();

	let s3Url = "";
	try {
		console.log(event.url);
		await page.goto(event.url, {
			waitUntil: ["networkidle2"],
			timeout: 20000,
		});

		const fileNameBasedOnDate = getFileNameBasedOnDate();
		const path = executablePath
			? `/tmp/${fileNameBasedOnDate}.png`
			: `./local/images/${fileNameBasedOnDate}.png`;
		const s3Path = `${fileNameBasedOnDate}.webp`;

		await page.screenshot({ path });

		s3Url = await uploadFileToS3(path, s3Path);
	} catch (error) {
		console.error(error);
	} finally {
		await page.close();
		await browser.close();
	}
	return s3Url;
};

module.exports.lambdaHandler = lambdaHandler;
