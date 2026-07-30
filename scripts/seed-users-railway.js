/**
 * Script para crear usuarios de prueba en Railway.
 * Se conecta a la BD de Railway usando DATABASE_URL y crea admin + usuario estándar.
 * 
 * Uso: node scripts/seed-users-railway.js
 * Requiere: DATABASE_URL en el entorno (Railway la provee automáticamente)
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL no está definida. Ejecutar con: railway run node scripts/seed-users-railway.js');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Verificar si ya hay usuarios
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const count = parseInt(countResult.rows[0].count, 10);
    console.log(`Usuarios existentes: ${count}`);

    if (count > 0) {
      console.log('Ya hay usuarios en la BD. Mostrando usuarios existentes:');
      const users = await pool.query('SELECT id, name, username, role, active FROM users ORDER BY id');
      users.rows.forEach(u => {
        console.log(`  - ID: ${u.id} | Name: ${u.name} | Username: ${u.username} | Role: ${u.role} | Active: ${u.active}`);
      });

      // Si no hay admin, lo creamos
      const adminExists = users.rows.some(u => u.role === 'admin');
      if (!adminExists) {
        console.log('No hay admin. Creando admin...');
        const hashedAdmin = await hashPassword('Admin1234');
        await pool.query(
          `INSERT INTO users (name, username, password, role, active, must_change_password)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          ['Admin', 'admin', hashedAdmin, 'admin', true, false]
        );
        console.log('Admin creado: admin / Admin1234');
      }

      // Si no hay usuario estándar, lo creamos
      const userExists = users.rows.some(u => u.role === 'user' || u.role === 'student');
      if (!userExists) {
        console.log('No hay usuario estándar. Creando...');
        const hashedUser = await hashPassword('User1234');
        await pool.query(
          `INSERT INTO users (name, username, password, role, active, must_change_password)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          ['Usuario', 'user', hashedUser, 'user', true, false]
        );
        console.log('Usuario creado: user / User1234');
      }
    } else {
      // No hay usuarios, creamos ambos
      console.log('No hay usuarios. Creando admin y usuario estándar...');

      const hashedAdmin = await hashPassword('Admin1234');
      await pool.query(
        `INSERT INTO users (name, username, password, role, active, must_change_password)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['Admin', 'admin', hashedAdmin, 'admin', true, false]
      );
      console.log('Admin creado: admin / Admin1234');

      const hashedUser = await hashPassword('User1234');
      await pool.query(
        `INSERT INTO users (name, username, password, role, active, must_change_password)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['Usuario', 'user', hashedUser, 'user', true, false]
      );
      console.log('Usuario creado: user / User1234');
    }

    // Mostrar resultado final
    const finalUsers = await pool.query('SELECT id, name, username, role, active FROM users ORDER BY id');
    console.log('\nUsuarios en la BD:');
    finalUsers.rows.forEach(u => {
      console.log(`  - ID: ${u.id} | Name: ${u.name} | Username: ${u.username} | Role: ${u.role} | Active: ${u.active}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
