# Relógio de Energia - Backend API

Backend API for the Relógio de Energia application using Node.js, Express, TypeScript, and PostgreSQL.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://postgres:jjs@1522@db.lletihfkloulzksdehro.supabase.co:5432/postgres
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

3. Run database migration:
```bash
npm run migrate
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires authentication)

### Devices
- `GET /api/devices` - Get all devices (requires authentication)
- `GET /api/devices/:id` - Get device by ID (requires authentication)
- `POST /api/devices` - Create device (requires authentication)
- `PUT /api/devices/:id` - Update device (requires authentication)
- `DELETE /api/devices/:id` - Delete device (requires authentication)

### Bills
- `GET /api/bills` - Get all bills (requires authentication)
- `GET /api/bills/:id` - Get bill by ID (requires authentication)
- `POST /api/bills` - Create bill (requires authentication)
- `PUT /api/bills/:id` - Update bill (requires authentication)
- `DELETE /api/bills/:id` - Delete bill (requires authentication)

### Dashboard
- `GET /api/dashboard` - Get dashboard data (requires authentication)

## Architecture

The backend follows MVC (Model-View-Controller) architecture:
- **Models**: Database interaction layer (`src/models/`)
- **Controllers**: Request handling and business logic (`src/controllers/`)
- **Routes**: API route definitions (`src/routes/`)
- **Middleware**: Authentication and other middleware (`src/middleware/`)

## Database Schema

- `tb_usuarios` - User accounts
- `tb_dispositivos` - IoT energy meters
- `tb_fatura` - Energy bills

## Troubleshooting

### Database Connection Issues

If you encounter connection timeout errors:

1. **Check DATABASE_URL format**: Ensure it's in the format:
   ```
   postgresql://user:password@host:port/database
   ```

2. **For Supabase connections**: 
   - Verify your project is active
   - Check if the connection string uses the correct hostname
   - Ensure SSL is enabled (the code handles this automatically)

3. **Network issues**:
   - Check firewall settings
   - Verify internet connectivity
   - Try using a VPN if your network blocks database connections

4. **IPv6 timeout issues**:
   - The connection will automatically retry 3 times
   - If timeout persists, check your network's IPv6 support
   - Consider using a connection pooler like Supabase's connection pooler

5. **Test connection manually**:
   ```bash
   npm run test:db
   ```

### Server starts without database connection

The server will now start even if the database connection fails initially. This allows you to:
- Fix the database connection while the server is running
- Test other parts of the application
- The server will show a warning but continue running

**Note**: API endpoints that require database access will fail until the connection is established.


