// Demo data for local testing: `npm run seed`. Only touches users with @demo.twain emails.
// Sign in as you@demo.twain with DEMO_LOGIN=true (see README).
import { PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed demo users in production");

const prisma = new PrismaClient();
// iOS Contacts-style placeholder: white initials on a grey gradient (no cartoon avatars).
const avatar = (name) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A5ABB8"/><stop offset="1" stop-color="#858994"/></linearGradient></defs><rect width="300" height="400" fill="url(#g)"/><text x="150" y="230" font-family="-apple-system,Helvetica,Arial,sans-serif" font-size="120" font-weight="600" fill="#fff" text-anchor="middle">${name.slice(0, 1).toUpperCase()}</text></svg>`,
  );
const vibes = (...yes) =>
  Object.fromEntries(
    ["Pineapple on pizza is elite", "Cats > Dogs", "I believe in astrology", "I want kids someday", "I'm sober", "I reply to messages fast"]
      .map((q, i) => [q, yes.includes(i)]),
  );

const people = [
  { key: "you", name: "Alex", age: 27, gender: "Male", lookingFor: "Women", bio: "Software dev. Jollof critic. Will beat you at FIFA.", vibe: vibes(0, 3, 5), isAdmin: true },
  { key: "amara", name: "Amara", age: 25, gender: "Female", lookingFor: "Men", bio: "Architect by day, amateur baker by night. Tell me your favourite pastry.", vibe: vibes(0, 3, 5), replyRate: 92 },
  { key: "zainab", name: "Zainab", age: 26, gender: "Female", lookingFor: "Everyone", bio: "Afrobeats on repeat. Looking for someone to explore Lagos food spots with.", vibe: vibes(0, 1, 3, 5), replyRate: 88 },
  { key: "tolu", name: "Tolu", age: 24, gender: "Female", lookingFor: "Men", bio: "Med student. Sleep is a myth. Make me laugh and you win.", vibe: vibes(2, 3), replyRate: 61 },
  { key: "chioma", name: "Chioma", age: 28, gender: "Female", lookingFor: "Men", bio: "Product designer. Plants, podcasts and long walks at Lekki Conservation Centre.", vibe: vibes(1, 3, 4, 5), replyRate: null },
  { key: "ife", name: "Ife", age: 23, gender: "Female", lookingFor: "Everyone", bio: "Photographer 📸 Let me take your picture — then buy me suya.", vibe: vibes(0, 2, 5), replyRate: 75 },
  // Shouldn't appear for Alex (gender filter): a man, and a woman looking for women.
  { key: "daniel", name: "Daniel", age: 29, gender: "Male", lookingFor: "Women", bio: "Gym, football, shawarma.", vibe: vibes(5), replyRate: 40 },
  { key: "nneka", name: "Nneka", age: 27, gender: "Female", lookingFor: "Women", bio: "Bookworm and coffee snob.", vibe: vibes(1), replyRate: 80 },
];

const users = {};
for (const p of people) {
  const data = {
    name: p.name, age: p.age, gender: p.gender, lookingFor: p.lookingFor, bio: p.bio,
    vibeAnswers: p.vibe, replyRate: p.replyRate ?? null, isAdmin: p.isAdmin ?? false,
    photos: [avatar(p.name)], dealbreakers: [], traits: [], preferEthnicity: "all",
    // Spread around Lagos so distances differ
    latitude: 6.45 + people.indexOf(p) * 0.03, longitude: 3.47 + people.indexOf(p) * 0.02,
    acceptedTermsAt: p.key === "you" ? null : new Date(), verified: ["amara", "zainab"].includes(p.key),
  };
  users[p.key] = await prisma.user.upsert({ where: { email: `${p.key}@demo.twain` }, create: { email: `${p.key}@demo.twain`, ...data }, update: data });
}

const like = (a, b) =>
  prisma.like.upsert({ where: { likerId_likedId: { likerId: users[a].id, likedId: users[b].id } }, create: { likerId: users[a].id, likedId: users[b].id }, update: {} });

// Zainab already likes Alex, so liking her back makes a match.
await like("zainab", "you");

// Alex and Amara are already matched with a conversation.
await like("you", "amara");
await like("amara", "you");
const [user1Id, user2Id] = [users.you.id, users.amara.id].sort();
const match = await prisma.match.upsert({ where: { user1Id_user2Id: { user1Id, user2Id } }, create: { user1Id, user2Id }, update: {} });
if ((await prisma.message.count({ where: { matchId: match.id } })) === 0) {
  const t = Date.now() - 3600_000;
  const msgs = [
    ["amara", "Hey Alex! Your bio says jollof critic… what's your verdict on party jollof? 👀"],
    ["you", "Party jollof is undefeated, no debate 😂 What's the best thing you've baked?"],
    ["amara", "Chin chin cheesecake. Don't knock it till you try it."],
  ];
  for (const [i, [who, body]] of msgs.entries()) {
    await prisma.message.create({ data: { matchId: match.id, senderId: users[who].id, body, createdAt: new Date(t + i * 60_000) } });
  }
}

// One report so the admin queue has something in it.
if ((await prisma.report.count({ where: { reportedId: users.daniel.id } })) === 0) {
  await prisma.report.create({ data: { reporterId: users.tolu.id, reportedId: users.daniel.id, reason: "Asked for money after two messages." } });
}

console.log(`Seeded ${people.length} demo users. Sign in as you@demo.twain`);
await prisma.$disconnect();
