const whatsappNumber = "919875496874";

const products = [
  { name: "Flower motive powernet Bodycon Dress", price: 999, images: ["images/dress1.jpg"] },
  { name: "Rose Top", price: 1250, images: ["images/dress2.jpg"] },
  { name: "Tulip Dress", price: 999, images: ["images/dress3_1.jpg", "images/dress3_2.jpg"] },
  { name: "Ruffle Skirt", price: 999, images: ["images/dress4.jpg"] },
  { name: "Pure Cotton Skirt", price: 599, images: ["images/dress5_1.jpg", "images/dress5_2.jpg", "images/dress5_3.jpg"] }
];

const list = document.getElementById("product-list");

function changeImage(thumb) {
  const mainImg = thumb.closest(".card").querySelector(".main-img");
  mainImg.src = thumb.src;
}

products.forEach(product => {
  const message = encodeURIComponent(`Hi, I'd like to order: ${product.name}`);
  const link = `https://wa.me/${whatsappNumber}?text=${message}`;

  const thumbs = product.images.length > 1
    ? `<div class="thumbs">${product.images
        .map(src => `<img src="${src}" alt="${product.name}" onclick="changeImage(this)">`)
        .join("")}</div>`
    : "";

  list.innerHTML += `
    <div class="card">
      <img class="main-img" src="${product.images[0]}" alt="${product.name}">
      ${thumbs}
      <h3>${product.name}</h3>
      <p>₹${product.price}</p>
      <a href="${link}" target="_blank">Order on WhatsApp</a>
    </div>
  `;
});