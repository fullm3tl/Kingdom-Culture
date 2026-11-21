// Kingdom Kulture – Myth or Truth. Zero dependencies; run with: node server.js
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000;
const KEY = process.env.HOST_KEY || 'kingdom';
if (!process.env.HOST_KEY) console.warn('HOST_KEY not set – using the default "kingdom". Set HOST_KEY before going public.');

// [statement, answer (M = Myth, T = Truth), verses [[reference, text], ...]]
// Leave a verse's text as "" to show only the reference.
const V = (ref, text = '') => [ref, text];
const Q = [
["Chemistry is enough to build a lasting relationship.","M",[]],
["Sex was designed by God, not created by culture.","T",[
  V("Genesis 2:24-25","Therefore a man shall leave his father and his mother and hold fast to his wife, and they shall become one flesh. And the man and his wife were both naked and were not ashamed."),
  V("Proverbs 5:18-19","Let your fountain be blessed,\nand rejoice in the wife of your youth,\na lovely deer, a graceful doe.\nLet her breasts fill you at all times with delight;\nbe intoxicated always in her love.")]],
["If two people love each other, sex outside of marriage is automatically acceptable in God’s eyes.","M",[V("1 Corinthians 6:18-20","Flee from sexual immorality. Every other sin a person commits is outside the body, but the sexually immoral person sins against his own body. Or do you not know that your body is a temple of the Holy Spirit within you, whom you have from God? You are not your own, for you were bought with a price. So glorify God in your body.")]],
["Sexual purity is only about physical behavior; your thoughts and intentions don’t matter.","M",[V("Matthew 5:27-28","“You have heard that it was said, ‘You shall not commit adultery.’ But I say to you that everyone who looks at a woman with lustful intent has already committed adultery with her in his heart.”")]],
["God designed sex to be enjoyed within the covenant of marriage.","T",[V("Hebrews 13:4","Let marriage be held in honor among all, and let the marriage bed be undefiled, for God will judge the sexually immoral and adulterous.")]],
["Waiting until marriage is outdated and unrealistic.","M",[V("1 Thessalonians 4:3-5","For this is the will of God, your sanctification: that you abstain from sexual immorality; that each one of you know how to control his own body in holiness and honor, not in the passion of lust like the Gentiles who do not know God;")]],
["If someone truly loves you, they will respect your boundaries.","T",[
  V("2 Timothy 2:22","So flee youthful passions and pursue righteousness, faith, love, and peace, along with those who call on the Lord from a pure heart."),
  V("1 Corinthians 6:18","Flee from sexual immorality. Every other sin a person commits is outside the body, but the sexually immoral person sins against his own body.")]],
["Marriage is about finding someone who makes you happy.","M",[
  V("1 Peter 4:12-13","Beloved, do not be surprised at the fiery trial when it comes upon you to test you, as though something strange were happening to you. But rejoice insofar as you share Christ’s sufferings, that you may also rejoice and be glad when his glory is revealed."),
  V("John 16:33","I have said these things to you, that in me you may have peace. In the world you will have tribulation. But take heart; I have overcome the world.")]],
["You can be spiritually mature and still make poor relationship decisions.","T",[
  V("1 Kings 11:1","Now King Solomon loved many foreign women, along with the daughter of Pharaoh: Moabite, Ammonite, Edomite, Sidonian, and Hittite women,"),
  V("2 Samuel 11:3-4","And David sent and inquired about the woman. And one said, “Is not this Bathsheba, the daughter of Eliam, the wife of Uriah the Hittite?” So David sent messengers and took her..."),
  V("1 Corinthians 10:12","Therefore let anyone who thinks that he stands take heed lest he fall.")]],
["You can love someone and still recognize that a relationship is unhealthy.","T",[]],
["Marriage is a covenant, not just a romantic commitment.","T",[
  V("Proverbs 2:17","who forsakes the companion of her youth\nand forgets the covenant of her God;"),
  V("Matthew 19:5","and said, ‘Therefore a man shall leave his father and his mother and hold fast to his wife, and the two shall become one flesh’?")]],
["You can be physically attracted to someone and still recognize that they aren’t right for you.","T",[
  V("Proverbs 4:23","Keep your heart with all vigilance,\nfor from it flow the springs of life."),
  V("Proverbs 31:30","Charm is deceitful, and beauty is vain,\nbut a woman who fears the Lord is to be praised."),
  V("1 Samuel 16:7","But the Lord said to Samuel, “Do not look on his appearance or on the height of his stature, because I have rejected him. For the Lord sees not as man sees: man looks on the outward appearance, but the Lord looks on the heart.”")]],
["Being equally yoked means you simply attend the same church.","M",[V("2 Corinthians 6:14","Do not be unequally yoked with unbelievers. For what partnership has righteousness with lawlessness? Or what fellowship has light with darkness?")]],
["Someone’s potential should matter more than their current character.","M",[V("Matthew 7:16","You will recognize them by their fruits. Are grapes gathered from thornbushes, or figs from thistles?")]]
];

let S = { phase: 'lobby', endsAt: 0, reveal: -1, round: 0 };
let votes = {};            // uid -> { questionIndex: 'M'|'T' }
const players = new Set(), clients = new Set();
let dirty = false;

function snap() {
  const r = S.reveal; let tally = null;
  if (r >= 0 && r < Q.length) {
    let m = 0, t = 0;
    for (const u in votes) { const a = votes[u][r]; if (a === 'M') m++; else if (a === 'T') t++; }
    tally = { m, t };
  }
  let finished = 0;
  for (const u in votes) if (Object.keys(votes[u]).length >= Q.length) finished++;
  // answers are only sent once revealed
  const key = Q.slice(0, Math.max(0, r + 1)).map(q => ({ a: q[1], refs: q[2] }));
  let summary = null;
  if (r >= Q.length) {
    let people = 0, high = 0;
    for (const u in votes) {
      people++;
      let ok = 0; Q.forEach((q, i) => { if (votes[u][i] === q[1]) ok++; });
      if (ok / Q.length >= 0.8) high++;
    }
    summary = { people, high, need: Math.ceil(Q.length * 0.8) };
  }
  return { ...S, now: Date.now(), players: players.size, finished, tally, key, summary, total: Q.length };
}
function broadcast() {
  dirty = false;
  const msg = `data: ${JSON.stringify(snap())}\n\n`;
  for (const c of clients) c.write(msg);
}
setInterval(() => {
  if (S.phase === 'answering' && Date.now() >= S.endsAt) { S.phase = 'reveal'; S.reveal = -1; broadcast(); }
  else if (dirty) broadcast();
}, 500);
setInterval(() => { for (const c of clients) c.write(': ping\n\n'); }, 15000);

// Works whether the files are in ./public or sit next to server.js
const find = f => [path.join(__dirname, 'public', f), path.join(__dirname, f)].find(p => fs.existsSync(p));
const page = fs.readFileSync(find('index.html'));
const logo = fs.readFileSync(find('logo.png'));
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
const body = req => new Promise(ok => { let b = ''; req.on('data', d => { b += d; if (b.length > 1e4) req.destroy(); }); req.on('end', () => { try { ok(JSON.parse(b)); } catch { ok({}); } }); });

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(page);
  }
  if (req.method === 'GET' && url.pathname === '/logo.png') {
    res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' }); return res.end(logo);
  }
  if (req.method === 'GET' && url.pathname === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const uid = (url.searchParams.get('uid') || '').slice(0, 40);
    if (uid) players.add(uid);
    clients.add(res);
    res.write(`data: ${JSON.stringify({ ...snap(), questions: Q.map(q => q[0]) })}\n\n`);
    dirty = true;
    req.on('close', () => clients.delete(res));
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/me') {
    return json(res, 200, { round: S.round, answers: votes[url.searchParams.get('uid')] || {} });
  }
  if (req.method === 'POST' && url.pathname === '/api/vote') {
    const b = await body(req), q = b.q;
    if (S.phase !== 'answering' || Date.now() >= S.endsAt) return json(res, 409, { error: 'locked' });
    if (typeof b.uid !== 'string' || b.uid.length > 40 || !Number.isInteger(q) || q < 0 || q >= Q.length || (b.a !== 'M' && b.a !== 'T')) return json(res, 400, {});
    (votes[b.uid] = votes[b.uid] || {})[q] = b.a; players.add(b.uid); dirty = true;
    return json(res, 200, { ok: true });
  }
  if (req.method === 'POST' && url.pathname === '/api/host') {
    const b = await body(req);
    if (b.key !== KEY) return json(res, 403, { error: 'bad key' });
    if (b.action === 'start') {
      const m = Math.min(120, Math.max(1, Number(b.minutes) || 15));
      S = { phase: 'answering', endsAt: Date.now() + m * 60000, reveal: -1, round: Date.now() }; votes = {};
    } else if (b.action === 'plus' && S.phase === 'answering') S.endsAt += 60000;
    else if (b.action === 'end' && S.phase === 'answering') { S.phase = 'reveal'; S.reveal = -1; }
    else if (b.action === 'prev' && S.phase === 'reveal' && S.reveal > 0) S.reveal--;
    else if (b.action === 'next' && S.phase === 'reveal' && S.reveal < Q.length) S.reveal++;
    else if (b.action === 'reset') { S = { phase: 'lobby', endsAt: 0, reveal: -1, round: S.round }; votes = {}; }
    broadcast(); return json(res, 200, { ok: true });
  }
  res.writeHead(404); res.end('Not found');
}).listen(PORT, () => console.log(`Myth or Truth running on port ${PORT}`));
