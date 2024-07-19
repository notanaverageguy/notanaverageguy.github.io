document.addEventListener("DOMContentLoaded", function () {
  const image = document.getElementById("map-image");
  const clickOverlay = document.getElementById("clickOverlay");
  let dot = null;

  image.addEventListener("click", function (event) {
    const offsetX = event.offsetX;
    const offsetY = event.offsetY;

    // Calculate scaled coordinates
    const scaledX = offsetX / image.clientWidth;
    const scaledY = offsetY / image.clientHeight;

    if (!dot) {
      dot = document.createElement("div");
      dot.classList.add("dot");
      clickOverlay.appendChild(dot);
    }

    dot.style.top = `${offsetY}px`;
    dot.style.left = `${offsetX}px`;

    // Print scaled coordinates
    console.log(`Scaled X: ${scaledX}, Scaled Y: ${scaledY}`);
  });
});
