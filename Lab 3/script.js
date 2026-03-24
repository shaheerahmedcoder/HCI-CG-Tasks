let count = 0;

const btn = document.getElementById("actionBtn");
const status = document.getElementById("status");

btn.addEventListener("click", performAction);

function performAction() {
  count++;

  btn.style.transform = "scale(0.95)";
  setTimeout(() => btn.style.transform = "", 100);

  if (count > 3) {
    btn.disabled = true;
    btn.style.opacity = "0.5";
    status.innerHTML = '<span class="limit">⚠️ Limit reached!</span>';
  } else {
    status.innerHTML = `✅ Processed ${count} time${count > 1 ? 's' : ''}`;
  }
}