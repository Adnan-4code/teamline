require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

const seed = async () => {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database...');
    await client.query('BEGIN');

    // Clear existing data
    await client.query('DELETE FROM tasks');
    await client.query('DELETE FROM project_members');
    await client.query('DELETE FROM projects');
    await client.query('DELETE FROM users');

    // Create users
    const adminPass = await bcrypt.hash('admin123', 10);
    const memberPass = await bcrypt.hash('member123', 10);
    const pass3 = await bcrypt.hash('pass123', 10);

    const { rows: [admin] } = await client.query(
      `INSERT INTO users (name, email, password, role, avatar)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      ['Alex Rivera', 'admin@demo.com', adminPass, 'Admin', 'AR']
    );
    const { rows: [member] } = await client.query(
      `INSERT INTO users (name, email, password, role, avatar)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      ['Sam Chen', 'member@demo.com', memberPass, 'Member', 'SC']
    );
    const { rows: [member2] } = await client.query(
      `INSERT INTO users (name, email, password, role, avatar)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      ['Jordan Lee', 'jordan@demo.com', pass3, 'Member', 'JL']
    );

    // Create projects
    const { rows: [p1] } = await client.query(
      `INSERT INTO projects (name, description, color, owner_id)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      ['Website Redesign', 'Revamp the company website UI/UX', '#6366f1', admin.id]
    );
    const { rows: [p2] } = await client.query(
      `INSERT INTO projects (name, description, color, owner_id)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      ['Mobile App v2', 'Build iOS/Android app with new features', '#f59e0b', admin.id]
    );

    // Add members
    await client.query(
      `INSERT INTO project_members (project_id, user_id) VALUES ($1,$2),($1,$3),($1,$4)`,
      [p1.id, admin.id, member.id, member2.id]
    );
    await client.query(
      `INSERT INTO project_members (project_id, user_id) VALUES ($1,$2),($1,$3)`,
      [p2.id, admin.id, member2.id]
    );

    // Create tasks
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 2);
    const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 5);
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const fmt = d => d.toISOString().split('T')[0];

    await client.query(
      `INSERT INTO tasks (project_id, title, description, assignee_id, created_by, status, priority, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [p1.id, 'Design new homepage', 'Create Figma mockups for homepage', member.id, admin.id, 'In Progress', 'High', fmt(tomorrow)]
    );
    await client.query(
      `INSERT INTO tasks (project_id, title, description, assignee_id, created_by, status, priority, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [p1.id, 'Write content copy', 'Draft all page copy', member2.id, admin.id, 'Todo', 'Medium', fmt(nextWeek)]
    );
    await client.query(
      `INSERT INTO tasks (project_id, title, description, assignee_id, created_by, status, priority, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [p1.id, 'Setup CI/CD pipeline', 'Configure GitHub Actions', admin.id, admin.id, 'Done', 'High', fmt(yesterday)]
    );
    await client.query(
      `INSERT INTO tasks (project_id, title, description, assignee_id, created_by, status, priority, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [p2.id, 'Auth module', 'JWT auth with refresh tokens', admin.id, admin.id, 'In Progress', 'High', fmt(tomorrow)]
    );
    await client.query(
      `INSERT INTO tasks (project_id, title, description, assignee_id, created_by, status, priority, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [p2.id, 'Push notifications', 'Integrate Firebase push', member2.id, admin.id, 'Todo', 'Low', fmt(twoDaysAgo)]
    );

    await client.query('COMMIT');
    console.log('✅ Seed complete!');
    console.log('\nDemo accounts:');
    console.log('  admin@demo.com  / admin123  (Admin)');
    console.log('  member@demo.com / member123 (Member)');
    console.log('  jordan@demo.com / pass123   (Member)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
