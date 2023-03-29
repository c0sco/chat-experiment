const EMOJIS = [
  "😀", "😃", "😆", "😇", "😈", "🙂", "😉", "😌", "😍", "😎",
  "😏", "😐", "😑", "😒", "😓", "😔", "😕", "😖", "😗", "😘",
  "😙", "😚", "😛", "😜", "😝", "😞", "😟", "😠", "😡", "😢",
  "😣", "😤", "😥", "😦", "😧", "😨", "😩", "😪", "😫", "😬",
  "😭", "😮", '🤠', "😰", "😱", "😲", "😳", "😴", "😵", "😶"
];

function generateEmoji(ipAddress, userAgent) {
  const input = ipAddress + userAgent;
  let sum = 0;

  for (let i = 0; i < input.length; i++) {
    sum += input.charCodeAt(i);
  }

  return EMOJIS[sum % EMOJIS.length];
}

function intToRGB(i) {
  const c = (i & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

function generateColor(ip, userAgent) {
  const input = ip + userAgent;
  let hash = 0;

  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // Convert to a 32-bit integer
  }

  return intToRGB(hash);
}



module.exports = { generateColor, generateEmoji };
