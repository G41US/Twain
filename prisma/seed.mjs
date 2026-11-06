// Demo data for local testing: `npm run seed`. Only touches users with @demo.twain emails.
// Sign in as you@demo.twain with DEMO_LOGIN=true (see README).
import { PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed demo users in production");

const prisma = new PrismaClient();
const avatar = (seed, bg) => `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=${bg}`;
const vibes = (...yes) =>
  Object.fromEntries(
    ["Pineapple on pizza is elite", "Cats > Dogs", "I believe in astrology", "I want kids someday", "I'm sober", "I reply to messages fast"]
      .map((q, i) => [q, yes.includes(i)]),
  );

const people = [
  { key: "you", name: "Alex", age: 27, gender: "Male", lookingFor: "Women", bio: "Software dev. Jollof critic. Will beat you at FIFA.", vibe: vibes(0, 3, 5), isAdmin: true, bg: "c0aede" },
  { key: "amara", name: "Amara", age: 25, gender: "Female", lookingFor: "Men", bio: "Architect by day, amateur baker by night. Tell me your favourite pastry.", vibe: vibes(0, 3, 5), replyRate: 92, bg: "ffd5dc" },
  { key: "zainab", name: "Zainab", age: 26, gender: "Female", lookingFor: "Everyone", bio: "Afrobeats on repeat. Looking for someone to explore Lagos food spots with.", vibe: vibes(0, 1, 3, 5), replyRate: 88, bg: "ffdfbf" },
  { key: "tolu", name: "Tolu", age: 24, gender: "Female", lookingFor: "Men", bio: "Med student. Sleep is a myth. Make me laugh and you win.", vibe: vibes(2, 3), replyRate: 61, bg: "d1d4f9" },
  { key: "chioma", name: "Chioma", age: 28, gender: "Female", lookingFor: "Men", bio: "Product designer. Plants, podcasts and long walks at Lekki Conservation Centre.", vibe: vibes(1, 3, 4, 5), replyRate: null, bg: "b6e3f4" },
  { key: "ife", name: "Ife", age: 23, gender: "Female", lookingFor: "Everyone", bio: "Photographer 📸 Let me take your picture — then buy me suya.", vibe: vibes(0, 2, 5), replyRate: 75, bg: "ffd5dc" },
  // Shouldn't appear for Alex (gender filter): a man, and a woman looking for women.
  { key: "daniel", name: "Daniel", age: 29, gender: "Male", lookingFor: "Women", bio: "Gym, football, shawarma.", vibe: vibes(5), replyRate: 40, bg: "c0aede" },
  { key: "nneka", name: "Nneka", age: 27, gender: "Female", lookingFor: "Women", bio: "Bookworm and coffee snob.", vibe: vibes(1), replyRate: 80, bg: "ffdfbf" },
];

const users = {};
for (const p of people) {
  const data = {
    name: p.name, age: p.age, gender: p.gender, lookingFor: p.lookingFor, bio: p.bio,
    vibeAnswers: p.vibe, replyRate: p.replyRate ?? null, isAdmin: p.isAdmin ?? false,
    photos: [avatar(p.name, p.bg)], dealbreakers: [], preferEthnicity: "all",
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
