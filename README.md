# Images API

REST API for uploading, processing, and serving images. Built with NestJS, PostgreSQL, and S3-compatible storage (MinIO).

## Quick Start

The entire stack runs in Docker. No local dependencies required beyond Docker and Docker Compose.

```bash
git clone https://github.com/ulwanski/image-api
cd image-api
docker compose up
```

The API will be available at `http://localhost:8080` once all health checks pass. Database migrations run automatically on startup.

## API Endpoints

### Upload an image

```
POST /images
Content-Type: multipart/form-data
```

| Field    | Type   | Required | Description                          |
|----------|--------|----------|--------------------------------------|
| `file`   | file   | yes      | Image file (JPEG, PNG, WebP, GIF, TIFF, AVIF) |
| `title`  | string | yes      | Image title (max 255 characters)     |
| `width`  | number | no       | Target width in pixels               |
| `height` | number | no       | Target height in pixels              |

When `width` or `height` are provided and differ from the original dimensions, the image is resized using the `inside` fit strategy (preserving aspect ratio, without enlargement) and optimized for file size while preserving the original format.

Example with curl:

```bash
curl -X POST http://localhost:8080/images \
  -F 'file=@photo.jpg' \
  -F 'title=Sunset at the beach' \
  -F 'width=800' \
  -F 'height=600'
```

Response (`201 Created`):

```json
{
  "id": 1,
  "title": "Sunset at the beach",
  "url": "http://localhost:8080/images/1/raw",
  "width": 800,
  "height": 600,
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

### Get image metadata

```
GET /images/:id
```

Returns the image object with `id`, `url`, `title`, `width`, and `height`.

Response (`200 OK`):

```json
{
  "id": 1,
  "title": "Sunset at the beach",
  "url": "http://localhost:8080/images/1/raw",
  "width": 800,
  "height": 600,
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

### Get image file

```
GET /images/:id/raw
```

Returns the binary image file with appropriate `Content-Type`, `Content-Length`, and `Content-Disposition` headers.

### List images

```
GET /images
```

| Parameter | Type   | Default | Description                        |
|-----------|--------|---------|------------------------------------|
| `title`   | string | -       | Filter by title (case-insensitive, partial match) |
| `page`    | number | 1       | Page number                        |
| `limit`   | number | 20      | Items per page (max 100)           |

Response (`200 OK`):

```json
{
  "data": [
    {
      "id": 1,
      "title": "Sunset at the beach",
      "url": "http://localhost:8080/images/1/raw",
      "width": 800,
      "height": 600,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### Health check

```
GET /status
```

Returns the application and database health status.

## API Documentation

Interactive Swagger documentation is available at `http://localhost:8080/api-docs` when the application is running.

## Architecture

The project follows a layered architecture with clear separation of concerns:

```
src/
├── application/          Shared DTOs, interfaces, filters, and interceptors
│   ├── dto/              Request/response data transfer objects
│   ├── filters/          Global exception filter
│   ├── interceptors/     Base URL injection, file upload handling
│   └── interfaces/       Storage and metadata contracts
├── domain/               Business logic organized by feature
│   ├── images/           Core image feature
│   │   ├── controller/   HTTP layer - routing, validation, response mapping
│   │   ├── services/     Business logic - orchestration, processing, file management
│   │   └── repository/   Data access - PostgreSQL queries
│   └── status-page/      Health check endpoint
├── infrastructure/        External concerns
│   ├── database/         PostgreSQL connection pool, migrations
│   └── storage/          Pluggable storage backends (local filesystem, S3)
└── main.ts               Application bootstrap
```

### Key design decisions

**Pluggable storage backends.** The `StorageService` interface is implemented by both `LocalStorageService` (filesystem) and `S3StorageService` (S3-compatible, e.g. MinIO). The active backend is selected at startup via the `STORAGE_BACKEND` environment variable through a factory provider, with no code changes required to switch between them.

**Content-addressable file storage.** Uploaded files are stored under a SHA-256 hash-based path (e.g. `a5/fe/34/a5fe34...abc.jpg`). This provides natural deduplication - uploading the same file twice produces the same storage key - and distributes files evenly across directory shards.

**Separation of HTTP and business logic.** Controllers handle only request parsing and response mapping. The `ImageService` orchestrates the upload flow (metadata detection, optional resize, storage, database persistence) by delegating to focused services: `FileService` for storage operations and `ImageConvertService` for image processing. Each service has a single responsibility and is independently testable.

**Automatic database migrations.** Migrations run before the NestJS application starts, using `node-pg-migrate`. This ensures the schema is always up to date without manual intervention.

**Base URL injection via interceptor.** Image URLs in responses are relative internally (`/images/:id/raw`) and get the full base URL (`http://host:port/...`) injected automatically by the `BaseUrlInterceptor`, derived from the incoming request's `Host` header. This keeps services agnostic of deployment details.

## Infrastructure

The Docker Compose stack consists of three services:

| Service      | Image                | Port(s)     | Purpose                  |
|--------------|----------------------|-------------|--------------------------|
| `api`        | Node 24 Alpine       | 8080        | NestJS application       |
| `postgres`   | PostgreSQL 18 Alpine | 5432        | Relational database      |
| `minio`      | MinIO                | 9000, 9001  | S3-compatible storage    |

All services include health checks. The API waits for both PostgreSQL and MinIO to be healthy before starting.

The Dockerfile uses a multi-stage build:

- **base** - installs dependencies
- **development** - mounts source with hot reload (`nest start --watch`)
- **builder** - compiles TypeScript
- **production** - minimal image with only production dependencies and compiled output

## Environment Variables

| Variable          | Default           | Description                              |
|-------------------|-------------------|------------------------------------------|
| `PORT`            | `8080`            | Application port                         |
| `DB_HOST`         | -                 | PostgreSQL host                          |
| `DB_PORT`         | `5432`            | PostgreSQL port                          |
| `DB_NAME`         | -                 | Database name                            |
| `DB_USER`         | -                 | Database user                            |
| `DB_PASSWORD`     | -                 | Database password                        |
| `STORAGE_BACKEND` | `local`           | Storage driver: `local` or `s3`          |
| `S3_ENDPOINT`     | -                 | S3-compatible endpoint URL               |
| `S3_KEY_ID`       | -                 | S3 access key ID                         |
| `S3_ACCESS_KEY`   | -                 | S3 secret access key                     |
| `S3_BUCKET`       | `default`         | S3 bucket name (created automatically)   |
| `S3_REGION`       | `eu-central-1`    | S3 region                                |

## Testing

### Unit tests

Unit tests cover controllers, services, and the image processing module. All external dependencies are mocked.

```bash
# Run inside the container
docker compose exec api npm test

# With coverage
docker compose exec api npm run test:cov
```

### End-to-end tests

E2E tests run against the full stack (real database, real storage) inside the Docker environment.

```bash
docker compose exec api npm run test:e2e
```

### Linting and formatting

```bash
docker compose exec api npm run lint
docker compose exec api npm run format
```

## Tech Stack

| Concern            | Technology                          |
|--------------------|-------------------------------------|
| Runtime            | Node.js 24 LTS                     |
| Framework          | NestJS 11                           |
| Language           | TypeScript 5.7                      |
| Database           | PostgreSQL 18                       |
| Migrations         | node-pg-migrate                     |
| Storage            | MinIO (S3-compatible) / filesystem  |
| Image processing   | sharp                               |
| Validation         | class-validator, class-transformer  |
| API documentation  | Swagger (OpenAPI v3)                |
| Testing            | Jest, supertest                     |
| Containerization   | Docker, Docker Compose              |
