import { neon } from '@neondatabase/serverless';


const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(connectionString);

async function main() {
  console.log("Connecting to Neon and setting up tables...");

  await sql`
    CREATE TABLE IF NOT EXISTS members (
      phone VARCHAR(20) PRIMARY KEY,
      points INT NOT NULL DEFAULT 0,
      total_visits INT NOT NULL DEFAULT 0,
      redeemed_count INT NOT NULL DEFAULT 0,
      last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log("Table 'members' ready.");

  await sql`
    CREATE TABLE IF NOT EXISTS stamp_logs (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) NOT NULL,
      action VARCHAR(20) NOT NULL,
      points_change INT NOT NULL,
      current_points INT NOT NULL,
      note TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log("Table 'stamp_logs' ready.");

  // Test query
  const testCount = await sql`SELECT count(*) FROM members;`;
  console.log("Current members count:", testCount[0].count);
  console.log("Database initialized successfully!");
}

main().catch((err) => {
  console.error("Error initializing database:", err);
  process.exit(1);
});
