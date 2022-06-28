const API = "https://api.thecatapi.com/v1/";
const API_KEY = "49ee49eb-696f-4b46-bb90-1271344f70b8";
const container = document.querySelector("main");

const Toast = Swal.mixin({
	toast: true,
	position: "top-end",
	showConfirmButton: false,
	timer: 2000,
	timerProgressBar: true,
	didOpen: (toast) => {
		toast.addEventListener("mouseenter", Swal.stopTimer);
		toast.addEventListener("mouseleave", Swal.resumeTimer);
	},
});

const createLoader = () => {
	const loader = document.createElement("div");
	loader.classList.add("loader");
	loader.innerHTML = `
		<svg x="0px" y="0px" width="40px" height="40px" viewBox="0 0 50 50">
			<path
				d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z">
				<animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25"
					dur="0.6s" repeatCount="indefinite" />
			</path>
		</svg>
`;
	return loader;
};

const initializeApp = () => {
	createRandomCats();
	createFavoriteCats();
	createFileUpload();
};

// Add to favorites
const addToFavorites = async (id, url) => {
	await fetch(`${API}favourites`, {
		method: "POST",
		headers: {
			"x-api-key": API_KEY,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ image_id: `${id}`, sub_id: "1" }),
	})
		.then(() => updateFavoriteCats(url))
		.then(() =>
			Toast.fire({
				icon: "success",
				title: "Cat added to favorites",
			})
		)
		.catch((err) =>
			Toast.fire({
				icon: "error",
				title: "Something went wrong while adding to favorites " + err,
			})
		);
};

// Remove from favorites
const removeFromFavorites = async (id) => {
	await fetch(`${API}favourites/${id}`, {
		method: "DELETE",
		headers: {
			"x-api-key": API_KEY,
		},
	})
		.then(() =>
			Toast.fire({
				icon: "success",
				title: "Cat removed from favorites",
			})
		)
		.catch((err) =>
			Toast.fire({
				icon: "error",
				title: "Something went wrong while removing from favorites " + err,
			})
		);
};

// Random cats
const createRandomCats = async () => {
	const section = document.createElement("section");
	const title = document.createElement("h2");
	const loader = createLoader();
	section.classList.add("grid");
	title.textContent = "Random cats";
	section.append(loader);
	const reload = document.createElement("button");
	reload.textContent = "Reload";
	reload.addEventListener("click", () => {
		[...section.childNodes].forEach((node) => node.remove());
		section.append(loader);
		getRandomCats().then((fragment) => loader.replaceWith(fragment));
	});
	container.append(title, section, reload);

	await getRandomCats().then((fragment) => loader.replaceWith(fragment));
};

// Get random cats
const getRandomCats = async () => {
	const fragment = document.createDocumentFragment();
	const res = await fetch(`${API}images/search?limit=10`);
	const data = await res.json();

	data.forEach((cat) => {
		const imgContainer = document.createElement("div");
		const img = document.createElement("img");
		const button = document.createElement("button");
		img.src = cat.url;
		button.addEventListener("click", () => {
			addToFavorites(cat.id, cat.url);
			imgContainer.remove();
		});
		imgContainer.append(img, button);
		fragment.append(imgContainer);
	});
	return fragment;
};

// Favorite cats
const createFavoriteCats = async () => {
	const section = document.createElement("section");
	const title = document.createElement("h2");
	const loader = createLoader();
	section.classList.add("grid");
	title.textContent = "Favorite cats";
	section.append(loader);
	container.append(title, section);

	await getFavoriteCats().then((fragment) => loader.replaceWith(fragment));
};

// Update favorite cats
const updateFavoriteCats = async (url) => {
	const favorites = document.querySelectorAll("section")[1];
	const favoriteCats = await getFavoriteCats();
	[...favorites.childNodes].forEach((node) => node.remove());
	favorites.append(favoriteCats);
};

// Get random cats
const getFavoriteCats = async () => {
	const fragment = document.createDocumentFragment();
	const res = await fetch(`${API}favourites`, {
		headers: {
			"x-api-key": API_KEY,
		},
	});
	const data = await res.json();

	data.forEach((cat) => {
		const imgContainer = document.createElement("div");
		const img = document.createElement("img");
		const button = document.createElement("button");
		img.src = cat.image.url;
		button.classList.add("active");
		button.addEventListener("click", () => {
			removeFromFavorites(cat.id);
			button.classList.toggle("active");
			imgContainer.remove();
		});
		imgContainer.append(img, button);
		fragment.append(imgContainer);
	});
	return fragment;
};

const createFileUpload = () => {
	const section = document.createElement("section");
	const title = document.createElement("h2");
	const form = document.createElement("form");
	const label = document.createElement("label");
	const contentLabel = document.createElement("div");
	const text = document.createElement("p");
	const input = document.createElement("input");
	const button = document.createElement("button");
	title.textContent = "Upload your own cat";
	text.textContent = "Drop your cat here or select a file";
	input.type = "file";
	input.name = "file";
	label.for = "file";
	input.accept = "image/png, image/jpeg";
	input.required = true;
	input.id = "file";
	button.textContent = "Upload";
	button.type = "button";

	input.addEventListener("change", () => {
		const preview = document.createElement("img");
		const img = label.querySelector("img");
		if (img) img.remove();

		if (input.files[0]) {
			preview.src = URL.createObjectURL(input.files[0]);
			label.append(preview);
		}
	});

	button.addEventListener("click", (e) => {
		e.preventDefault();
		const formData = new FormData(form);
		const file = formData.get("file");
		if (!file.name) {
			Toast.fire({
				icon: "error",
				title: "Please select an image to upload",
			});
			return;
		}
		const loader = createLoader();
		label.insertAdjacentElement("afterend", loader);
		label.classList.add("loading");
		uploadCatPhoto(formData)
			.then(() => {
				Toast.fire({
					icon: "success",
					title: "Cat uploaded successfully",
				});
			})
			.catch((err) => {
				Toast.fire({
					icon: "error",
					title: "Something went wrong while uploading " + err,
				});
			})
			.finally(() => {
				loader.remove();
				label.classList.remove("loading");
			});
	});
	contentLabel.append(text, input);
	label.append(contentLabel);
	form.append(label, button);
	section.append(title, form);
	container.append(section);
};

const uploadCatPhoto = async (file) => {
	// If there is nota a file, return
	if (!file.get("file")) return;
	await fetch(`${API}images/upload`, {
		method: "POST",
		headers: {
			"x-api-key": API_KEY,
		},
		body: file,
	})
		.then((res) => res.json())
		.then((data) => {
			addToFavorites(data.id, data.url);
		});
};

initializeApp();
