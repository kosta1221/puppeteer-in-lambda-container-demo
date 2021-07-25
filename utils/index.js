require("dotenv").config();
const fs = require("fs");
const AWS = require("aws-sdk");
const sharp = require("sharp");
const { DateTime } = require("luxon");
const CONSOLE_RED = "\x1b[31m%s\x1b[0m";

const getFileNameBasedOnDate = () => {
	const dateTime = DateTime.fromObject({ zone: process.env.TIME_ZONE });

	const fileNameBasedOnDate = dateTime.toFormat("yyyy-MM-dd_HH-mm");

	return fileNameBasedOnDate;
};

const s3 = new AWS.S3({
	accessKeyId: process.env.S3_ACCESS_KEY_ID,
	secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
});

const uploadFileToS3 = async (filePath, s3Path) => {
	try {
		// Read content from the file
		const fileContent = fs.readFileSync(filePath);

		// Converts the image to webp
		const data = await sharp(fileContent).webp().toBuffer();

		const params = {
			Bucket: process.env.BUCKET_NAME,
			Key: s3Path, // File name you want to save as in S3
			Body: data,
		};

		// Setting up S3 upload parameters
		return new Promise(async (resolve, reject) => {
			try {
				// Uploading files to the bucket
				s3.upload(params, function (err, data) {
					if (err) {
						throw err;
					}
					console.log(CONSOLE_RED, `File uploaded successfully. ${data.Location}`);
					resolve(data.Location);
				});
			} catch (error) {
				reject(error);
			}
		});
	} catch (error) {
		console.error(error);
	}
};

module.exports = { uploadFileToS3, getFileNameBasedOnDate };
