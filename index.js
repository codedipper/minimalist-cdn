const { port, pswd, filelength } = require("./config");
const gencode = require("@codedipper/random-code");
const { IncomingForm } = require("formidable");
const express = require("express");
const {
	readdirSync,
	writeFileSync,
	readFileSync,
	existsSync,
	rmSync
} = require("fs");

const app = express();
app.use(express.static("./files/"));

app.get("/", (req, res) => {
	const files = readdirSync("./files/");
	let fs = "";

	for (let i = 0; i < files.length; i++) {
		fs += `<a href="${files[i]}">/${files[i]}</a><br>`;
	}

	res.write(fs);
	res.write("<p>To upload, go <a href=\"/upload\">here</a>!</p>");
	res.write("<p>To delete, go <a href=\"/delete\">here</a>!</p>");
	res.end();
});

app.get("/upload", (req, res) => {
	res.send(`
    <form action="/send" method="post" enctype="multipart/form-data">
        <input type="file" name="file"><br>
        <input type="password" name="password" placeholder="Password">
        <input type="submit">
    </form>
    `);
	res.end();
});

app.get("/delete", (req, res) => {
	res.send(`
    <form action="/remove" method="post">
        <input type="text" name="filename" placeholder="File Name"><br>
		<input type="password" name="password" placeholder="Password">
        <input type="submit">
    </form>
    `);
	res.end();
});

app.post("/remove", (req, res) => {
	const form = new IncomingForm();

	form.parse(req, (err, fields, files) => {
		if (err){
			res.status(500).send("Internal Server Error");
		}

		if (fields.password !== pswd || fields.password == undefined){
			res.write("<p>Provide a valid password.</p>");
			res.write("<a href=\"/\">Go back to home.</a>");
			res.end();
			return;
		}

		if (fields.filename == undefined ||
			!existsSync(`./files/${fields.filename}`)){
				res.write("<p>Provide a valid file.</p>");
				res.write("<a href=\"/\">Go back to home.</a>");
				res.end();
				return;
		}

		if (fields.filename.includes("..") || fields.filename.includes("/")){
				res.write("<p>Whoa, I see you trying to break my server.</p>");
				res.write("<p>Write the file name without `.` or `/`.</p>");
				res.write("<a href=\"/\">Go back to home.</a>");
				res.end();
				return;
		}

		
		rmSync(`./files/${fields.filename}`);

		res.write("<p>Success!</p>");
		res.write("<a href=\"/\">Go back to home.</a>");
		res.end();
	});
});

app.post("/send", (req, res) => {
	const form = new IncomingForm();

	form.parse(req, (err, fields, files) => {
		if (err) {
			res.status(500).send("Internal Server Error");
			return;
		}

		if (fields.password !== pswd || fields.password == undefined) {
			res.write("<p>Provide a valid password.</p>");
			res.write("<a href=\"/\">Go back to home.</a>");
			res.end();
			return;
		}

		if (files.file == undefined) {
			res.write("<p>Provide a file.</p>");
			res.write("<a href=\"/\">Go back to home.</a>");
			res.end();
			return;
		}

		let code = gencode(filelength);
		let nf = `${code}.${files.file.name.split(".")[1] || ""}`;

		if (existsSync(`./files/${nf}`)){
			code = gencode(filelength);

			if (existsSync(`./files/${nf}`)){
				code = gencode(filelength);
				
				if (existsSync(`./files/${nf}`)){
					code = gencode(filelength);
				}
			}
		}

		writeFileSync(
			`./files/${nf}`	,
			readFileSync(files.file.path)
		);

		res.write(`<p>Success! Written to <a href=\"./${nf}\">${nf}</a>.</p>`);
		res.write("<a href=\"/\">Go back to home.</a>");
		res.end();
	});
});

app.listen(parseInt(port), console.log("Working!"));
