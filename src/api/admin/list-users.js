// Dummy endpoint for user listing (replace with real DB logic)
export default async function handler(req, res) {
  // Example: fetch from your users table
  // const users = await db.query('SELECT id, name, email FROM users');
  // For now, return a static list
  res.json([
    { id: 'user1', name: 'Alice', email: 'alice@example.com' },
    { id: 'user2', name: 'Bob', email: 'bob@example.com' },
    { id: 'user3', name: 'Charlie', email: 'charlie@example.com' }
  ]);
}
