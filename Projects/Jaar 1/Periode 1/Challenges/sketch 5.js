const tileSize = 40;

const world = {
	pull: 0.5,
	lavaRise: 1.5
};

const levels = [
	{
		name: "Level 1",
		map: [
			"..............................",
			"..............................",
			"..............................",
			"..............................",
			"..............................",
			"..............................",
			"..............................",
			"..............................",
			"..............................",
			"..P........................G..",
			"##########.....###############",
			"##########^^^^^###############"
		]
	},
	{
		name: "Level 2",
		map: [
			"..............................",
			"..............................",
			"..............................",
			"..............................",
			"..............................",
			"..............................",
			"..............######..........",
			"..............######..........",
			"..............######..........",
			"..P...........######.......G..",
			"##############################",
			"##############################"
		]
	},
	{
		name: "Level 3",
		lava: true,
		map: [
			"...............#....",
			"...............#G...",
			"...............#####",
			"....................",
			"....................",
			"........#####.......",
			"....................",
			"....................",
			"....................",
			"#####...............",
			"....................",
			"....................",
			"....................",
			".......####.........",
			"....................",
			"....................",
			"....................",
			"...............#####",
			"....................",
			"....................",
			"....................",
			"........#####.......",
			"....................",
			"....................",
			"..P.................",
			"####################"
		]
	},
	{
		name: "Level 4",
		dark: false,
		map: caveMap(230)
	}
];

const caveSize = { width: 2880, height: 1280 };

let currentLevel = 0;
let level;
let player;
let deaths = 0;
let lavaY = 0;
let levelFrame = 0;
let jumpBuffer = 0;
let finishTimer = 0;
let cheatWarning = 0;
let spores = [];
let caveRocks = [];
let caveTime = 0;
let caveStartX = 0;
const camera = { x: 0, y: 0 };
const keysDown = new Set();

function setup() {
	createCanvas(800, 480);
	loadLevel(0);
}

function draw() {
	if (finishTimer > 0) {
		finishTimer--;
		if (finishTimer === 0) {
			loadLevel(currentLevel + 1);
		}
	} else {
		updatePlayer();
		updateLava();
		checkTiles();
	}

	if (level.dark) {
		updateCave();
	}

	updateCamera(false);
	drawWorld();
	drawHud();
}

function caveMap(length) {
	const rows = [];
	for (let row = 0; row < 12; row++) {
		let line = "";
		for (let column = 0; column < length; column++) {
			if (row === 0 || row >= 10 || column === 0 || column === length - 1) {
				line += "#";
			} else if (row === 9 && column === 2) {
				line += "P";
			} else if (row === 9 && column % 23 === 11) {
				line += "#";
			} else {
				line += ".";
			}
		}
		rows.push(line);
	}
	return rows;
}

function createPlayer(x, y) {
	return {
		x: x,
		y: y,
		width: 24,
		height: 32,
		velocityX: 0,
		velocityY: 0,
		onGround: false,
		coyote: 0,
		facing: 1,
		speed: 20,
		jumpHeight: 20
	};
}

function loadLevel(index) {
	if (index !== currentLevel) {
		deaths = 0;
	}
	currentLevel = index;

	const data = levels[index];
	level = {
		name: data.name,
		map: data.map,
		lava: data.lava === true,
		dark: data.dark === true,
		columns: data.map[0].length,
		rows: data.map.length
	};

	for (let row = 0; row < level.rows; row++) {
		const column = level.map[row].indexOf("P");
		if (column >= 0) {
			player = createPlayer(column * tileSize + (tileSize - 24) / 2, (row + 1) * tileSize - 32);
		}
	}

	lavaY = level.rows * tileSize + 40;
	levelFrame = 0;
	jumpBuffer = 0;
	finishTimer = 0;
	updateCamera(true);

	if (level.dark && spores.length === 0) {
		startCave();
	}
}

function die() {
	deaths++;
	loadLevel(currentLevel);
}

function isHeld(...names) {
	return names.some(name => keysDown.has(name));
}

function keyPressed() {
	keysDown.add(key.toLowerCase());

	if (key === "ArrowUp" || key === " " || key === "w" || key === "W") {
		jumpBuffer = 6;
	}
	if (key === "r" || key === "R") {
		loadLevel(currentLevel);
	}
	return false;
}

function keyReleased() {
	keysDown.delete(key.toLowerCase());

	if (key === "ArrowUp" || key === " " || key === "w" || key === "W") {
		if (player.velocityY < 0) {
			player.velocityY *= 0.5;
		}
	}
	return false;
}

function updatePlayer() {
	levelFrame++;

	let direction = 0;
	if (isHeld("arrowleft", "a")) {
		direction--;
	}
	if (isHeld("arrowright", "d")) {
		direction++;
	}
	if (direction !== 0) {
		player.facing = direction;
	}
	player.velocityX = direction * player.speed;

	player.coyote = player.onGround ? 6 : player.coyote - 1;
	if (jumpBuffer > 0) {
		jumpBuffer--;
		if (player.coyote > 0) {
			player.velocityY = -player.jumpHeight;
			player.coyote = 0;
			jumpBuffer = 0;
		}
	}
	player.velocityY += world.pull;

	player.onGround = false;
	const steps = max(1, ceil(max(abs(player.velocityX), abs(player.velocityY)) / 4));
	for (let step = 0; step < steps; step++) {
		moveHorizontal(player.velocityX / steps);
		moveVertical(player.velocityY / steps);
	}
}

function moveHorizontal(distance) {
	if (distance === 0) {
		return;
	}
	player.x += distance;

	if (touchesTile(player.x, player.y, player.width, player.height, "#")) {
		if (distance > 0) {
			player.x = floor((player.x + player.width) / tileSize) * tileSize - player.width;
		} else {
			player.x = (floor(player.x / tileSize) + 1) * tileSize;
		}
		player.velocityX = 0;
	}
}

function moveVertical(distance) {
	if (distance === 0) {
		return;
	}
	player.y += distance;

	if (touchesTile(player.x, player.y, player.width, player.height, "#")) {
		if (distance > 0) {
			player.y = floor((player.y + player.height) / tileSize) * tileSize - player.height;
			player.onGround = true;
		} else {
			player.y = (floor(player.y / tileSize) + 1) * tileSize;
		}
		player.velocityY = 0;
	}
}

function tileAt(column, row) {
	if (column < 0 || column >= level.columns) {
		return "#";
	}
	if (row < 0 || row >= level.rows) {
		return ".";
	}
	return level.map[row][column];
}

function touchesTile(x, y, w, h, type) {
	const firstColumn = floor(x / tileSize);
	const lastColumn = floor((x + w - 0.01) / tileSize);
	const firstRow = floor(y / tileSize);
	const lastRow = floor((y + h - 0.01) / tileSize);

	for (let row = firstRow; row <= lastRow; row++) {
		for (let column = firstColumn; column <= lastColumn; column++) {
			if (tileAt(column, row) === type) {
				return true;
			}
		}
	}
	return false;
}

function updateLava() {
	if (level.lava && levelFrame > 120) {
		lavaY -= world.lavaRise;
	}
}

function checkTiles() {
	if (player.y > level.rows * tileSize + 100) {
		die();
	} else if (touchesTile(player.x + 4, player.y + 8, player.width - 8, player.height - 8, "^")) {
		die();
	} else if (level.lava && player.y + player.height > lavaY + 6) {
		die();
	} else if (touchesTile(player.x, player.y, player.width, player.height, "G")) {
		finishTimer = 60;
	}
}

function updateCamera(instant) {
	const worldWidth = level.columns * tileSize;
	const worldHeight = level.rows * tileSize;
	const targetX = constrain(player.x + player.width / 2 - width / 2, 0, max(0, worldWidth - width));
	const targetY = min(player.y + player.height / 2 - height / 2, worldHeight - height);

	if (instant) {
		camera.x = targetX;
		camera.y = targetY;
	} else {
		camera.x = lerp(camera.x, targetX, 0.15);
		camera.y = lerp(camera.y, targetY, 0.15);
	}
}

function drawWorld() {
	if (level.dark) {
		background(10, 8, 14);
	} else {
		background(150, 205, 235);
	}

	push();
	translate(-round(camera.x), -round(camera.y));

	const firstColumn = floor(camera.x / tileSize);
	const lastColumn = floor((camera.x + width) / tileSize);
	const firstRow = floor(camera.y / tileSize);
	const lastRow = floor((camera.y + height) / tileSize);

	noStroke();
	for (let row = max(0, firstRow); row <= min(level.rows - 1, lastRow); row++) {
		for (let column = max(0, firstColumn); column <= min(level.columns - 1, lastColumn); column++) {
			drawTile(tileAt(column, row), column * tileSize, row * tileSize, tileAt(column, row - 1));
		}
	}

	if (level.lava) {
		drawLava();
	}
	drawPlayer();
	pop();

	if (level.dark) {
		drawDarkness();
		drawSpores();
	}
}

function drawTile(type, x, y, typeAbove) {
	if (type === "#") {
		if (level.dark) {
			fill(34, 30, 40);
			rect(x, y, tileSize, tileSize);
			fill(48, 42, 56);
			rect(x + 2, y + 2, tileSize - 4, tileSize - 4);
		} else {
			fill(120, 85, 60);
			rect(x, y, tileSize, tileSize);
			if (typeAbove !== "#") {
				fill(80, 170, 70);
				rect(x, y, tileSize, 10);
			}
		}
	} else if (type === "^") {
		fill(200);
		for (let i = 0; i < 4; i++) {
			triangle(x + i * 10, y + tileSize, x + i * 10 + 5, y + 14, x + i * 10 + 10, y + tileSize);
		}
	} else if (type === "G") {
		fill(90);
		rect(x + 8, y - 30, 4, tileSize + 30);
		fill(240, 70, 70);
		triangle(x + 12, y - 30, x + 36, y - 20, x + 12, y - 10);
	}
}

function drawLava() {
	fill(235, 90, 30);
	beginShape();
	vertex(camera.x - 10, camera.y + height + 10);
	for (let x = camera.x - 10; x <= camera.x + width + 10; x += 20) {
		vertex(x, lavaY + sin(x * 0.05 + frameCount * 0.1) * 5);
	}
	vertex(camera.x + width + 10, camera.y + height + 10);
	endShape(CLOSE);
}

function drawPlayer() {
	fill(level.dark ? color(220, 220, 255) : color(60, 70, 160));
	rect(player.x, player.y, player.width, player.height, 6);

	fill(255);
	const eyeX = player.x + player.width / 2 + player.facing * 5;
	circle(eyeX - 4, player.y + 11, 7);
	circle(eyeX + 4, player.y + 11, 7);
	fill(20);
	circle(eyeX - 4 + player.facing, player.y + 11, 3);
	circle(eyeX + 4 + player.facing, player.y + 11, 3);
}

function drawDarkness() {
	const lightX = player.x + player.width / 2 - round(camera.x);
	const lightY = player.y + player.height / 2 - round(camera.y);
	const gradient = drawingContext.createRadialGradient(lightX, lightY, 30, lightX, lightY, 160);
	gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
	gradient.addColorStop(1, "rgba(0, 0, 0, 0.92)");
	drawingContext.fillStyle = gradient;
	drawingContext.fillRect(0, 0, width, height);
}

function drawHud() {
	noStroke();
	textSize(20);
	textAlign(LEFT, TOP);
	fill(level.dark ? 200 : 30);
	text(level.name, 16, 14);

	if (!level.dark && deaths > 0) {
		textAlign(RIGHT, TOP);
		text("Doodgegaan: " + deaths, width - 16, 14);
	}

	textAlign(CENTER, TOP);
	textSize(16);
	if (cheatWarning > 0) {
		cheatWarning--;
		fill(200, 30, 30);
		text("Valsspeler gedetecteerd! Waarden teruggezet.", width / 2, 44);
	} else if (currentLevel === 0 && deaths >= 5) {
		text("Dit lijkt onmogelijk... of toch niet?", width / 2, 44);
	} else if (currentLevel === 2 && player.y < 3 * tileSize) {
		text("Sommige deuren hebben geen sleutel.", width / 2, 44);
	} else if (level.dark) {
		text("De grot onthoudt alles... loop langzaam.", width / 2, 44);
	}

	if (finishTimer > 0) {
		textAlign(CENTER, CENTER);
		textSize(48);
		fill(30);
		text("Gehaald!", width / 2, height / 2);
	}
}

function startCave() {
	const next = randomStream(caveMemory[0]);
	caveRocks = createCaveRocks(next);
	const count = (caveMemory[1] ^ next()) >>> 0;

	spores = [];
	for (let i = 0; i < count; i++) {
		const position = (caveMemory[2 + i * 2] ^ next()) >>> 0;
		const motion = (caveMemory[3 + i * 2] ^ next()) >>> 0;
		spores.push({
			x: position & 0xffff,
			y: position >>> 16,
			velocityX: (motion & 0xff) - 128,
			velocityY: ((motion >>> 8) & 0xff) - 128,
			red: random(200, 255),
			green: random(150, 220),
			blue: random(60, 140)
		});
	}

	caveTime = 0;
	caveStartX = player.x;
}

function createCaveRocks(next) {
	const rocks = [];
	for (let i = 0; i < 12; i++) {
		const w = (20 + next() % 40) * 4;
		const h = (20 + next() % 40) * 4;
		rocks.push({
			x: next() % (caveSize.width - w),
			y: next() % (caveSize.height - h),
			w: w,
			h: h
		});
	}
	return rocks;
}

function sporeBlocked(x, y) {
	if (x < 0 || y < 0 || x >= caveSize.width || y >= caveSize.height) {
		return true;
	}
	for (const rock of caveRocks) {
		if (x >= rock.x && x < rock.x + rock.w && y >= rock.y && y < rock.y + rock.h) {
			return true;
		}
	}
	return false;
}

function stepSporeX(spore) {
	const x = spore.x + spore.velocityX;
	if (sporeBlocked(x, spore.y)) {
		spore.velocityX = -spore.velocityX;
	} else {
		spore.x = x;
	}
}

function stepSporeY(spore) {
	const y = spore.y + spore.velocityY;
	if (sporeBlocked(spore.x, y)) {
		spore.velocityY = -spore.velocityY;
	} else {
		spore.y = y;
	}
}

function tickCave(forward) {
	for (const spore of spores) {
		if (forward) {
			stepSporeX(spore);
			stepSporeY(spore);
		} else {
			spore.velocityX = -spore.velocityX;
			spore.velocityY = -spore.velocityY;
			stepSporeY(spore);
			stepSporeX(spore);
			spore.velocityX = -spore.velocityX;
			spore.velocityY = -spore.velocityY;
		}
	}
}

function updateCave() {
	const target = max(0, floor((player.x - caveStartX) / 3));
	for (let i = 0; i < 6 && caveTime !== target; i++) {
		if (caveTime < target) {
			tickCave(true);
			caveTime++;
		} else {
			tickCave(false);
			caveTime--;
		}
	}
}

function drawSpores() {
	const neighbours = new Array(spores.length).fill(0);
	for (let i = 0; i < spores.length; i++) {
		for (let j = i + 1; j < spores.length; j++) {
			const dx = spores[i].x - spores[j].x;
			const dy = spores[i].y - spores[j].y;
			if (dx * dx + dy * dy < 1600) {
				neighbours[i]++;
				neighbours[j]++;
			}
		}
	}

	noStroke();
	for (let i = 0; i < spores.length; i++) {
		const spore = spores[i];
		const glow = neighbours[i] >= 4;
		fill(spore.red, spore.green, spore.blue, glow ? 255 : 60);
		circle(40 + spore.x / 4, 40 + spore.y / 4, glow ? 6 : 3);
	}
}

function randomStream(seed) {
	let state = seed | 0;
	return function () {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return (t ^ (t >>> 14)) >>> 0;
	};
}

const caveMemory = [
	0x2fc62d7a, 0xf0e1845c, 0xb0812ea7, 0x2ff40d8c, 0xa866e209, 0x67ace521, 0x6b1e5a0b, 0x81f1c11f,
	0x4118072a, 0xc1786a2b, 0x9fb3887f, 0x2da8823c, 0x5d07033b, 0xbb227e49, 0x0001b26e, 0xb0894aee,
	0x913abddd, 0x4d6ef071, 0x22a1b7b3, 0xb80802c4, 0xa789a02b, 0xb8e24166, 0x02c66902, 0xb6bbf212,
	0xc5215f4a, 0x0e4427df, 0x6d7b382c, 0xc3d4010c, 0x4706bc51, 0xf8b1a797, 0x39cdf19e, 0x6c11bb63,
	0x428b5490, 0x429b1029, 0xd198db91, 0xd7f04bb9, 0x0e27e95b, 0xfb88a684, 0x4179f5ce, 0x7e539a8b,
	0x1bb003d4, 0x66ca7599, 0xec4760f2, 0x9b49e79c, 0x9d106f86, 0xcf6277fc, 0x3602f48f, 0x14c67660,
	0x52cd9138, 0x515592fe, 0x234eb8fd, 0xe54acdf3, 0xdbcc681a, 0x0ec33eed, 0x7532e893, 0xe5ac8f5c,
	0xae7dd9c3, 0x81e5dd20, 0xc4383efc, 0x45c07f3d, 0xccbdb947, 0x198d7f80, 0xa7f9995b, 0x004d5e61,
	0xb774b806, 0x694b5c17, 0x39f5a9cf, 0x88499db7, 0x8f6a565d, 0x5e018ca0, 0x20cf6344, 0x3d13d801,
	0x65c7650c, 0x4356b3b7, 0x9306d161, 0xea008be0, 0x40db95ea, 0xb02a2c57, 0x8751977b, 0x5b5441f6,
	0x8d713e46, 0x42248e96, 0x404c0475, 0x5a916ebd, 0x922e0a65, 0xe8ad2a65, 0x9760d46b, 0x091cd4c9,
	0xeca53f8a, 0xf492072b, 0x779d9364, 0x37873262, 0x2601eda8, 0x450fb4dd, 0x7908d209, 0xcedba86e,
	0x2f2b80bb, 0xec0108a4, 0x3a911e47, 0x731bf5e3, 0x8a015dee, 0x10aead36, 0x9682a04c, 0x27591aa7,
	0x62a93247, 0x01827c2f, 0xa5e292d9, 0xdfe2dc65, 0xc1aa2d91, 0xb870fdb0, 0xa344bee3, 0xc9fb6db7,
	0x56325c32, 0x091569e6, 0xd965addb, 0xa4f7e142, 0xa1a201eb, 0x88987a42, 0x855411f9, 0xe166344f,
	0xc411eb09, 0xd692adc1, 0xfd088128, 0xddcb9b92, 0x3b503495, 0x7faf0bf6, 0x072e97d3, 0xad30a821,
	0x49507b13, 0x5b8297da, 0x2b5804eb, 0xeb8f0625, 0x9a4a66a5, 0xd741095b, 0x88c02918, 0x445e32ed,
	0xf61f1eb9, 0x498cb181, 0x1ea8120d, 0x3662ce0f, 0xf2e7855a, 0x6ecf2a84, 0xa2e2f5bf, 0x6f802acb,
	0xf0749135, 0x86746105, 0xabdad964, 0x3beaf8d7, 0xd5a82e27, 0x91554697, 0x8362b973, 0xa63727f6,
	0x9807c214, 0x1ff4e51a, 0x06240e15, 0x31c0fe09, 0xd616c02f, 0xb760908f, 0x8ac7a385, 0x1d21394a,
	0x755ae017, 0x4eff040e, 0x7f2f00e4, 0x4f3285d8, 0xc36d245e, 0x9fe57b0b, 0x9aa4f4c4, 0xb5eab3ae,
	0x08473dfe, 0xded1db2d, 0x228d80b3, 0x9c1eca0b, 0xc0ed9dec, 0x0cca860b, 0x60416eaf, 0xdd365deb,
	0x745347cf, 0x385313ef, 0x26b5ab2c, 0xe1403936, 0x65f845b9, 0xf6a3ea2a, 0xa3fc2d26, 0xacc38d36,
	0x7bb29e38, 0x8ffd37b3, 0xbae667f8, 0x59d1dd4d, 0x9437c0e8, 0xa5c9ea50, 0x7eeeafc9, 0x2ed39d19,
	0x7d781a42, 0x106d2b69, 0xb5f94a49, 0xd720565c, 0x61d6ed43, 0x325df171, 0xdfe2157d, 0xf89548ea,
	0x8d73cb15, 0xab6e5fbc, 0xbff5fa9a, 0xa2ecb8e3, 0xd7f391a5, 0x26671648, 0x7b52a3b7, 0x2f2e2a68,
	0x853e66c2, 0x18cf4566, 0xc3e2d8b9, 0x62512f0f, 0xc14fe671, 0x164cb69e, 0x674f1eb5, 0x3ca69c06,
	0x17278e93, 0xbb0adcfc, 0x0a9121be, 0x36946ca9, 0x957cd5a3, 0xc788361d, 0xd8a6ee74, 0x6db81f3b,
	0x0c5a6ab4, 0xb9091440, 0x50ca2d36, 0x0b2a936d, 0x100b93c4, 0x69ca7c4b, 0xda0f73d1, 0xe1631234,
	0xde233377, 0x3ac738bd, 0xe31d0829, 0x85153565, 0xee0ac60c, 0x61aa2140, 0x229e5554, 0xfa803a42,
	0xb0203089, 0xa59b613a, 0x162df96a, 0x53b92a0a, 0xe304721d, 0xe2e34c44, 0x270e5484, 0xda4c94cc,
	0x2430f9ef, 0xf202e545, 0x1b90fad6, 0x9d92183c, 0x6bd0cea6, 0x43bf9e0f, 0x93666afb, 0xa4cec4cc,
	0x568b0a1c, 0x990d0f82, 0xb8fd07b4, 0x2f29419d, 0xac8aac70, 0xf16b940b, 0x0445810b, 0x74528187,
	0x70605c64, 0x4324c3fa, 0x60d0d187, 0x424a445e, 0x6d2b8e2b, 0x78a3ac44, 0xc11bba52, 0x86ae3cd4,
	0x5c361c45, 0x6139ed7b, 0x104ac4e6, 0xca238ba7, 0xaf2b3fdc, 0x682c58a2, 0x80557e17, 0x0c1793e9,
	0x7e790909, 0x01413ad8, 0x253dfa66, 0xda8a8a03, 0x2933f360, 0xc429feab, 0x6ee03575, 0x6ff78588,
	0xc1079212, 0xa61438f4, 0xac61e040, 0x1391acc2, 0x4cb74207, 0x79e6f34e, 0x0e5b3761, 0x7da6523e,
	0xd0d7d8d4, 0x74989a0d, 0x9923076b, 0x1b5112f1, 0xe6f0ce26, 0xadc647c6, 0x2fd910a3, 0x4e37bb67,
	0x56189a6d, 0x1b69697e, 0xafd4d9b0, 0x4e21543a, 0x7aaa4fb3, 0x308b256d, 0x8dcc454d, 0xc2a41062,
	0x2656a487, 0xa3f45a91, 0xde9ef4fe, 0x3f194bde, 0xf99ebf96, 0xb0cb9864, 0x1e557a2a, 0xb9daff5c,
	0xc86ebf96, 0x234c0388, 0xafd53747, 0xa4db3c9f, 0xf82b0c0b, 0x851f193f, 0xf9e203d7, 0x66c9bd0b,
	0x4f5d52bf, 0xce595497, 0xb7087a57, 0xb8cae6b0, 0x3a52ca7b, 0xada32611, 0xe76d8282, 0xb7625d1f,
	0xeddaa422, 0x8b34dbb6, 0x29a5eb0a, 0xce80fbdd, 0x82d201e3, 0x98210042, 0x6300b54d, 0x9177a615,
	0xc976ddf7, 0x3ac9494f, 0x7eefa19c, 0xfc97cd24, 0x1a98ba13, 0xb955cb4c, 0xcf7b2a42, 0xad9b301a,
	0x667b8b07, 0x9fb34c93, 0xf97e5293, 0xdb78f424, 0x2ce3b3ed, 0x0d713601, 0x94364153, 0xf2c2f427,
	0xdabe4553, 0xb0287493, 0xecaf142b, 0xbb85713a, 0xdb590af8, 0x0db727dc, 0xad45263e, 0xb0161536,
	0x53113884, 0xc0be4ba0, 0x8963ae86, 0xdd7d93cc, 0xa43f5540, 0xd632f7c3, 0x83286b69, 0xa395e84b,
	0xa68f644a, 0x1d315d19, 0xe4fb44fd, 0xb390ffd7, 0x01ed1f8e, 0xb2612f88, 0x584f3558, 0x1c66a419,
	0x1c5423a8, 0x0221b89b, 0x61bf5f66, 0x6a3d7cc8, 0xe106b0d4, 0x13b0f7ad, 0x16eb3588, 0x12036050,
	0xefa2aafc, 0xe94994d4, 0xd3e0d94f, 0x463ade4c, 0x54d17617, 0x27811e58, 0xe9157869, 0xf348b6b8,
	0x0810c3ba, 0xd92922e1, 0x3a226234, 0x0a2993b2, 0xe59b3dbc, 0x7ff4a75e, 0xe660e0e5, 0xc3a3c24f,
	0x13ca9eed, 0x8fbec001, 0xa4acbed6, 0xa11417e6, 0xaec6df40, 0x8089a992, 0x47d6feb8, 0xf1027577,
	0x4798c4ed, 0xe731fa53, 0x0d35168d, 0xbc2d7612, 0xab171797, 0x24152881, 0x71b27e8a, 0x5d81b21c,
	0x3eacaf6f, 0x6e013eab, 0x7d972670, 0x62bb5f3f, 0x6a65938e, 0x05d0ad9c, 0xb9253549, 0x7b461cfb,
	0x92646b6e, 0x1dcab881, 0xd6ad16ea, 0xc5377bb0, 0xfab53548, 0xb53748ca, 0xe03d6166, 0xf27ca759,
	0x75bef1a8, 0x77915ded, 0x5b10d1f7, 0x42541165, 0x13b81e39, 0xa46db1e2, 0x607477f5, 0x9d983c43,
	0xc00a708c, 0x42e21877, 0x0d080bc2, 0xb9b7f797, 0x6baa548f, 0x7964971c, 0xeef99b96, 0x3eb17c78,
	0xdb06d157, 0xac4190c2, 0x6b9c2972, 0xb20a8b4d, 0x882b187b, 0x973a3f6b, 0xf65163d6, 0xe5f3c1f1,
	0xa48fe668, 0xf092f4cf, 0xd37f4484, 0xd4af6b61, 0xa1095ec0, 0xf6e66722, 0xc13fa584, 0xeb0fe31c,
	0x9415d4cb, 0x793521c3, 0x7d09c180, 0xb0e76dae, 0x86b1afcd, 0x6fccbe75, 0xc3452991, 0xc1f40afc,
	0xff470f4d, 0x2d2a4dbe, 0x2e0cfeb6, 0x0600ec62, 0x3209c238, 0x0b7e1557, 0x03d460e2, 0x5b8e9f13,
	0xf773ce53, 0x4ed1e61b, 0xe1261932, 0x62d5a708, 0x6bf521d7, 0x4224d307, 0xa494b121, 0x14aefde7,
	0x357f3634, 0xa4690778, 0xf7e71e29, 0x3638bc99, 0x747947cd, 0x6bf95df2, 0xb8dcff55, 0x75d995c0,
	0x2173644f, 0x28df7966, 0x8332569e, 0xcd7d47d9, 0xb747ec86, 0xce0b02bc, 0x48f2fa4e, 0xccff18e3,
	0x4f30d28f, 0x2746f2d3, 0x775c2ac3, 0xfb109254, 0xa17f3ca1, 0xc47f1637, 0xb36a0e10, 0x93383880,
	0xf48e7aa8, 0x4ca42dd6, 0xe4b2b2b7, 0xa3a063ee, 0x57ddddbf, 0xdadbf48c, 0xdc730c94, 0x86662f7b,
	0xf80c3cdf, 0xc09f9dc9, 0xd972537b, 0x9973e089, 0x7b6e6622, 0xc63d87ca, 0x930ef808, 0xcf38694a,
	0xf4ebd5e3, 0xc5fd9e5a, 0xd2d021e2, 0xf97a26a7, 0xe52f6dc4, 0xa6b39dc2, 0xda32b332, 0xdbb388c3,
	0xa6f7c67d, 0xb5c71637, 0xf42f1513, 0x2dac8144, 0xeec2c62e, 0x139a390c, 0x42ad89d8, 0xf66832f7,
	0x0a91b14d, 0x36a22eca, 0x20eef253, 0xb334c242, 0xabd41776, 0xf42f2f97, 0x1948d547, 0xe04e9b29,
	0x3796e569, 0x7d57eee0, 0xadf3d8e4, 0xd8e1690e, 0x6dcee1b1, 0x2304d21b, 0xb3847c89, 0x7883febb,
	0xa72b3af8, 0xfcac7ba3, 0xe33c3a7b, 0x5c295cae, 0xfe80ddbc, 0xae98355b, 0x3a53e46c, 0x49d90057,
	0x9ebed89f, 0xa6383cea, 0xa09c14ea, 0x2f0e9776, 0x5964b40d, 0x8268220d, 0x89de68d0, 0x5a194556,
	0xcb5ac76b, 0x3919327b, 0xfacddd78, 0x839067a0, 0x8292ccd0, 0x59443a05, 0x42d90074, 0x90a255c1,
	0x6369fb7e, 0x246537b9, 0xb0f2e4f2, 0xae40d6d8, 0x45443865, 0x9aca3245, 0xa94164be, 0x17dc62db,
	0x5599376c, 0x55624a76, 0x4f7f4713, 0xb94b0bf9, 0xc96bc258, 0xcfa53d58, 0xbbd11f49, 0x528549cc,
	0x2da4019a, 0xf9c03412, 0x9ffbc6ef, 0x0e7df151, 0xd05b4aa4, 0x286f225c, 0x42d15ad7, 0xd03effa6,
	0xddacab4e, 0x400877a8, 0x7f163f68, 0xdd086de1, 0x3dced023, 0xf3eddacd, 0xfcb8ff5c, 0x8c656fef,
	0xa4fc5e0f, 0x29407fe0, 0x4d0938d3, 0xea7045e6, 0x87da7752, 0xa938ce97, 0x9251df24, 0x71bbd427,
	0xa266e272, 0x7ceccd8e, 0x40f39430, 0x8f441f24, 0x5f2e202d, 0xabe78e36, 0x2fa63e3a, 0x5dbb8406,
	0xeb0dbe92, 0x676ca38b, 0xf583c6e1, 0x6838deb5, 0x33bc5b2d, 0x0e697cd7, 0xd732b210, 0xe183fcf7,
	0x80246739, 0x36fcac6b, 0xa91ec4e7, 0xd6993f35, 0xd6ffbbef, 0x5c1659b5, 0x3159088f, 0x831f95f4,
	0x2d426eeb, 0x494a8a1f, 0x3a80434f, 0x2b2e126c, 0xd93f478e, 0xffc123a9, 0x5db10746, 0x3d5d354f,
	0xfbc9d587, 0x32639f97, 0x5008e480, 0xe706166e, 0x02547402, 0x8ae02b73, 0xdfb84bb0, 0xddafaeaf,
	0xfbe8e49c, 0x356c970b, 0xbbd5925c, 0xc89b4146, 0x8fa69f1d, 0x1e79c89b, 0x352a76ef, 0xb03cf16b,
	0x12d26705, 0x1b586624, 0xb6a3a7d2, 0x719b0107, 0x70292ec8, 0xeba3df2e, 0x54147f33, 0x99b27686,
	0x18aa43ae, 0x66f247d9, 0xd3173953, 0xc311616d, 0x19a2d581, 0x6c05d709, 0xf613688d, 0x487b3d41,
	0x37e3a803, 0x5d76fbe0, 0x55887222, 0x17b01be3, 0x59de2105, 0xc583c119, 0x3a0253a6, 0x6a6d0b54,
	0x07d09a08, 0x4cbe8868, 0xe0908d5d, 0x8d4b1988, 0xe0a10742, 0x3fbacc14, 0x6048e7c6, 0x778f74ad,
	0x45b87496, 0x5aa2d088, 0x759c178e, 0xc3d4e3d9, 0xd9b59910, 0x176aa3dd, 0x6d678366, 0xc87e54ce,
	0xbfa9f391, 0x132d96c5, 0xaf8ee71a, 0x7effe493, 0x1bd95f9e, 0x347f3527, 0x4cd49551, 0x9f80835d,
	0x4013cb74, 0x5cc84d4a, 0x998d7b7c, 0x1625d7a8, 0xca30aca9, 0xb43a03c8, 0x8079991d, 0xdd1c3d10,
	0x47c73b8c, 0x88b96762, 0xe8b66e0c, 0xc382bea2, 0x8cadee04, 0xce15ff45, 0x50d29fc6, 0xb683882d,
	0x86553abc, 0xad07e93a, 0xea29c900, 0x29f5214a, 0x2179ecfe, 0x5cb67c9d, 0xf673763a, 0xd3aed5c4,
	0xd061e922, 0x34018d6b, 0x3e67ea15, 0xbf45fd30, 0x1685ba66, 0x9d5d6dc0, 0x23a20c69, 0xf1ffce2b,
	0xe5788701, 0x67b63546, 0x4baac2a5, 0xa2fa56f5, 0x206038fd, 0x653e4721, 0x610c3afe, 0xf8097319,
	0xd7aaef35, 0x7aa1cb1c, 0x5dd20ebf, 0xca76225d, 0x2dbfdb39, 0x82934768, 0x369ad74b, 0x4eba2e30,
	0x9efb5d5d, 0x3f4d3cc0, 0xda1969bd, 0x3dc096a9, 0xebe032e5, 0x96b94369, 0xac8edbef, 0x731e3294,
	0xa5a89f1f, 0x3c1d1a6b, 0x0f81024e, 0x53c40c53, 0x6bb01bfd, 0xb7989d5b, 0x74141c90, 0x022ec786,
	0x84753a42, 0xc8770a54, 0xf8bce328, 0x77114d2f, 0x7e71c154, 0xb5719e12, 0x303937c0, 0xf5eca4d9,
	0x930d52a1, 0x6e6a0d70, 0xd4f20106, 0x74436556, 0x539ae150, 0x2f0d2b57, 0x99bb2a94, 0xdf064fc1,
	0x682ae0a1, 0x1d43af3f, 0x44bf0f82, 0xf62dac23, 0xd56a2440, 0x1e159c86, 0x32063022, 0xb4411899,
	0xf71a900d, 0x71303149, 0xd180c9f7, 0x8e3033b6, 0x2bfbdf8d, 0x7cd81c81, 0x196f033c, 0xb433297d,
	0x286476ec, 0x71f3a441, 0xdbba2794, 0x89b03580, 0x596be8e5, 0x506ccdd2, 0xdf3dac79, 0x7166c031,
	0x7e51acf3, 0x1acb17ff, 0xbe890ca6, 0x2f8c31cb, 0x0b5f8a44, 0xab19e847, 0x0052ba76, 0xd30baf4b,
	0x5ec6106c, 0x3797c365, 0x53858107, 0x9d59e3f2, 0xe7d7ca23, 0x9621fd49, 0x53928d33, 0xab398e76,
	0x782fceb9, 0x3ed92264, 0x5500c12e, 0x360f6ebb, 0x6d01ed5c, 0xbad93de1, 0x3104ed96, 0x0c8066fc,
	0x3b57374d, 0x7e6831bb, 0x02fab450, 0x3d4380cc, 0x62fc726d, 0x884298a3, 0x5a124285, 0x4b8fd097,
	0x9ab564e8, 0x030650e6, 0x5dd96107, 0x7ac9b303, 0xeefbe870, 0x7fde7fee, 0xe08fef75, 0x3164c830,
	0x18c65abb, 0xc1924727, 0xf7d1bd18, 0x6e55e324, 0x73fa3e84, 0xd35992f5, 0x4fcd84ee, 0xbbca582d,
	0x369cf8f6, 0xc292513d, 0xcf35fcad, 0x77ce8fd9, 0xa079a9de, 0x18749198, 0xfc05675c, 0xb30fcc46,
	0x347641cf, 0x84a69d3e, 0x90f1ee48, 0x56153288, 0x6589276d, 0xb62bd5bc, 0x1f0de7aa, 0x1f317d0e,
	0x1c60df92, 0x9f1827d3, 0xe4d30ebb, 0xe3a70499, 0x19a5abbd, 0xcd5bfea1, 0x49d151b3, 0xda1e566c,
	0xb9a057ef, 0x4c868e1c, 0xd18d1f09, 0x66ed9631, 0xe7b1c3f4, 0xb2cfd81a, 0x67253872, 0x34c055c5,
	0x0bfd7c1b, 0xcfbb0157, 0x9fb332b3, 0x67eb58e6, 0x470f7775, 0x535b868e, 0xf1ea2b21, 0x73f42b73,
	0x461fac87, 0x5221f225, 0x04270033, 0xf0fff07b, 0xf0aa3842, 0xab4fadcb, 0xcdcafefc, 0xabeb80d5,
	0xf3cd9841, 0x6b121166, 0xf0afd9ce, 0x43791413, 0x4f34a932, 0x58d52703, 0x2d5f8813, 0x870318a1,
	0x90ad8a8c, 0x31948e90, 0x642866f1, 0x2444f310, 0x922ec290, 0x4c4ea17d, 0xb3b54609, 0xffc3b856,
	0xf534b191, 0xff724509, 0xf063a8f7, 0x14135d6d, 0x6070bee7, 0x7b8f32a9, 0x62c1bb65, 0x203daaca,
	0x41226033, 0x166ac878, 0x6b75e016, 0x84280b8d, 0x0328eb6f, 0x3ed4db88, 0xa9b778d9, 0xb48b61a6,
	0x6830a0ba, 0x3f1376b3, 0x23d214ed, 0xddf6a8f5, 0x8bae926c, 0x58d4dc8e, 0xc9c2bae0, 0xf209c49e,
	0x2b41c6f1, 0x5d1278e2, 0x7eb30570, 0xfec8902b, 0xb248b772, 0x9a051482, 0x652821ef, 0x2c05e53d,
	0x34af14dd, 0x9bdd5899, 0xc9637cd0, 0xda444131, 0xec2f4325, 0xaad08b73, 0xeb68ceb4, 0xa03ae96e,
	0xf2e4c57e, 0x7b334962, 0x3e2effa5, 0x691e3d4b, 0x3018b043, 0xa17c77df, 0xdb2212ce, 0xc36145fd,
	0xf0cb1b60, 0x3b940aab, 0x64229dac, 0x6547c839, 0x990ecc4a, 0x167a37a8, 0x338e2919, 0xa4e982f5,
	0xa67bfb82, 0x98631edc, 0xba200f9d, 0x835453bc, 0x2c5d081a, 0x9691977d, 0xd383b51e, 0x2d2d6441,
	0x3b8e6e10, 0xb0203738, 0x5d3e41c9, 0xba40d4e3, 0x0c201a58, 0xec54011c, 0xee563c9e, 0x320805f9,
	0x419d00ab, 0x40cd0c4a, 0x8eac7ebd, 0xe2d2028c, 0x614b1b34, 0xe9208b70, 0x0099d599, 0xebe8f663,
	0x026de093, 0x2e477bb6, 0xd2647fee, 0xba487f2e, 0x3a44437a, 0xbf81c82b, 0x7f1dec58, 0xdf07af9e,
	0x8fa42476, 0xe6ccbdd4, 0x5131ff87, 0x0307d22e, 0x184fc353, 0xf3ab7c2e, 0x4b1fd085, 0xd3081429,
	0xb0bdfae8, 0x9ea6e8a6, 0x6a18a3b0, 0x1b22ad62, 0x64c29620, 0xc10d6441, 0x2279fab0, 0xc930c051,
	0x742115bc, 0x2f646b7d, 0x33d67c0a, 0x79ef7b67, 0xf5d5082e, 0xc19aa525, 0xd2ff37cd, 0x0b9a474a,
	0xf9342025, 0x954fae88, 0x5359209a, 0xb9f88b66, 0xe5beb2af, 0x8b01f531, 0x6174687b, 0x7698ea28,
	0x8572f85d, 0x9441d34f, 0x9fd2fb33, 0xb6a67654, 0x3e34412f, 0x0797b824, 0xfd41f9b7, 0x2ef4c2ad,
	0x71d8c4f5, 0x2b32623e, 0xef7f882e, 0x8fa3722f, 0x20b89971, 0xc8fce42c, 0xbb69ad8a, 0x96a48003,
	0xb4759801, 0x8b39e767, 0x4a3298b0, 0x905b3795, 0xe31724a5, 0x1a0ded51, 0x5d2692c3, 0xd6e5e68a,
	0xf0b3e565, 0x7bdff953, 0x00589d6b, 0xad71aa40, 0x3c370b0d, 0x3a27f6e2
];
