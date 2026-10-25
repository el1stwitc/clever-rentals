import os from "node:os";
import qrcode from "qrcode-terminal";

function getAllLocalIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push({ name, ip: iface.address });
      }
    }
  }
  return addresses;
}

const addresses = getAllLocalIPs();
const primary = addresses.find(a => /wi-?fi|беспровод/i.test(a.name)) || addresses[0];
const ip = primary ? primary.ip : "localhost";
const port = 5173;
const mobileUrl = `http://${ip}:${port}/`;

console.log("\n" + "=".repeat(64));
console.log("  🚀 САЙТ «КЛЕВЕР» ГОТОВ К РАБОТЕ В ЛОКАЛЬНОЙ СЕТИ");
console.log("=".repeat(64));
console.log(`\n  💻 На этом компьютере:   http://localhost:${port}/`);
console.log(`  📱 На телефоне (Wi-Fi):  ${mobileUrl}`);

if (addresses.length > 1) {
  console.log("  Дополнительные адреса:");
  addresses.forEach(a => {
    if (a.ip !== ip) console.log(`   - http://${a.ip}:${port}/ (${a.name})`);
  });
}

console.log("\n  📷 Наведите камеру смартфона на QR-код для открытия:\n");

qrcode.generate(mobileUrl, { small: true }, (qr) => {
  console.log(qr);
  console.log("  💡 Телефон и компьютер должны быть подключены к одному Wi-Fi!");
  console.log("=".repeat(64) + "\n");
});
