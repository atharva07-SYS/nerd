import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const topicsData = [
  { category: "Indian Mythology & Ancient Theories", title: "The Nine Forms of Shakti and What They Actually Symbolize" },
  { category: "Indian Mythology & Ancient Theories", title: "Vimana Texts — Ancient Flying Machines or Poetic Metaphor?" },
  { category: "Indian Mythology & Ancient Theories", title: "The Saptarishi (Seven Sages) and Their Cosmic Role" },
  { category: "Indian Mythology & Ancient Theories", title: "Kalki Avatar — Prophecy, Timing, and Symbolism" },
  { category: "Indian Mythology & Ancient Theories", title: "The Real Geography Behind the Mahabharata War" },
  { category: "Indian Mythology & Ancient Theories", title: "Nagas — Serpent Beings Between Myth and Lost Civilizations" },
  { category: "Indian Mythology & Ancient Theories", title: "The Astronomical Codes Hidden in the Vedas" },
  { category: "Indian Mythology & Ancient Theories", title: "Lemuria and Kumari Kandam — India's \"Lost Continent\" Legend" },
  { category: "Bengal, Tantra & Occult Reputation", title: "Why Bengal Became India's Center of Tantra" },
  { category: "Bengal, Tantra & Occult Reputation", title: "History of Kali Worship and Its Misunderstood Symbolism" },
  { category: "Bengal, Tantra & Occult Reputation", title: "Tantric Sadhana vs Black Magic — Where Myth and Practice Diverge" },
  { category: "Bengal, Tantra & Occult Reputation", title: "Colonial-Era Origins of the \"Black Magician\" Bengali Stereotype" },
  { category: "Bengal, Tantra & Occult Reputation", title: "Aghori Practices — Facts vs Sensationalism" },
  { category: "Genius / Cognitive Mastery", title: "The Neuroscience of Deep Focus and Flow States" },
  { category: "Genius / Cognitive Mastery", title: "Feynman Technique — Learning Like a Genius" },
  { category: "Genius / Cognitive Mastery", title: "Memory Palaces and Ancient Mnemonic Systems" },
  { category: "Genius / Cognitive Mastery", title: "How Polymaths Think — Da Vinci to Ramanujan" },
  { category: "Genius / Cognitive Mastery", title: "Sleep, Neuroplasticity, and Peak Cognitive Performance" },
  { category: "Genius / Cognitive Mastery", title: "First Principles Thinking — Elon Musk's Mental Model" },
  { category: "Genius / Cognitive Mastery", title: "The Science of IQ vs Creative Intelligence" },
  { category: "God vs Evil / Philosophy", title: "Dharma vs Adharma — Cosmic Balance in Hindu Thought" },
  { category: "God vs Evil / Philosophy", title: "The Problem of Evil — Philosophical Debate Across Religions" },
  { category: "God vs Evil / Philosophy", title: "Zoroastrianism's Duality — Ahura Mazda vs Angra Mainyu" },
  { category: "God vs Evil / Philosophy", title: "Free Will, Karma, and Moral Responsibility" },
  { category: "God vs Evil / Philosophy", title: "Lucifer's Myth — Fallen Angel Across Cultures" },
  { category: "Science", title: "Quantum Entanglement Explained Simply" },
  { category: "Science", title: "CRISPR and the Future of Human Genetic Editing" },
  { category: "Science", title: "Black Holes — What Happens Beyond the Event Horizon" },
  { category: "Science", title: "The Fermi Paradox — Where Is Everybody?" },
  { category: "Science", title: "String Theory vs Loop Quantum Gravity" },
  { category: "Politics", title: "Rise of the Multipolar World Order — US, China, India" },
  { category: "Politics", title: "Understanding Geopolitics of the Indo-Pacific" },
  { category: "Politics", title: "Evolution of India's Foreign Policy Since Independence" },
  { category: "Politics", title: "Populism's Global Rise — Causes and Patterns" },
  { category: "History", title: "The Silk Road's Hidden Influence on Modern Trade" },
  { category: "History", title: "Fall of the Maurya and Gupta Empires — Lessons in Power" },
  { category: "History", title: "Partition of India — Causes, Chaos, Consequences" },
  { category: "History", title: "The Cold War's Shadow Wars in Asia" },
  { category: "Biopics / Ideal Figures", title: "A.P.J. Abdul Kalam — The People's President" },
  { category: "Biopics / Ideal Figures", title: "Swami Vivekananda — Discipline, Purpose, and Global Vision" },
  { category: "Biopics / Ideal Figures", title: "Nikola Tesla — Genius Sacrificed for Humanity" },
  { category: "Biopics / Ideal Figures", title: "Chanakya — Strategy, Ethics, and Statecraft" },
  { category: "Biopics / Ideal Figures", title: "Marie Curie — Relentless Pursuit of Knowledge" }
];

async function main() {
  console.log("Seeding master topics list...");

  for (const topic of topicsData) {
    await prisma.topic.upsert({
      where: { title: topic.title },
      update: { category: topic.category },
      create: {
        category: topic.category,
        title: topic.title,
      },
    });
  }

  console.log(`Successfully seeded ${topicsData.length} master topics.`);

  // Seed default Owner Account
  const ownerEmail = "owner@thedraw.archive";
  const ownerPass = "ownerpassword123";
  const passwordHash = await bcrypt.hash(ownerPass, 10);

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      role: "admin",
      passwordHash,
      name: "Platform Owner",
    },
    create: {
      email: ownerEmail,
      name: "Platform Owner",
      passwordHash,
      role: "admin",
    },
  });

  console.log(`Successfully seeded Owner account (${ownerEmail}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
