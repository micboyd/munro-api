# Munro API

REST API powering [munrolocator.com](https://munrolocator.com) — a hill-bagging tracker for the ~3,385 mountains of the UK and Ireland (Munros, Corbetts, Grahams, Donalds, and more).

Built with **Node.js**, **Express**, and **MongoDB**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Mountains](#mountains)
  - [Completed Mountains](#completed-mountains)
  - [Planned Mountains](#planned-mountains)
  - [Trip Plans](#trip-plans)
  - [User Profile](#user-profile)
  - [Goals](#goals)
  - [Stats](#stats)
  - [Recent Activity](#recent-activity)

---

## Tech Stack

| Package | Purpose |
|---|---|
| Express | HTTP server and routing |
| Mongoose | MongoDB ODM |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT-based authentication |
| Cloudinary | Profile image and summit photo storage |
| Multer | Multipart form / file upload parsing |
| Resend | Transactional email (account confirmation) |
| dotenv | Environment variable loading |

---

## Getting Started

**Prerequisites:** Node.js 18+ and a running MongoDB instance.

```bash
git clone https://github.com/micboyd/munro-api.git
cd munro-api
npm install
```

Copy the example env file and fill in your values (see [Environment Variables](#environment-variables) below):

```bash
cp .env.example .env
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key used to sign JWT tokens |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RESEND_API_KEY` | Resend API key for confirmation emails |
| `PORT` | Port to listen on (default: `3000`) |

---

## Running the Server

```bash
# Production
npm start

# Development (auto-restart via nodemon)
npm run dev
```

The server connects to MongoDB first and only starts listening once the connection succeeds.

---

## API Reference

All endpoints are prefixed with `/api`. All request and response bodies use **JSON** unless noted otherwise.

Authentication uses **Bearer tokens** — include the JWT returned by `/api/auth/login` in the `Authorization` header:

```
Authorization: Bearer <token>
```

---

### Authentication

#### Register

```
POST /api/auth/register
```

Creates a new user account and sends a confirmation email. The account cannot be used until the email link is clicked.

**Body**

| Field | Type | Required |
|---|---|---|
| `username` | string | Yes |
| `password` | string | Yes |

**Response `201`**

```json
{ "msg": "User registered. Check your email to confirm your account." }
```

---

#### Confirm Email

```
GET /api/auth/confirm/:token
```

Verifies the account using the token emailed on registration. Tokens expire after 24 hours.

**Response `200`**

```json
{ "msg": "Account confirmed. You can now log in." }
```

---

#### Login

```
POST /api/auth/login
```

**Body**

| Field | Type | Required |
|---|---|---|
| `username` | string | Yes |
| `password` | string | Yes |

**Response `200`**

```json
{
  "token": "<jwt>",
  "userId": "<mongoId>"
}
```

Tokens expire after 1 hour.

---

### Mountains

The mountains collection covers all UK and Ireland hill categories (Munros, Corbetts, Grahams, Donalds, Hewitts, etc.).

#### List Mountains

```
GET /api/mountains/mountains
```

**Query Parameters**

| Param | Description |
|---|---|
| `category` | Filter by hill category (e.g. `munro`, `corbett`) |
| `search` | Case-insensitive name search |
| `sort` | `height_desc` \| `height_asc` \| `oldest` (default: newest first) |
| `page` | Page number (default: `1`) |
| `limit` | Results per page (default: `9`) |
| `all` | Set to `true` to skip pagination and return all results |
| `userId` | If provided, each mountain gains a `status` field: `"planned"`, `"complete"`, or `null` |

**Response `200`** *(paginated)*

```json
{
  "data": [ /* Mountain objects */ ],
  "pagination": {
    "total": 282,
    "page": 1,
    "limit": 9,
    "totalPages": 32,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Response `200`** *(all=true)*

```json
{ "data": [ /* Mountain objects */ ], "total": 282 }
```

---

#### List Categories

```
GET /api/mountains/mountains/categories
```

Returns each distinct category with a count of mountains in it.

**Response `200`**

```json
[
  { "name": "corbett", "count": 222 },
  { "name": "munro", "count": 282 }
]
```

---

#### Create Mountain

```
POST /api/mountains/mountains
```

**Body**

| Field | Type |
|---|---|
| `name` | string |
| `category` | string[] |
| `country` | string |
| `meaning` | string |
| `height` | number (metres) |
| `latitude` | number |
| `longitude` | number |
| `region` | string |
| `imageUrl` | string |

**Response `201`** — the created mountain document.

---

#### Update Mountain

```
PUT /api/mountains/mountains/:id
```

Accepts any subset of the fields listed in Create Mountain. Returns the updated document.

---

#### Delete Mountain

```
DELETE /api/mountains/mountains/:id
```

**Response `200`**

```json
{ "message": "Mountain deleted", "id": "<mongoId>" }
```

---

### Completed Mountains

Log a summit with optional photos, a rating, notes, and a completion date.

#### List Completed Mountains

```
GET /api/mountains/completed-mountains
```

**Query Parameters**

| Param | Description |
|---|---|
| `userId` | Filter by user |
| `category` | Filter by mountain category |
| `search` | Case-insensitive mountain name search |
| `sort` | `date_asc` \| `date_desc` \| `newest` \| `oldest` \| `height_desc` \| `height_asc` |
| `page` / `limit` | Pagination (default limit: `9`) |
| `all` | `true` to return all results without pagination |

Each result includes the full joined `mountain` document.

---

#### Log a Completed Mountain

```
POST /api/mountains/completed-mountains
Content-Type: multipart/form-data  OR  application/json
```

| Field | Type | Notes |
|---|---|---|
| `userId` | string | Required |
| `mountainId` | string | Required |
| `rating` | number | 1–5 |
| `dateCompleted` | ISO date string | |
| `notes` | string | |
| `summitPhotos` | file(s) | Up to 10 images (multipart only) |

Photos are uploaded to Cloudinary automatically. The response includes the full mountain document.

---

#### Update a Completed Mountain

```
PUT /api/mountains/completed-mountains/:id
Content-Type: multipart/form-data  OR  application/json
```

Updatable fields: `rating`, `dateCompleted`, `notes`, `summitPhotos`.

- To **replace** the photo array, pass `summitPhotos` as a list of existing URLs (plus any new file uploads).
- To **add** photos without changing the existing list, omit `summitPhotos` from the body and just attach new files.

---

#### Delete a Completed Mountain

```
DELETE /api/mountains/completed-mountains/:id
```

---

### Planned Mountains

Mark a mountain as something you intend to climb.

#### List Planned Mountains

```
GET /api/mountains/planned-mountains
```

Accepts the same query parameters as [List Completed Mountains](#list-completed-mountains) (`userId`, `category`, `search`, `sort`, `page`, `limit`, `all`).

Each result includes the full `mountain` document and a `tripIds` array listing any trip plans this mountain belongs to.

---

#### Get a Single Planned Mountain

```
GET /api/mountains/planned-mountains/:id
```

---

#### Plan a Mountain

```
POST /api/mountains/planned-mountains
```

**Body**

| Field | Type | Required |
|---|---|---|
| `userId` | string | Yes |
| `mountainId` | string | Yes |
| `plannedDate` | ISO date string | No |

---

#### Update a Planned Mountain

```
PUT /api/mountains/planned-mountains/:id
```

Updatable fields: `mountainId`, `plannedDate`.

---

#### Delete a Planned Mountain

```
DELETE /api/mountains/planned-mountains/:id
```

---

### Trip Plans

Group multiple mountains into a named trip with optional start and end dates.

#### List Trip Plans

```
GET /api/mountains/trip-plans?userId=<id>
```

Returns all trip plans for the user, with each mountain populated and stamped with a `status` of `"completed"`, `"planned"`, or `null`.

---

#### Get a Single Trip Plan

```
GET /api/mountains/trip-plans/:id
```

---

#### Create a Trip Plan

```
POST /api/mountains/trip-plans
```

**Body**

| Field | Type | Required |
|---|---|---|
| `userId` | string | Yes |
| `title` | string | Yes |
| `description` | string | No |
| `startDate` | ISO date string | No |
| `endDate` | ISO date string | No |

---

#### Update a Trip Plan

```
PUT /api/mountains/trip-plans/:id
```

Updatable fields: `title`, `description`, `startDate`, `endDate`.

---

#### Delete a Trip Plan

```
DELETE /api/mountains/trip-plans/:id
```

When a trip is deleted, any mountains that are no longer part of another trip are automatically removed from the user's planned list.

---

#### Add a Mountain to a Trip

```
POST /api/mountains/trip-plans/:id/mountains
```

**Body**

| Field | Type | Required |
|---|---|---|
| `mountainId` | string | Yes |

Adding a mountain to a trip also adds it to the user's planned mountains (if not already there).

---

#### Remove a Mountain from a Trip

```
DELETE /api/mountains/trip-plans/:id/mountains/:mountainId
```

If this was the only trip containing that mountain, the mountain is also removed from the user's planned list.

---

### User Profile

#### Get Profile

```
GET /api/profile/user-profile/:userId
```

---

#### Create Profile

```
POST /api/profile/user-profile
Content-Type: multipart/form-data  OR  application/json
```

| Field | Type | Notes |
|---|---|---|
| `userId` | string | Required |
| `firstName` | string | |
| `lastName` | string | |
| `bio` | string | |
| `profileImage` | file | Uploaded to Cloudinary |

---

#### Update Profile

```
PUT /api/profile/user-profile/:id
Content-Type: multipart/form-data  OR  application/json
```

Updatable fields: `firstName`, `lastName`, `bio`, `userId`, `profileImage`.

---

#### Delete Profile

```
DELETE /api/profile/user-profile/:id
```

---

### Goals

Personal goals with progress tracking (e.g. "Complete all Munros by end of year").

#### Get Goals

```
GET /api/profile/goals/:userId
```

Returns all goals for the user, newest first.

---

#### Create a Goal

```
POST /api/profile/goals
```

**Body**

| Field | Type | Notes |
|---|---|---|
| `userId` | string | Required |
| `title` | string | Required |
| `description` | string | |
| `status` | string | e.g. `in_progress`, `completed` |
| `progressPercent` | number | 0–100 |
| `completedAt` | ISO date string | |
| `success` | boolean | |

---

#### Update a Goal

```
PUT /api/profile/goals/:id
```

Accepts any subset of the fields above.

---

#### Delete a Goal

```
DELETE /api/profile/goals/:id
```

---

### Stats

Summary statistics derived from a user's completed mountains.

```
GET /api/profile/stats?userId=<id>
```

**Response `200`**

```json
{
  "metersClimbed": 14230,
  "completedHikes": 48,
  "averageRating": 4.3
}
```

`averageRating` is `null` if no completed mountains have been rated. All fields default to `0` / `null` if the user has no completions.

---

### Recent Activity

A merged, reverse-chronological feed of a user's activity.

```
GET /api/profile/recent-activities?userId=<id>&limit=10
```

| Param | Description |
|---|---|
| `userId` | Required |
| `limit` | Max items to return (default: `10`) |

Each activity item has a `type` field:

| Type | Triggered by |
|---|---|
| `completed` | Logging a summit |
| `planned` | Adding a mountain to the planned list |
| `trip_created` | Creating a trip plan |

**Response `200`**

```json
{
  "data": [
    {
      "type": "completed",
      "createdAt": "2025-08-14T10:22:00.000Z",
      "dateCompleted": "2025-08-13T00:00:00.000Z",
      "rating": 5,
      "notes": "Stunning views from the summit.",
      "summitPhotos": ["https://res.cloudinary.com/..."],
      "mountain": { "name": "Ben Nevis", "height": 1345, ... }
    }
  ],
  "total": 1
}
```
